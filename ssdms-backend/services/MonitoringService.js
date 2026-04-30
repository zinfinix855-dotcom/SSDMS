const EventBus = require('./EventBus');
const logger = require('../utils/logger');

/**
 * MonitoringService — observability layer.
 * Listens to all workflow events and logs them for operational monitoring.
 */
class MonitoringService {
    constructor() {
        this.initializeListeners();
    }

    initializeListeners() {
        EventBus.on('FILE_FORWARDED', this.handleFileForwarded.bind(this));
        EventBus.on('FILE_RETURNED', this.handleFileReturned.bind(this));
        EventBus.on('SLA_VIOLATION', this.handleSLAViolation.bind(this));
        EventBus.on('WORKFLOW_OVERRIDDEN', this.handleOverride.bind(this));
        EventBus.on('BULK_ACTION_COMPLETED', this.handleBulkAction.bind(this));

        logger.info('⚡ MonitoringService initialized — observing EventBus');
    }

    handleFileForwarded({ visitNumber, from, to, userId }) {
        logger.info(`[MONITOR] File ${visitNumber} forwarded: ${from} → ${to} (by ${userId})`);
    }

    handleFileReturned({ visitNumber, from, to, userId }) {
        logger.warn(`[MONITOR] File ${visitNumber} returned: ${from} → ${to} (by ${userId})`);
    }

    handleSLAViolation({ visitNumber, stage, hoursInStage, maxHours }) {
        logger.error(`[SLA BREACH] File ${visitNumber} in ${stage}: ${hoursInStage}h elapsed (limit: ${maxHours}h)`);
    }

    handleOverride({ visitNumber, from, to, userId, reason }) {
        logger.warn(`[SENSITIVE] Workflow override: ${visitNumber} from ${from} → ${to} by ${userId}. Reason: ${reason}`);
    }

    handleBulkAction({ action, count, userId }) {
        logger.info(`[MONITOR] Bulk action '${action}' completed for ${count} files (by ${userId})`);
    }
}

module.exports = new MonitoringService();
