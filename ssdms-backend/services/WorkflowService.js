const { randomUUID: uuidv4 } = require('crypto');
const FileRepository = require('../repositories/FileRepository');
const AppError = require('../utils/AppError');
const { STAGES, STATUS } = require('../utils/Constants');
const workflowEngine = require('../utils/WorkflowEngine');
const logger = require('../utils/logger');
const EventBus = require('./EventBus');
const { generalCache } = require('../utils/Cache');
const WorkflowRepository = require('../repositories/WorkflowRepository');
const QueueService = require('./QueueService');
const VersionService = require('./VersionService');

class WorkflowService {
    /**
     * Clear dashboard-related caches
     */
    async invalidateDashboardCache() {
        await generalCache.delete('global_stats');
        await generalCache.delete('lead_time_analytics');
        logger.debug('Dashboard caches invalidated due to workflow movement');
    }

    /**
     * Helper to wrap transactions with automatic post-commit event emission
     */
    async executeWorkflowTask(workFn) {
        const events = [];
        const bufferEvent = (name, data) => {
            // eventId and timestamp are merged INTO the data payload so the
            // frontend receives them as top-level fields for deduplication.
            const enriched = {
                ...data,
                eventId: data.eventId || uuidv4(),  // preserve caller-set id if present
                timestamp: data.timestamp || new Date().toISOString()
            };
            events.push({ name, data: enriched });
        };

        const result = await FileRepository.transaction(async (connection) => {
            return await workFn(connection, bufferEvent);
        });

        // Emit events ONLY after successful commit
        events.forEach(event => {
            EventBus.emit(event.name, event.data);
        });

        return result;
    }

    async forwardFile(visitNumber, currentStage, data, remarks, userId) {
        return await this.executeWorkflowTask(async (connection, bufferEvent) => {
            // 1. Fetch with row locking (FOR UPDATE) - MUST BE FIRST
            const file = await FileRepository.findByVisitOrSsc(visitNumber, connection, true);
            if (!file) throw new AppError('File not found', 404);

            // 2. Validate AFTER acquiring lock
            if (file.current_stage !== currentStage) {
                throw new AppError(`Workflow violation. File is currently at ${file.current_stage}`, 403);
            }

            // 3. Determine next state
            const { nextStage, fileStatus } = await workflowEngine.getNextState(currentStage, data);

            // FIX: Must pass the user's ROLE, not their ID, for transition validation
            const [userRows] = await connection.query('SELECT r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.employee_id = ?', [userId]);
            const userRole = userRows[0]?.role_name || 'Employee';
            
            const canMove = await WorkflowRepository.validateTransition(currentStage, nextStage, userRole);
            if (!canMove) {
                throw new AppError(`Role '${userRole}' is not authorized to move file from ${currentStage} to ${nextStage}`, 403);
            }

            // 4. Calculate SLA & Recalculate AI (Background)
            QueueService.scheduleAIRecalculate(file.visit_number).catch(err => logger.error('AI Schedule failed', err));
            
            const slaConfig = await WorkflowRepository.getSlaConfig(nextStage);
            const deadlineSql = slaConfig ? `DATE_ADD(NOW(), INTERVAL ${slaConfig.max_hours} HOUR)` : null;

            // 5. ATOMIC DATA UPDATES
            const diff = data ? await FileRepository.addSectionEntry(file.visit_number, currentStage, data, userId, connection) : null;
            if (data) {
                await VersionService.createVersionSnapshot(file.visit_number, currentStage, data, userId, 'update', connection);
            }
            
            // 5b. Evaluate AI Prediction Accuracy BEFORE updating Stage
            if (file.predicted_completion_hours > 0) {
                const actualHours = (Date.now() - new Date(file.updated_at).getTime()) / 3600000;
                // Breached if SLA deadline is strictly in the past
                const breached = file.deadline_at ? (new Date(file.deadline_at).getTime() < Date.now()) : false;
                await FileRepository.saveAIFeedback(file.visit_number, currentStage, file.predicted_completion_hours, actualHours, file.risk_score || 0, breached, connection);
            }

            await FileRepository.logMovement(file.visit_number, currentStage, nextStage, userId, remarks, 'Forwarded', connection);

            await FileRepository.updateFileStatusV4(
                file.visit_number, 
                nextStage, 
                fileStatus, 
                file.priority_score, 
                deadlineSql, 
                connection
            );

            // 6. STANDARDIZED EVENT (PHASE 2)
            const eventPayload = {
                event: 'WORKFLOW_STATE_CHANGED',
                type: 'FORWARD',
                source: 'USER',
                visitNumber: file.visit_number,
                fromStage: currentStage,
                toStage: nextStage,
                triggeredBy: userId,
                timestamp: new Date().toISOString(),
                metadata: { fieldChanges: diff }
            };

            // Save to Event Store (Audit Sync)
            await FileRepository.saveEvent('WORKFLOW_STATE_CHANGED', eventPayload, file.visit_number, connection);
            
            // Buffer for Socket Emission
            bufferEvent('WORKFLOW_STATE_CHANGED', eventPayload);

            await this.invalidateDashboardCache();
            return { nextStage };
        });
    }

