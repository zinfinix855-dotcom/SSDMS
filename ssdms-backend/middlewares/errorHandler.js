const logger = require('../utils/logger');

// 404 handler – must be registered AFTER all routes
const notFound = (req, res, _next) => {
    res.status(404).json({
        status: 'error',
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};

// Generic error handler – must be last middleware (4 args)
const errorHandler = (err, req, res, _next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    // Handle MySQL Specific Errors
    if (err.code === 'ER_DUP_ENTRY') {
        err.statusCode = 409;
        err.message = 'Duplicate entry detected. This record already exists.';
        err.isOperational = true;
        err.errorCode = 'DUPLICATE_ENTRY';
    } else if (err.code === 'ER_ROW_IS_REFERENCED_2') {
        err.statusCode = 400;
        err.message = 'Current record is being used by other records. Cannot delete.';
        err.isOperational = true;
        err.errorCode = 'FOREIGN_KEY_VIOLATION';
    } else if (err.name === 'JsonWebTokenError') {
        err.statusCode = 401;
        err.message = 'Invalid secure session. Please sign in again.';
        err.isOperational = true;
        err.errorCode = 'INVALID_TOKEN';
    } else if (err.name === 'TokenExpiredError') {
        err.statusCode = 401;
        err.message = 'Secure session expired. Please sign in again.';
        err.isOperational = true;
        err.errorCode = 'TOKEN_EXPIRED';
    }

    // Log the error
    const correlationId = req.correlationId || 'N/A';
    if (err.statusCode >= 500) {
        logger.error(`[${correlationId}] ${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip} - ${err.stack}`);
    } else {
        logger.warn(`[${correlationId}] ${err.statusCode} - ${err.message} - ${req.originalUrl} - ${req.method} - ${req.ip}`);
    }

    if (process.env.NODE_ENV === 'development') {
        res.status(err.statusCode).json({
            status: err.status,
            error: err,
            message: err.message,
            stack: err.stack
        });
    } else {
        // Production: Don't leak error details for non-operational errors
        if (err.isOperational) {
            res.status(err.statusCode).json({
                status: err.status,
                message: err.message,
                errorCode: err.errorCode || 'OPERATIONAL_ERROR'
            });
        } else {
            res.status(500).json({
                status: 'error',
                message: 'Internal System Error. Please contact support.',
                errorCode: 'INTERNAL_SERVER_ERROR',
                correlationId
            });
        }
    }
};

module.exports = { notFound, errorHandler };
