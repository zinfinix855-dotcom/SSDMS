/**
 * Centralized environment configuration.
 * Maps process.env variables to a structured object.
 */
const config = {
    env: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT || '5000', 10),
    
    db: {
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME || 'ssdms',
        port: parseInt(process.env.DB_PORT || '3306', 10),
    },

    redis: {
        host: process.env.REDIS_HOST || '127.0.0.1',
        port: parseInt(process.env.REDIS_PORT || '6379', 10),
        password: process.env.REDIS_PASSWORD || null,
    },

    jwtSecret: process.env.JWT_SECRET,
    jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET,
    jwtRefreshExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || '7d',

    cookieSecret: process.env.COOKIE_SECRET || 'ssdms_secret_placeholder',
    totpIssuer: process.env.TOTP_ISSUER_NAME || 'SSDMS-Enterprise',
    corsOrigin: (process.env.CORS_ORIGIN || 'http://localhost:5173,http://localhost:3000').split(','),
};

module.exports = config;
