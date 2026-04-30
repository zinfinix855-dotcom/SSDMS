const EventBus = require('../services/EventBus');
const logger = require('../utils/logger');

/**
 * Common event handlers for system alerts and notifications.
 */
EventBus.on('SLA_VIOLATION', (event) => {
    logger.error(`ALERT: SLA Violation detected for ${event.visitNumber} in ${event.stage}. Exceeded by ${event.hoursInStage - event.maxHours} hours.`);
});

EventBus.on('WORKFLOW_OVERRIDDEN', (event) => {
    logger.warn(`SENSITIVE: Workflow override performed on ${event.visitNumber} by ${event.userId}. Reason: ${event.reason}`);
});
