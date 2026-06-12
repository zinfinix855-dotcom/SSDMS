const rateLimit = require('express-rate-limit');
const EventBus = require('../utils/EventBus');
const logger = require('../utils/logger');

/**
 * Global rate limiter for all API routes
 */
const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per window
    message: {
        status: 'error',
        message: 'Too many requests from this IP, please try again after 15 minutes'
    },
    standardHeaders: true,
    legacyHeaders: false,
    validate: false,
});

/**
 * Stricter limiter for authentication routes (login, refresh-token)
 */
/**
 * Stricter limiter for authentication routes (login)
 * Tracks by IP + employee_id combination
 */
const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP+ID combo to 5 attempts
    keyGenerator: (req) => {
        const identifier = req.body?.authId || 'anonymous';
        // express-rate-limit 7+ validation: return the IP as the first part or use a helper
        return `${req.ip}_${identifier}`;
    },
    validate: false, // Explicitly disable validation
    handler: (req, res, next, options) => {
        const identifier = req.body?.authId || 'unknown';
        logger.warn(`Auth threshold breached by ${req.ip} for ${identifier} — Emitting AUTH_BREACH`);
        try {
            EventBus.publish('AUTH_BREACH', { 
                ip: req.ip, 
                username: identifier,
                level: 'CRITICAL',
                timestamp: new Date()
            });
        } catch(e) {
            // ignore event publish failures
        }
        res.status(options.statusCode).json(options.message);
    },
    message: {
        status: 'error',
        message: 'Too many login attempts. Please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
});

module.exports = {
    globalLimiter,
    authLimiter
};
