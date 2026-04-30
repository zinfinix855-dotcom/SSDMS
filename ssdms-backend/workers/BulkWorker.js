const { Worker } = require('bullmq');
const EventBus = require('../services/EventBus');
const logger = require('../utils/logger');
const FileRepository = require('../repositories/FileRepository');
const redis = require('../config/redis');

/**
 * BulkWorker — Dedicated worker for processing massive batches of files.
 * Handles background forwarding, returns, and AI score updates for bulk sets.
 */
class BulkWorker {
    constructor() {
        this.worker = null;
    }

    start(workflowService) {
        // We pass workflowService to reuse the business logic methods like forwardFile internally
        this.worker = new Worker('bulk-actions', async (job) => {
            const { action, visitNumbers, data, userId } = job.data;
            logger.info(`[Bulk Worker] Starting ${action} for ${visitNumbers.length} files (Job ID: ${job.id})`);

            const results = { success: [], failed: [] };

            for (const vn of visitNumbers) {
                try {
                    if (action === 'Forward') {
                        // FIX: forwardFile requires currentStage as 2nd arg.
                        // Fetch the file first so we pass the correct stage.
                        const file = await FileRepository.findByVisitOrSsc(vn);
                        if (!file) throw new Error(`File ${vn} not found`);
                        await workflowService.forwardFile(vn, file.current_stage, data, data?.remarks, userId);
                    } else if (action === 'Return') {
                        const { returnToStage, remarks } = data;
                        await workflowService.returnFile(vn, returnToStage, remarks, userId);
                    }
                    results.success.push(vn);
                } catch (err) {
                    logger.error(`[Bulk Worker] Failed for ${vn}: ${err.message}`);
                    results.failed.push({ visit_number: vn, reason: err.message });
                }
            }

            logger.info(`[Bulk Worker] Completed job ${job.id}. Success: ${results.success.length}, Failed: ${results.failed.length}`);
            
            // FIX: Event name aligned to BULK_ACTION_COMPLETED — SocketService and Dashboard
            // both listen for this name. The old BULK_JOB_COMPLETED was never forwarded.
            EventBus.emit('BULK_ACTION_COMPLETED', {
                jobId: job.id,
                action,
                successCount: results.success.length,
                failedCount: results.failed.length,
                failed: results.failed,
                userId,
                timestamp: new Date().toISOString()
            });
        }, {
            connection: redis.connectionConfig,
            concurrency: 1 // Keep it sequential per job to preserve DB stability, but async to the user
        });

        logger.info('🤖 [Bulk Worker] Online and listening for batch operations...');
    }
}

module.exports = new BulkWorker();
