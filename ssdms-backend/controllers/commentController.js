const commentService = require('../services/CommentService');
const { sendSuccess } = require('../utils/response');

// @desc    Add comment to file
// @route   POST /api/files/:visitNumber/comments
// @access  Private
const addComment = async (req, res, next) => {
    try {
        const { visitNumber } = req.params;
        const { comment } = req.body;
        const employee_id = req.user.employee_id;

        const newComment = await commentService.addComment(visitNumber, employee_id, comment);

        return sendSuccess(res, newComment, 'Comment added successfully', 201);
    } catch (error) {
        next(error);
    }
};

// @desc    Get comments for a file
// @route   GET /api/files/:visitNumber/comments
// @access  Private
const getComments = async (req, res, next) => {
    try {
        const { visitNumber } = req.params;
        const comments = await commentService.getFileComments(visitNumber);

        return sendSuccess(res, comments, 'Comments retrieved');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    addComment,
    getComments
};
