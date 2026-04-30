const { Worker } = require('bullmq');
const redis = require('../config/redis');
const FileRepository = require('../repositories/FileRepository');
const WorkflowRepository = require('../repositories/WorkflowRepository');
const logger = require('../utils/logger');
const EventBus = require('../services/EventBus');
const { pool } = require('../config/database');

/**
 * SLAWorker — Dedicated processor for SLA violations.
 * Instead of polling the entire DB, it checks specific files on their deadline.
 */
class SLAWorker {
    constructor() {
        this.worker = null;
    }

    start() {
        this.worker = new Worker('sla-checks', async (job) => {
            const { visitNumber, stage } = job.data;
            logger.debug(`[SLA Worker] Commencing check for ${visitNumber} in ${stage}`);

            try {
                // Fetch current status
                const file = await FileRepository.findByVisitOrSsc(visitNumber);
                if (!file) {
                    logger.debug(`[SLA Worker] File ${visitNumber} not found, ignoring.`);
                    return;
                }

                // If file is no longer in this stage, ignore the job
                if (file.current_stage !== stage || ['Completed', 'Archived'].includes(file.status)) {
                    logger.debug(`[SLA Worker] File ${visitNumber} has moved or closed. Skipping check.`);
                    return;
                }

                const now = new Date();
                const deadline = new Date(file.deadline_at);

                if (now > deadline) {
                    const rule = await WorkflowRepository.getSlaConfig(stage);
                    const overtimeHours = (now - deadline) / (1000 * 60 * 60);

                    // Escalate
                    const level = Math.floor(overtimeHours / rule.escalation_hours);
                    
                    logger.warn(`🛑 [SLA Worker] BREACH DETECTED: ${visitNumber} (Stage: ${stage}, Overtime: ${Math.floor(overtimeHours)}h)`);

                    await pool.query(
                        'UPDATE files SET last_sla_status = ?, sla_violation_hours = ?, escalation_level = ? WHERE visit_number = ?',
                        ['Violated', overtimeHours, level, visitNumber]
                    );

                    const slaEvent = {
                        event: 'SLA_VIOLATION',
                        visitNumber,
                        stage,
                        violationHours: Math.floor(overtimeHours),
                        escalationLevel: level,
                        maxHours: rule.max_hours,
                        timestamp: new Date().toISOString()
                    };

                    // FIX: Persist SLA violations to event_store so the audit ledger is complete.
                    // Previously only workflow state changes were stored; SLA events were lost.
                    await FileRepository.saveEvent('SLA_VIOLATION', slaEvent, visitNumber);

                    EventBus.emit('SLA_VIOLATION', slaEvent);
                }
            } catch (err) {
                logger.error(`[SLA Worker] Evaluation failed for ${visitNumber}: ${err.message}`, err);
                throw err; // Signal BullMQ to retry if configured
            }
        }, {
            connection: redis.connectionConfig,
            concurrency: 5,
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 500 }
        });

        this.worker.on('failed', (job, err) => {
            logger.error(`[SLA Worker] Job ${job.id} failed: ${err.message}`);
        });

        logger.info('🤖 [SLA Worker] Online and listening for deadlines...');
    }
}

module.exports = new SLAWorker();
