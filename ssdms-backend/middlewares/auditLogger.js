const auditRepository = require('../repositories/AuditRepository');

/**
 * Automatically inserts a row into audit_logs for every
 * non-GET request made by an authenticated user.
 */
const auditLogger = async (req, res, next) => {
    // Only log mutating methods for authenticated users
    if (!['POST', 'PUT', 'DELETE', 'PATCH'].includes(req.method) || !req.user) {
        return next();
    }

    // Build a human-readable action string
    let action = `${req.method} ${req.originalUrl}`;

    // More descriptive actions for common routes
    if (req.originalUrl.includes('/auth/login')) action = 'User Login';
    if (req.originalUrl.includes('/files/admission')) action = 'Created New Admission File';
    if (req.originalUrl.includes('/workflow/forward')) action = 'Forwarded File to Next Stage';
    if (req.originalUrl.includes('/workflow/return')) action = 'Returned File to Previous Stage';
    if (req.originalUrl.includes('/users') && req.method === 'POST') action = 'Created New User';
    if (req.originalUrl.includes('/users') && req.method === 'PUT') action = 'Updated User Profile';

    // Try to extract a target resource from common body or param fields
    const targetResource =
        req.params.visitNumber ||
        req.body.visit_number ||
        req.params.id ||
        req.body.employee_id ||
        null;

    // Execute via Repository for tamper-proof hashing
    auditRepository.logAction({
        employeeId: req.user.employee_id,
        action,
        targetResource,
        ipAddress: req.ip || req.connection.remoteAddress
    }).catch(err => console.error('Audit log insertion failed:', err.message));

    next();
};

module.exports = { auditLogger };
