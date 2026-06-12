const crypto = require('crypto');

/**
 * Middleware to add a unique correlation ID to every request for trace-ability.
 */
const correlationIdMiddleware = (req, res, next) => {
    req.correlationId = req.headers['x-correlation-id'] || crypto.randomUUID();
    res.setHeader('x-correlation-id', req.correlationId);
    next();
};

module.exports = correlationIdMiddleware;
