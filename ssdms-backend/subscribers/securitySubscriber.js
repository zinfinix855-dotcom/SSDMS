const EventBus = require('../services/EventBus');
const emailService = require('../services/EmailService');
const logger = require('../utils/logger');

/**
 * securitySubscriber — Responds to system-wide security events.
 */
const start = () => {
    // Phase 7 Extension: Integrity Violation Alert
    EventBus.on('INTEGRITY_VIOLATION', async (data) => {
        logger.error(`🚨 SECURITY ALERT: Integrity violation detected! (Count: ${data.count})`);
        
        await emailService.sendSecurityAlert(data);
    });

    logger.info('🛡️ securitySubscriber: Listening for security events');
};

module.exports = { start };
