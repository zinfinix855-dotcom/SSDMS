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

    logger.info('Environment variables validated successfully.');
};