    async returnFile(visitNumber, returnToStage, remarks, userId) {
        if (!STAGES.includes(returnToStage)) throw new AppError('Invalid return target stage', 400);

        return await this.executeWorkflowTask(async (connection, bufferEvent) => {
            const file = await FileRepository.findByVisitOrSsc(visitNumber, connection, true);
            if (!file) throw new AppError('File not found', 404);

            const currentStage = file.current_stage;
            const currentIdx = STAGES.indexOf(currentStage);
            const returnIdx = STAGES.indexOf(returnToStage);

            if (returnIdx >= currentIdx && currentStage !== 'Indexation') {
                 throw new AppError(`Cannot return forward. Current: ${currentStage}, Target: ${returnToStage}`, 400);
            }

            if (!(await WorkflowRepository.validateTransition(currentStage, returnToStage, 'Employee'))) {
                throw new AppError('Invalid backward movement according to DB rules', 400);
            }

            QueueService.scheduleAIRecalculate(file.visit_number).catch(err => logger.error('AI Schedule failed', err));
            
            const slaConfig = await WorkflowRepository.getSlaConfig(returnToStage);
            const deadlineSql = slaConfig ? `DATE_ADD(NOW(), INTERVAL ${slaConfig.max_hours} HOUR)` : null;

            await FileRepository.updateFileStatusV4(file.visit_number, returnToStage, STATUS.RETURNED, file.priority_score, deadlineSql, connection);
            await FileRepository.logMovement(file.visit_number, currentStage, returnToStage, userId, remarks, 'Returned', connection);

            const eventPayload = {
                event: 'WORKFLOW_STATE_CHANGED',
                type: 'RETURN',
                source: 'USER',
                visitNumber: file.visit_number,
                fromStage: currentStage,
                toStage: returnToStage,
                triggeredBy: userId,
                timestamp: new Date().toISOString()
            };

            await FileRepository.saveEvent('WORKFLOW_STATE_CHANGED', eventPayload, file.visit_number, connection);
            bufferEvent('WORKFLOW_STATE_CHANGED', eventPayload);

            await this.invalidateDashboardCache();
            return { returnToStage };
        });
    }

    async overrideWorkflow(visitNumber, targetStage, reason, userId, _ip) {
        if (!STAGES.includes(targetStage)) throw new AppError('Invalid target stage', 400);

        return await this.executeWorkflowTask(async (connection, bufferEvent) => {
            const file = await FileRepository.findByVisitOrSsc(visitNumber, connection, true);
            if (!file) throw new AppError('File not found', 404);

            const fromStage = file.current_stage;
            logger.warn(`WORKFLOW OVERRIDE: ${file.visit_number} ${fromStage} -> ${targetStage} (by Admin ${userId})`);

            QueueService.scheduleAIRecalculate(file.visit_number).catch(err => logger.error('AI Schedule failed', err));

            const slaConfig = await WorkflowRepository.getSlaConfig(targetStage);
            const deadlineSql = slaConfig ? `DATE_ADD(NOW(), INTERVAL ${slaConfig.max_hours} HOUR)` : null;

            // FIX: Update file, log movement, and persist event — all three were previously missing/broken
            await FileRepository.updateFileStatusV4(file.visit_number, targetStage, file.status, file.priority_score, deadlineSql, connection);
            await FileRepository.logMovement(file.visit_number, fromStage, targetStage, userId, reason || 'Admin override', 'Overridden', connection);

            // FIX: Standardized event schema — fromStage/toStage/triggeredBy so socket rooms resolve correctly
            const eventPayload = {
                event: 'WORKFLOW_STATE_CHANGED',
                type: 'OVERRIDE',
                source: 'ADMIN',
                visitNumber: file.visit_number,
                fromStage,
                toStage: targetStage,
                triggeredBy: userId,
                timestamp: new Date().toISOString(),
                metadata: { reason }
            };

            // FIX: Persist to event_store inside the transaction (was entirely absent before)
            await FileRepository.saveEvent('WORKFLOW_STATE_CHANGED', eventPayload, file.visit_number, connection);
            bufferEvent('WORKFLOW_STATE_CHANGED', eventPayload);

            await this.invalidateDashboardCache();
            return { targetStage };
        });
    }

