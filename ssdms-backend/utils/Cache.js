const redisClient = require('../config/redis');
const logger = require('./logger');

class Cache {
    constructor(prefix, ttlSeconds = 600) {
        this.prefix = prefix;
        this.ttl = ttlSeconds;
        this.fallbackStore = new Map();
    }

    async set(key, value) {
        const fullKey = `${this.prefix}:${key}`;
        if (redisClient) {
            try {
                await redisClient.set(fullKey, JSON.stringify(value), 'EX', this.ttl);
                return;
            } catch (err) {
                logger.warn(`Redis set failed, using fallback: ${err.message}`);
            }
        }
        this.fallbackStore.set(key, { value, expiry: Date.now() + this.ttl * 1000 });
    }

    async get(key) {
        const fullKey = `${this.prefix}:${key}`;
        if (redisClient) {
            try {
                const data = await redisClient.get(fullKey);
                if (data) return JSON.parse(data);
                return null;
            } catch (err) {
                logger.warn(`Redis get failed, using fallback: ${err.message}`);
            }
        }
        const item = this.fallbackStore.get(key);
        if (!item) return null;
        if (Date.now() > item.expiry) {
            this.fallbackStore.delete(key);
            return null;
        }
        return item.value;
    }

    async delete(key) {
        const fullKey = `${this.prefix}:${key}`;
        if (redisClient) {
            try {
                await redisClient.del(fullKey);
            } catch (err) {
                logger.warn(`Redis del failed: ${err.message}`);
            }
        }
        this.fallbackStore.delete(key);
    }
}

module.exports = {
    authCache: new Cache('auth', 300), 
    generalCache: new Cache('gen', 600)
};
