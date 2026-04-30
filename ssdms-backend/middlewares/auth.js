const { verifyToken } = require('../utils/jwt');
const userRepository = require('../repositories/UserRepository');
const AppError = require('../utils/AppError');
const { authCache } = require('../utils/Cache');

/**
 * Protect routes - Verify JWT and attach user to request
 */
const protect = async (req, res, next) => {
    try {
        let token;

        if (req.cookies && req.cookies.ssdms_token) {
            token = req.cookies.ssdms_token;
        } else if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            return next(new AppError('No token provided. Please login.', 401));
        }

        const decoded = verifyToken(token);
        
        // Caching: Check for cached user data
        const cachedUser = await authCache.get(decoded.employee_id);
        let user;

        if (cachedUser) {
            user = cachedUser;
        } else {
            user = await userRepository.findByAuthId(decoded.employee_id);
            if (user) {
                await authCache.set(decoded.employee_id, user);
            }
        }

        if (!user) {
            return next(new AppError('The user belonging to this token no longer exists.', 401));
        }

        if (!user.is_active) {
            return next(new AppError('User account is deactivated.', 401));
        }

        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return next(new AppError('Invalid token. Please login again.', 401));
        }
        if (error.name === 'TokenExpiredError') {
            return next(new AppError('Token expired. Please login again.', 401));
        }
        next(error);
    }
};

/**
 * Restrict access to specific roles
 */
const restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role_name)) {
            return next(new AppError(`Access denied. Your role (${req.user.role_name}) does not have permission for this action.`, 403));
        }
        next();
    };
};

/**
 * Restrict access based on hospital section assignment
 * Admin and Moderators bypass section checks
 */
const restrictToSection = (sectionName) => {
    return (req, res, next) => {
        if (req.user.role_name === 'Admin' || req.user.role_name === 'Moderator') {
            return next();
        }

        let assignedSections = [];
        try {
            if (typeof req.user.assigned_sections === 'string') {
                assignedSections = JSON.parse(req.user.assigned_sections || '[]');
            } else if (Array.isArray(req.user.assigned_sections)) {
                assignedSections = req.user.assigned_sections;
            }
        } catch (e) {
            assignedSections = [];
        }

        const normalizedSection = sectionName.trim();
        const hasAccess = assignedSections.includes('*') || assignedSections.includes(normalizedSection);

        if (!hasAccess) {
            return next(new AppError(`Unauthorized Access: You are not assigned to the ${normalizedSection} section.`, 403));
        }
        next();
    };
};

module.exports = { protect, restrictTo, restrictToSection };