    async processStageCompletion(visitNumber, stage, data, userId) {
        return await this.executeWorkflowTask(async (connection, bufferEvent) => {
            const file = await FileRepository.findByVisitOrSsc(visitNumber, connection, true);
            if (!file) throw new AppError('File not found', 404);
            
            if (file.current_stage !== stage) {
                throw new AppError(`Stage mismatch. Expected: ${stage}, Current: ${file.current_stage}`, 400);
            }

            // AI Feedback Capture
            if (file.predicted_completion_hours > 0) {
                const actualHours = (Date.now() - new Date(file.updated_at).getTime()) / 3600000;
                const breached = file.deadline_at ? (new Date(file.deadline_at).getTime() < Date.now()) : false;
                await FileRepository.saveAIFeedback(visitNumber, stage, file.predicted_completion_hours, actualHours, file.risk_score || 0, breached, connection);
            }

            const diff = await FileRepository.addSectionEntry(visitNumber, stage, data, userId, connection);
            await VersionService.createVersionSnapshot(visitNumber, stage, data, userId, 'update', connection);
            const { nextStage, fileStatus } = await workflowEngine.getNextState(stage, data);

            if (!nextStage) {
                await FileRepository.updateFileStatusV4(visitNumber, stage, 'Completed', file.priority_score, null, connection);
                return { status: 'Completed', visitNumber };
            }

            // FIX: Must pass the user's ROLE, not their ID, for transition validation
            const [userRows] = await connection.query('SELECT r.name as role_name FROM users u JOIN roles r ON u.role_id = r.id WHERE u.employee_id = ?', [userId]);
            const userRole = userRows[0]?.role_name || 'Employee';
            
            const isValid = await WorkflowRepository.validateTransition(stage, nextStage, userRole);
            if (!isValid) {
                throw new AppError(`Auto-transition blocked: Role '${userRole}' cannot move ${stage} -> ${nextStage}`, 403);
            }

            const slaConfig = await WorkflowRepository.getSlaConfig(nextStage);
            const deadlineSql = slaConfig ? `DATE_ADD(NOW(), INTERVAL ${slaConfig.max_hours} HOUR)` : null;

            await FileRepository.updateFileStatusV4(visitNumber, nextStage, fileStatus, file.priority_score, deadlineSql, connection);
            await FileRepository.logMovement(visitNumber, stage, nextStage, userId, 'System auto-processed', 'Forwarded', connection);

            const eventPayload = {
                event: 'WORKFLOW_STATE_CHANGED',
                type: 'AUTO_MOVE',
                source: 'SYSTEM',
                visitNumber,
                fromStage: stage,
                toStage: nextStage,
                triggeredBy: userId,
                timestamp: new Date().toISOString(),
                metadata: { changes: diff }
            };

            await FileRepository.saveEvent('WORKFLOW_STATE_CHANGED', eventPayload, visitNumber, connection);
            bufferEvent('WORKFLOW_STATE_CHANGED', eventPayload);

            await this.invalidateDashboardCache();
            return { visitNumber, from: stage, to: nextStage };
        });
    }

    async bulkAction(action, visitNumbers, data, userId) {
        if (!['Forward', 'Return'].includes(action)) throw new AppError('Invalid bulk action', 400);

        const job = await QueueService.queues.bulk.add('execute-bulk', {
            action,
            visitNumbers,
            data,
            userId,
            timestamp: new Date()
        });

        logger.info(`Bulk job ${job.id} queued for ${visitNumbers.length} files (Action: ${action})`);
        
        // This is outside the transaction wrapper because it's purely triggering a background job
        EventBus.emit('BULK_JOB_STARTED', {
            eventId: uuidv4(),
            jobId: job.id,
            action,
            count: visitNumbers.length,
            userId,
            timestamp: new Date()
        });

        return { jobId: job.id, status: 'Queued', count: visitNumbers.length };
    }
}

module.exports = new WorkflowService();

