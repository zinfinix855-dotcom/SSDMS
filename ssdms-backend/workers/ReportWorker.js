const { Worker } = require('bullmq');
const redis = require('../config/redis');
const PDFDocument = require('pdfkit');
const fs = require('fs');
const path = require('path');
const DashboardRepository = require('../repositories/DashboardRepository');
const emailService = require('../services/EmailService');
const logger = require('../utils/logger');

/**
 * ReportWorker — Generates Executive PDF Summaries.
 */
let worker = null;

const start = () => {
    if (worker) return;

    worker = new Worker('reports', async (job) => {
        if (job.name === 'generate-weekly-summary') {
            logger.info('📊 Starting Weekly Executive Report Generation...');

            try {
                const stats = await DashboardRepository.getGlobalStats();
                const archiveDir = path.join(__dirname, '../archives/reports');
                if (!fs.existsSync(archiveDir)) fs.mkdirSync(archiveDir, { recursive: true });

                const filename = `Executive_Summary_${new Date().toISOString().split('T')[0]}.pdf`;
                const filePath = path.join(archiveDir, filename);

                const doc = new PDFDocument({ margin: 50 });
                doc.pipe(fs.createWriteStream(filePath));

                // Header - SSDMS Identity
                doc.fillColor('#2563eb').fontSize(24).text('SSDMS Executive Summary', { align: 'center' });
                doc.fillColor('#64748b').fontSize(10).text(`Generated: ${new Date().toLocaleString()}`, { align: 'center' });
                doc.moveDown(2);

                // 1. Throughput Stats
                doc.fillColor('#1e293b').fontSize(16).text('Operational Throughput', { underline: true });
                doc.moveDown();
                doc.fontSize(12).fillColor('#334155');
                doc.text(`Total Active Files: ${stats.totalFiles || 0}`);
                doc.text(`New Admittances (24h): ${stats.newAdmissions || 0}`);
                doc.text(`Files Completed (24h): ${stats.completedToday || 0}`);
                doc.moveDown(2);

                // 2. SLA Compliance
                doc.fontSize(16).fillColor('#1e293b').text('SLA Compliance & Risk', { underline: true });
                doc.moveDown();
                doc.fontSize(12).fillColor('#334155');
                doc.text(`Total SLA Breaches: ${stats.breaches || 0}`, { color: '#ef4444' });
                doc.text(`High Risk Files: ${stats.highPriority || 0}`, { color: '#f59e0b' });
                doc.moveDown(2);

                // 3. Stage Distribution
                doc.fontSize(16).fillColor('#1e293b').text('Departmental Distribution', { underline: true });
                doc.moveDown();
                if (stats.byStage) {
                    stats.byStage.forEach(s => {
                        doc.fontSize(11).text(`${s.current_stage}: ${s.count} Files`);
                    });
                }

                // Footer
                doc.fontSize(8).fillColor('#94a3b8').text('Confidential - Internal Hospital Use Only', 50, 700, { align: 'center' });

                doc.end();
                logger.info(`✅ Weekly Report archived: ${filename}`);
                
                // Phase 7 Extension: Automated Email Delivery
                await emailService.sendWeeklyReport(filePath, filename);

                return { filename, path: filePath };
            } catch (err) {
                logger.error('❌ Failed to generate weekly report:', err.message);
                throw err;
            }
        }
    }, { 
        connection: redis.connectionConfig,
        concurrency: 1,
        removeOnComplete: { count: 50 },
        removeOnFail: { count: 100 }
    });

    worker.on('failed', (job, err) => {
        logger.error(`[ReportWorker] Job ${job.id} failed: ${err.message}`);
    });

    logger.info('📊 ReportWorker: Lifecycle active');
};

module.exports = { start };
