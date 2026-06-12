const authService = require('../services/AuthService');
const asyncHandler = require('../utils/asyncHandler');
const BaseController = require('./BaseController');

/**
 * AuthController
 * Manages secure authentication, token rotation, and identity lifecycle.
 */
class AuthController extends BaseController {
    /**
     * @desc    Auth user & get token
     * @route   POST /api/auth/login
     */
    login = asyncHandler(async (req, res) => {
        const { authId, password } = req.body;
        const metadata = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
        };
        const result = await authService.login(authId, password, metadata);

        // Set Secure Cookies
        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        };

        res.cookie('ssdms_token', result.token, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000 // 15 minutes
        });

        res.cookie('ssdms_refresh_token', result.refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });

        // Strip tokens from body payload
        delete result.token;
        delete result.refreshToken;

        return this.success(res, result, 'Identity verified. Access granted.');
    });

    /**
     * @desc    Refresh Access Token
     * @route   POST /api/auth/refresh-token
     */
    refreshToken = asyncHandler(async (req, res) => {
        const token = req.cookies.ssdms_refresh_token;
        const metadata = {
            ip: req.ip || req.connection.remoteAddress,
            userAgent: req.get('user-agent')
        };
        const result = await authService.refreshToken(token, metadata);

        const cookieOptions = {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'Strict'
        };

        res.cookie('ssdms_token', result.token, {
            ...cookieOptions,
            maxAge: 15 * 60 * 1000
        });

        res.cookie('ssdms_refresh_token', result.refreshToken, {
            ...cookieOptions,
            maxAge: 7 * 24 * 60 * 60 * 1000
        });

        return this.success(res, null, 'Security token rotated.');
    });

    /**
     * @desc    Logout User
     * @route   POST /api/auth/logout
     */
    logout = asyncHandler(async (req, res) => {
        res.clearCookie('ssdms_token');
        res.clearCookie('ssdms_refresh_token');
        return this.success(res, null, 'Session terminated.');
    });

    /**
     * @desc    Setup Password on first login
     * @route   POST /api/auth/setup-password
     */
    setupPassword = asyncHandler(async (req, res) => {
        const { password } = req.body;
        const employeeId = req.user.employee_id;

        await authService.updatePassword(employeeId, password);
        return this.success(res, null, 'Credential profile established.');
    });

    /**
     * @desc    Get current logged in user
     * @route   GET /api/auth/me
     */
    getMe = asyncHandler(async (req, res) => {
        return this.success(res, { user: req.user }, 'Identity profile retrieved.');
    });
}

module.exports = new AuthController();
