const crypto = require('crypto');

/**
 * Custom CSRF protection middleware (Double Submit Cookie pattern)
 * Replacement for deprecated 'csurf' library.
 */
const csrfMiddleware = (req, res, next) => {
    // 1. Skip for non-state-changing methods
    const safeMethods = ['GET', 'HEAD', 'OPTIONS'];
    if (safeMethods.includes(req.method)) {
        return next();
    }

    // 2. Skip for specific routes (Login, Refresh) if needed
    const excludedPaths = ['/api/v1/auth/login', '/api/v1/auth/refresh-token'];
    const normalizedPath = req.path.replace(/\/+$/, ''); // Remove trailing slashes
    if (excludedPaths.includes(normalizedPath)) {
        return next();
    }

    // 3. Extract tokens
    const csrfCookie = req.cookies['XSRF-TOKEN'];
    const csrfHeader = req.get('X-XSRF-TOKEN');

    // 4. Validate
    if (!csrfCookie || !csrfHeader) {
        return res.status(403).json({
            status: 'error',
            message: 'CSRF token missing. Action denied.'
        });
    }

    // Constant-time comparison to prevent timing attacks
    const cookieBuf = Buffer.from(csrfCookie);
    const headerBuf = Buffer.from(csrfHeader);

    if (cookieBuf.length !== headerBuf.length || !crypto.timingSafeEqual(cookieBuf, headerBuf)) {
        return res.status(403).json({
            status: 'error',
            message: 'CSRF token mismatch. Action denied.'
        });
    }

    next();
};

/**
 * Utility to set a new CSRF cookie on the response
 */
const setCsrfToken = (req, res, next) => {
    // Only set if not already present or for specific initialization
    if (!req.cookies['XSRF-TOKEN']) {
        const token = crypto.randomBytes(32).toString('hex');
        res.cookie('XSRF-TOKEN', token, {
            httpOnly: false, // Must be readable by client JS to set the header
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict',
            path: '/'
        });
    }
    next();
};

module.exports = { csrfMiddleware, setCsrfToken };
