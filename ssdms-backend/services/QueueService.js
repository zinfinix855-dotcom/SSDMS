const { Queue } = require('bullmq');
const redis = require('../config/redis');
const logger = require('../utils/logger');

/**
 * QueueService — Centralized BullMQ management.
 */
class QueueService {
    constructor() {
        this.queues = {};
        // Removed this.initialize() from constructor to allow manual/delayed boot
    }

    initialize() {
        const { isRedisAvailable, createClient } = require('../config/redis');
        
        // Even if not connected yet, we use createClient() which has error handlers
        // But for BullMQ, we prefer to skip if we know it's unavailable to save resources
        if (!isRedisAvailable()) {
            logger.warn('🚀 QueueService: Redis unavailable. BullMQ Queues will NOT be initialized.');
            return;
        }

        try {
            // Phase 4: Reliability upgrades with exponential backoff
            const reliableOptions = {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 },
                removeOnComplete: true
            };

            // SLA Queue
            this.queues.sla = new Queue('sla-checks', {
                connection: createClient(),
                defaultJobOptions: reliableOptions
            });

            // Maintenance Queue (Repeatable jobs)
            this.queues.maintenance = new Queue('maintenance', {
                connection: createClient()
            });

            // AI Queue for async scoring
            this.queues.ai = new Queue('ai-scoring', {
                connection: createClient(),
                defaultJobOptions: reliableOptions
            });

            // Bulk Queue for batch processing
            this.queues.bulk = new Queue('bulk-actions', {
                connection: createClient(),
                defaultJobOptions: reliableOptions
            });

            // Reports Queue for PDF generation
            this.queues.reports = new Queue('reports', {
                connection: createClient(),
                defaultJobOptions: reliableOptions
            });

            logger.info('🚀 QueueService: BullMQ initialized (SLA, AI, Maintenance, Bulk, Reports)');
            
            // Register Repeatable Maintenance Jobs
            this.setupRepeatableJobs();
        } catch (err) {
            logger.error('❌ QueueService: Failed to initialize queues', err.message);
        }
    }


    async setupRepeatableJobs() {
        try {
            await this.queues.maintenance.add('daily-cleanup', {}, {
                repeat: { pattern: '0 2 * * *', tz: 'Asia/Karachi' } // 2 AM daily
            });
            
            // Phase 7: Weekly Executive Report (Mondays at 8 AM)
            await this.queues.reports.add('generate-weekly-summary', {}, {
                repeat: { pattern: '0 8 * * 1', tz: 'Asia/Karachi' } 
            });

            logger.info('🕒 Repeatable jobs scheduled: Maintenance (Daily 2AM), Reports (Weekly Mon 8AM)');
        } catch (err) {
            logger.error('❌ Repeatable job schedule failed:', err.message);
        }
    }

    /**
     * AI Priority Recalculation Task
     */
    async scheduleAIRecalculate(visitNumber) {
        if (!this.queues.ai) return;
        await this.queues.ai.add('recalculate', { visitNumber });
    }

    /**
     * Schedule an SLA check for a file
     * @param {string} visitNumber 
     * @param {string} stage 
     * @param {number} delayMs 
     */
    async scheduleSLACheck(visitNumber, stage, delayMs) {
        if (!this.queues.sla) return;
        
        const jobId = `sla-${visitNumber}-${stage}`;
        await this.queues.sla.add('check-violation', 
            { visitNumber, stage }, 
            { delay: delayMs, jobId }
        );
        
        logger.debug(`Scheduled SLA check for ${visitNumber} in ${stage} (In ${delayMs / 3600000}h)`);
    }

    /**
     * Cancel any pending SLA checks for a file (useful when moved before deadline)
     */
    async cancelSLACheck(visitNumber, stage) {
        if (!this.queues.sla) return;
        const jobId = `sla-${visitNumber}-${stage}`;
        const job = await this.queues.sla.getJob(jobId);
        if (job) await job.remove();
    }
}

module.exports = new QueueService();
