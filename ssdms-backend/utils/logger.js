const { createLogger, format, transports } = require('winston');
require('winston-daily-rotate-file');
const path = require('path');
const fs = require('fs');

const logsDir = path.join(__dirname, '../logs');
if (!fs.existsSync(logsDir)) fs.mkdirSync(logsDir);

const dailyRotateFileTransport = (level, filename) => new transports.DailyRotateFile({
    filename: path.join(logsDir, `%DATE%-${filename}.log`),
    datePattern: 'YYYY-MM-DD',
    level: level,
    zippedArchive: true,
    maxSize: '20m',
    maxFiles: '30d'
});

const piiRedaction = format((info) => {
    const sensitiveFields = ['cnic', 'password', 'email', 'patient_name', 'token', 'refreshToken'];
    
    const redact = (obj) => {
        if (typeof obj !== 'object' || obj === null) return obj;
        
        const newObj = Array.isArray(obj) ? [...obj] : { ...obj };
        for (const key in newObj) {
            if (sensitiveFields.includes(key)) {
                newObj[key] = '[REDACTED]';
            } else if (typeof newObj[key] === 'object') {
                newObj[key] = redact(newObj[key]);
            }
        }
        return newObj;
    };

    if (info.message && typeof info.message === 'object') {
        info.message = redact(info.message);
    }
    if (info.metadata) {
        info.metadata = redact(info.metadata);
    }
    
    return redact(info);
});

const logger = createLogger({
    level: 'info',
    format: format.combine(
        format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
        format.errors({ stack: true }),
        piiRedaction(),
        format.json()
    ),
    transports: [
        dailyRotateFileTransport('error', 'error'),
        dailyRotateFileTransport('info', 'combined'),
    ],
});

if (process.env.NODE_ENV !== 'production') {
    logger.add(new transports.Console({
        format: format.combine(format.colorize(), format.simple())
    }));
}

module.exports = logger;
