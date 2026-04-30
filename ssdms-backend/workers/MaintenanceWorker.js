const archiveService = require('../services/ArchiveService');
const FileRepository = require('../repositories/FileRepository');
const AuditRepository = require('../repositories/AuditRepository');
const EventBus = require('../services/EventBus');
const logger = require('../utils/logger');
const { Worker } = require('bullmq');

const redis = require('../config/redis');

/**
 * MaintenanceWorker — Executes recurring background maintenance tasks.
 * Currently handles daily file archiving at 02:00 AM.
 */
class MaintenanceWorker {
    constructor() {
        this.worker = null;
    }

    start() {
        this.worker = new Worker('maintenance', async (job) => {
            logger.info(`[Maintenance Worker] Commencing job: ${job.name}`);

            if (job.name === 'daily-cleanup') {
                try {
                    await archiveService.archivePreviousMonth();
                    logger.info('[Maintenance Worker] Daily archiving completed.');
                } catch (err) {
                    logger.error('[Maintenance Worker] Daily archiving failed:', err.message);
                }
            }

            if (job.name === 'check-stale-files' || job.name === 'daily-cleanup' || job.name === 'verify-audit-chain') {
                try {
                    // Phase 7 Extension: Cryptographic Integrity Audit
                    if (job.name === 'verify-audit-chain' || job.name === 'daily-cleanup') {
                        logger.info('🛡️ Starting Cryptographic Integrity Audit...');
                        const violations = await AuditRepository.verifyIntegrity();
                        if (violations.length > 0) {
                            EventBus.emit('INTEGRITY_VIOLATION', { 
                                count: violations.length, 
                                details: violations.map(v => v.id) 
                            });
                        }
                    }

                    // Files with no updates for 7 days
                    const staleDays = 7;
                    const [staleFiles] = await FileRepository.pool.query(
                        `SELECT visit_number, current_stage, updated_at FROM files 
                         WHERE status != 'Completed' AND status != 'Archived' 
                         AND updated_at < DATE_SUB(NOW(), INTERVAL ? DAY) AND deleted_at IS NULL`,
                        [staleDays]
                    );

                    if (staleFiles.length > 0) {
                        logger.warn(`[Maintenance Worker] Found ${staleFiles.length} stale files.`);
                        EventBus.emit('STALE_FILES_DETECTED', { 
                            count: staleFiles.length, 
                            files: staleFiles.map(f => f.visit_number)
                        });
                    }
                } catch (err) {
                    logger.error('[Maintenance Worker] Stale check failed:', err.message);
                }
            }
        }, {
            connection: redis.connectionConfig
        });

        logger.info('🤖 [Maintenance Worker] Online and listening for schedules...');
    }
}

module.exports = new MaintenanceWorker();
