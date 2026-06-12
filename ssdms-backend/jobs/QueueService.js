const { Queue } = require('bullmq');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');

// Queue instance for Background Tasks (Exports, Heavy Calculations)
const taskQueue = new Queue('ssdms-tasks', { connection: redisClient });

const QueueService = {
    async addExportJob(payload) {
        if(!redisClient) return null;
        try {
            const job = await taskQueue.add('export-excel', payload, {
                attempts: 3,
                backoff: { type: 'exponential', delay: 2000 }
            });
            logger.info(`Export job added to queue: ${job.id}`);
            return job;
        } catch(err) {
            logger.error(`Failed to add export job to queue: ${err.message}`);
            return null;
        }
    }
};

module.exports = QueueService;
