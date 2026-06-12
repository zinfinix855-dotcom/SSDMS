const Redis = require('ioredis');
const logger = require('../utils/logger');

const MAX_RETRIES = 5; // Reduced for faster failover

const redisConfig = {
    host: process.env.REDIS_HOST || '127.0.0.1',
    port: process.env.REDIS_PORT || 6379,
    password: process.env.REDIS_PASSWORD || undefined,
    maxRetriesPerRequest: null,
    enableOfflineQueue: false, 
    lazyConnect: true, // Use lazyConnect
    retryStrategy: (times) => {
        if (times > MAX_RETRIES) {
            return null; // Stop retrying
        }
        return Math.min(times * 100, 2000);
    }
};

/**
 * Creates a pre-configured Redis client with error handling to prevent unhandled rejections.
 */
const createClient = () => {
    const client = new Redis(redisConfig);
    client.on('error', (err) => {
        if (err.code === 'ECONNREFUSED') {
            logger.debug('Redis connection refused (silent)');
        } else {
            logger.error('Redis error:', err.message);
        }
    });
    return client;
};

// Main client for general use
const redis = createClient();
redis.connectionConfig = redisConfig;

let _redisReady = false;
redis.on('connect', () => {
    _redisReady = true;
    logger.info('✅ Redis connected');
});
redis.on('error', (_err) => {
    _redisReady = false;
});
redis.on('close', () => { _redisReady = false; });

const isRedisAvailable = () => _redisReady;

module.exports = redis;
module.exports.isRedisAvailable = isRedisAvailable;
module.exports.createClient = createClient;


