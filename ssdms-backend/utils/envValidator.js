const logger = require('./logger');

const requiredEnvVars = [
    'NODE_ENV', 'PORT', 'DB_HOST', 'DB_USER', 'DB_PASSWORD', 'DB_NAME',
    'REDIS_HOST', 'REDIS_PORT', 'JWT_SECRET', 'JWT_REFRESH_SECRET'
];

exports.validateEnv = () => {
    let varsToCheck = [...requiredEnvVars];

    if (process.env.NODE_ENV === 'production') {
        varsToCheck.push('SENTRY_DSN');
    }

    const missing = varsToCheck.filter(e => !process.env[e]);
    if (missing.length > 0) {
        logger.error(`CRITICAL: Missing required environment variables: ${missing.join(', ')}`);
        logger.error('System shutting down immediately to prevent unsafe state.');
        process.exit(1);
    }
    
    // Fail-fast edge case: Weak secrets
    if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 64) {
        logger.error('CRITICAL: JWT_SECRET must be at least 64 characters long.');
        process.exit(1);
    }

    if (!process.env.JWT_REFRESH_SECRET || process.env.JWT_REFRESH_SECRET.length < 64) {
        logger.error('CRITICAL: JWT_REFRESH_SECRET must be at least 64 characters long.');
        process.exit(1);
    }

    // Additional security validations
    if (!process.env.COOKIE_SECRET || process.env.COOKIE_SECRET.length < 32) {
        logger.error('CRITICAL: COOKIE_SECRET is required and must be at least 32 characters long.');
        process.exit(1);
    }

    if (process.env.ENCRYPTION_KEY && process.env.ENCRYPTION_KEY.length < 32) {
        logger.error('CRITICAL: ENCRYPTION_KEY must be at least 32 characters long.');
        process.exit(1);
    }

    if (process.env.BINDEX_SALT && process.env.BINDEX_SALT.length < 16) {
        logger.error('CRITICAL: BINDEX_SALT should be at least 16 characters long.');
        process.exit(1);
    }

    if (!process.env.DB_PASSWORD || process.env.DB_PASSWORD.length < 8) {
        logger.error('CRITICAL: DB_PASSWORD missing or too weak. Please set a strong DB password.');
        process.exit(1);
    }

    logger.info('Environment variables validated successfully.');
};
