const redisClient = require('../config/redis');
const { sendSuccess } = require('../utils/response');
const logger = require('../utils/logger');

const idempotency = async (req, res, next) => {
    const key = req.headers['x-idempotency-key'];
    if (!key) {
        return next(); // Proceed normally if no key provided
    }

    if (!redisClient) {
        logger.warn('Redis is not available, skipping idempotency check');
        return next();
    }

    const redisKey = `idempotency:${req.user.employee_id}:${key}`;
    try {
        const existingResponse = await redisClient.get(redisKey);
        
        if (existingResponse) {
            logger.info(`Idempotency key hit for ${redisKey}`);
            const cached = JSON.parse(existingResponse);
            return res.status(cached.statusCode || 200).json(cached.body);
        }

        // Intercept response to save it
        const originalSend = res.json;
        res.json = function(body) {
            // Save successful responses only to prevent caching exact errors indefinitely
            if (res.statusCode >= 200 && res.statusCode < 300) {
                redisClient.set(redisKey, JSON.stringify({
                    statusCode: res.statusCode,
                    body: body
                }), 'EX', 86400).catch(err => logger.error(`Failed to cache idempotency: ${err.message}`));
            }
            originalSend.call(this, body);
        };

        next();
    } catch (error) {
        logger.error(`Idempotency middleware error: ${error.message}`);
        next();
    }
};

module.exports = idempotency;
