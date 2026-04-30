const authService = require('../services/AuthService');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Auth user & get token
// @route   POST /api/auth/login
// @access  Public
const login = asyncHandler(async (req, res, next) => {
    const { authId, password } = req.body;
    const metadata = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
    };
    const result = await authService.login(authId, password, metadata);

    // Set Cookies
    res.cookie('ssdms_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 15 * 60 * 1000 // 15 minutes
    });

    res.cookie('ssdms_refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Don't send tokens in body
    delete result.token;
    delete result.refreshToken;

    return sendSuccess(res, result, 'Login successful');
});

// @desc    Refresh Access Token
// @route   POST /api/auth/refresh-token
// @access  Public
const refreshToken = asyncHandler(async (req, res, next) => {
    const token = req.cookies.ssdms_refresh_token;
    const metadata = {
        ip: req.ip || req.connection.remoteAddress,
        userAgent: req.get('user-agent')
    };
    const result = await authService.refreshToken(token, metadata);

    // Update Cookies
    res.cookie('ssdms_token', result.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 15 * 60 * 1000
    });

    res.cookie('ssdms_refresh_token', result.refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Strict',
        maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return sendSuccess(res, null, 'Token refreshed');
});

// @desc    Logout User
// @route   POST /api/auth/logout
// @access  Public
const logout = asyncHandler(async (req, res, next) => {
    res.clearCookie('ssdms_token');
    res.clearCookie('ssdms_refresh_token');
    return sendSuccess(res, null, 'Logged out successfully');
});

// @desc    Setup Password on first login
// @route   POST /api/auth/setup-password
// @access  Private
const setupPassword = asyncHandler(async (req, res, next) => {
    const { password } = req.body;
    const employeeId = req.user.employee_id;

    await authService.updatePassword(employeeId, password);
    
    return sendSuccess(res, null, 'Password updated successfully');
});

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
const getMe = asyncHandler(async (req, res, next) => {
    return sendSuccess(res, { user: req.user }, 'Current user profile retrieved');
});

module.exports = {
    login,
    getMe,
    refreshToken,
    logout,
    setupPassword
};
