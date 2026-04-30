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
const AppError = require('../utils/AppError');

const setTenant = (req, res, next) => {
    const hospitalId = req.user?.hospital_id;

    if (!hospitalId) {
        return next(new AppError('Tenant context missing: hospital_id not found on authenticated user.', 400));
    }

    // Scope the repository singleton to this user's hospital for the duration
    // of this synchronous call chain. Background workers bypass this middleware
    // and keep the default hospitalId = 1.
    FileRepository.setTenantContext(hospitalId);

    next();
};

module.exports = setTenant;
