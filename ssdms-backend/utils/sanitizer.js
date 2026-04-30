const xss = require('xss');

/**
 * Recursively sanitizes an object or string to prevent XSS.
 * Designed to handle deep JSON blobs (e.g., section_entries) that shallow sanitizers miss.
 */
const deepSanitize = (data) => {
    if (typeof data === 'string') {
        return xss(data);
    }
    
    if (Array.isArray(data)) {
        return data.map(item => deepSanitize(item));
    }
    
    if (typeof data === 'object' && data !== null) {
        const sanitized = {};
        for (const key in data) {
            sanitized[key] = deepSanitize(data[key]);
        }
        return sanitized;
    }
    
    return data;
};

const sanitizeMiddleware = (req, res, next) => {
    if (req.body) req.body = deepSanitize(req.body);
    if (req.query) req.query = deepSanitize(req.query);
    if (req.params) req.params = deepSanitize(req.params);
    next();
};

module.exports = { deepSanitize, sanitizeMiddleware };
