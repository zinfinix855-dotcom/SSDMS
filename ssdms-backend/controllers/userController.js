const userService = require('../services/UserService');
const { authCache } = require('../utils/Cache');
const { sendSuccess, sendPaginated } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get all users (paginated)
const getUsers = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const { users, total } = await userService.getPaginatedUsers(page, limit);
    return sendPaginated(res, users, page, limit, total, 'Users retrieved');
});

// @desc    Create new user
const createUser = asyncHandler(async (req, res, next) => {
    const user = await userService.createUser(req.body);
    return sendSuccess(res, user, 'User created successfully', 201);
});

// @desc    Reset password for a user
const resetPassword = asyncHandler(async (req, res, next) => {
    const { employee_id, new_password } = req.body;
    await userService.resetUserPassword(employee_id, new_password);
    
    // Invalidate cache
    authCache.delete(employee_id);
    
    return sendSuccess(res, null, 'Password reset successfully');
});

// @desc    Update user details
const updateUser = asyncHandler(async (req, res, next) => {
    const employee_id = req.params.id;
    await userService.updateUserDetails(employee_id, req.body);
    
    // Invalidate cache
    authCache.delete(employee_id);

    return sendSuccess(res, null, 'User updated successfully');
});

module.exports = {
    getUsers,
    createUser,
    resetPassword,
    updateUser
};
