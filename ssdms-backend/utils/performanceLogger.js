const logger = require('./logger');

/**
 * Telemetry middleware to track execution times and flag anomalous DB/Queue delays.
 */
const performanceLogger = (req, res, next) => {
    const startHrTime = process.hrtime();

    res.on('finish', () => {
        const elapsedHrTime = process.hrtime(startHrTime);
        const elapsedTimeInMs = elapsedHrTime[0] * 1000 + elapsedHrTime[1] / 1e6;

        // Arbitrary threshold for "SLOW" query/latency tracking (e.g., > 1000ms)
        if (elapsedTimeInMs > 1000) {
            logger.warn(`🐌 HIGH LATENCY DETECTED: [${req.method}] ${req.originalUrl} took ${elapsedTimeInMs.toFixed(3)} ms. (Possible DB Lock or Cache Miss) [CID: ${req.correlationId}]`);
        } else {
            logger.debug(`⚡ Telemetry: [${req.method}] ${req.originalUrl} - ${elapsedTimeInMs.toFixed(3)} ms`);
        }
    });

    next();
};

module.exports = performanceLogger;
