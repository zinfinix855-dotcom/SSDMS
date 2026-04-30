const attachmentService = require('../services/AttachmentService');
const { sendSuccess } = require('../utils/response');

// @desc    Upload attachment for a file
// @route   POST /api/files/:visitNumber/attachments
// @access  Private
const uploadAttachment = async (req, res, next) => {
    try {
        const { visitNumber } = req.params;
        const employee_id = req.user.employee_id;

        if (!req.file) {
            return res.status(400).json({ status: 'error', message: 'No file uploaded' });
        }

        const attachment = await attachmentService.saveAttachment(visitNumber, employee_id, req.file);

        return sendSuccess(res, attachment, 'Document uploaded successfully', 201);
    } catch (error) {
        next(error);
    }
};

// @desc    Get attachments for a file
// @route   GET /api/files/:visitNumber/attachments
// @access  Private
const getAttachments = async (req, res, next) => {
    try {
        const { visitNumber } = req.params;
        const attachments = await attachmentService.getFileAttachments(visitNumber);

        return sendSuccess(res, attachments, 'Attachments retrieved');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    uploadAttachment,
    getAttachments
};
