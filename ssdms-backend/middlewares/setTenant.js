/**
 * setTenant middleware
 *
 * Injects the calling user's hospital_id into every repository singleton
 * before the request reaches a controller. This makes multitenancy work
 * without requiring every service/repository method to accept an explicit
 * hospitalId argument.
 *
 * MUST be placed AFTER the `protect` auth middleware so req.user is populated.
 *
 * Usage in a route file:
 *   router.post('/forward', protect, setTenant, validate(...), forwardFile);
 */
const FileRepository = require('../repositories/FileRepository');
const DashboardRepository = require('../repositories/DashboardRepository');
const AttachmentRepository = require('../repositories/AttachmentRepository');
const CommentRepository = require('../repositories/CommentRepository');
const FinanceRepository = require('../repositories/FinanceRepository');
const AppError = require('../utils/AppError');

const setTenant = (req, res, next) => {
    let hospitalId = req.user?.hospital_id;

    // Allow Admin users to override hospital_id using X-Hospital-Id header
    if (req.user?.role_name === 'Admin' && req.headers['x-hospital-id']) {
        const headerId = parseInt(req.headers['x-hospital-id'], 10);
        if (!isNaN(headerId)) {
            hospitalId = headerId;
        }
    }

    if (!hospitalId) {
        return next(new AppError('Tenant context missing: hospital_id not found on authenticated user.', 400));
    }

    // Scope the repository singletons to this hospital for the duration of this request
    FileRepository.setTenantContext(hospitalId);
    DashboardRepository.setTenantContext(hospitalId);
    AttachmentRepository.setTenantContext(hospitalId);
    CommentRepository.setTenantContext(hospitalId);
    FinanceRepository.setTenantContext(hospitalId);

    next();
};

module.exports = setTenant;
