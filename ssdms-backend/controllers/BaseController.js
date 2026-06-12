/**
 * BaseController.js
 * Standardized response engine for SSDMS Enterprise API.
 */
class BaseController {
    /**
     * Send standardized success response
     */
    success(res, data = null, message = 'Operation successful', code = 200) {
        return res.status(code).json({
            status: 'success',
            message,
            data
        });
    }

    /**
     * Send standardized error response
     */
    error(res, message = 'Internal Server Error', code = 500, errors = null) {
        return res.status(code).json({
            status: 'error',
            message,
            errors
        });
    }

    /**
     * Send 404 response
     */
    notFound(res, message = 'Resource not found') {
        return this.error(res, message, 404);
    }

    /**
     * Send 400 response
     */
    badRequest(res, message = 'Invalid request parameters', errors = null) {
        return this.error(res, message, 400, errors);
    }

    /**
     * Send 403 response
     */
    forbidden(res, message = 'Insufficient permissions') {
        return this.error(res, message, 403);
    }
}

module.exports = BaseController;
