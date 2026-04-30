const dotenv = require('dotenv');
dotenv.config();

const { validateEnv } = require('./utils/envValidator');
validateEnv();

const http = require('http');
const app = require('./app');
const { testConnection } = require('./config/database');
const logger = require('./utils/logger');
const redis = require('./config/redis');
const config = require('./config/env');

// Boot non-Redis services immediately
require('./services/MonitoringService');
require('./services/AlertService');
// NOTE: SLAService (polling) has been REMOVED. SLA enforcement is handled
// exclusively by SLAWorker (BullMQ) to prevent a dual-write race condition
// where both processes updated files.last_sla_status without coordination.
const socketService = require('./services/SocketService');
const workflowService = require('./services/WorkflowService');
const workflowSubscriber = require('./subscribers/workflowSubscriber');
const securitySubscriber = require('./subscribers/securitySubscriber');

let server;

// Handle uncaught exceptions gracefully
process.on('uncaughtException', err => {
    logger.error('UNCAUGHT EXCEPTION! 💥 Shutting down...', err);
    if (server) {
        server.close(() => process.exit(1));
    } else {
        process.exit(1);
    }
});

// Boot Redis-dependent workers only if Redis is available
const startRedisWorkers = () => {
    const { isRedisAvailable } = require('./config/redis');
    const queueService = require('./services/QueueService');

    if (!isRedisAvailable()) {
        logger.warn('⚠️  Redis unavailable — BullMQ workers (SLA, AI, Maintenance, Bulk, Reports) are DISABLED. Core API is fully operational.');
        return;
    }

    try {
        queueService.initialize(); // Boot queues first
        const slaWorker = require('./workers/SLAWorker');
        const aiWorker = require('./workers/AIWorker');
        const maintenanceWorker = require('./workers/MaintenanceWorker');
        const bulkWorker = require('./workers/BulkWorker');
        const reportWorker = require('./workers/ReportWorker');

        slaWorker.start();
        aiWorker.start();
        maintenanceWorker.start();
        bulkWorker.start(workflowService);
        reportWorker.start();
        logger.info('✅ BullMQ Workers started (Redis connected).');
    } catch (err) {
        logger.error('❌ Failed to start BullMQ workers:', err.message);
    }
};

// Start Server
const startServer = async () => {
    validateEnv();
    await testConnection();

    server = http.createServer(app);

    // Initialize real-time bridge
    socketService.initialize(server);

    // Always boot event subscribers (they don't need Redis)
    workflowSubscriber.start();
    securitySubscriber.start();

    server.listen(config.port, () => {
        logger.info(`🚀 Enterprise Server running on port ${config.port} in ${config.env} mode`);
    });

    // Boot workers only when Redis is ready
    redis.on('ready', () => {
        logger.info('🔔 Redis is ready — initializing BullMQ workers...');
        startRedisWorkers();
    });

    // Fallback: If Redis was already ready before the listener was attached
    if (redis.status === 'ready') {
        startRedisWorkers();
    }

    const gracefulShutdown = (signal) => {
        logger.info(`Received ${signal}. Shutting down gracefully...`);
        redis.disconnect();
        server.close(() => {
            logger.info('HTTP server closed.');
            process.exit(0);
        });

        // Force close after 10s
        setTimeout(() => {
            logger.error('Could not close connections in time, forcefully shutting down');
            process.exit(1);
        }, 10000).unref();
    };

    process.on('SIGINT', () => gracefulShutdown('SIGINT'));
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));

    process.on('unhandledRejection', err => {
        logger.error('UNHANDLED REJECTION! 💥 Shutting down...', err);
        if (server) {
            server.close(() => process.exit(1));
        } else {
            process.exit(1);
        }
    });
};

startServer();
