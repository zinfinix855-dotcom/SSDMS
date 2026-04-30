const { Worker } = require('bullmq');
const redisClient = require('../config/redis');
const logger = require('../utils/logger');
// const { generateExcel } = require('../services/ExportService'); // Example external logic

const exportWorker = new Worker('ssdms-tasks', async job => {
    switch (job.name) {
        case 'export-excel':
            logger.info(`Processing Excel export job ${job.id}`);
            // await generateExcel(job.data);
            await new Promise(res => setTimeout(res, 3000)); // Dummy background work
            logger.info(`Completed Excel export job ${job.id}`);
            return { status: 'success', fileUrl: '/exports/file.xlsx' };
        default:
            throw new Error(`Unknown job type: ${job.name}`);
    }
}, { connection: redisClient });

exportWorker.on('completed', job => {
    logger.info(`Job ${job.id} completed!`);
});

exportWorker.on('failed', (job, err) => {
    logger.error(`Job ${job.id} failed with ${err.message}`);
});

module.exports = exportWorker;
