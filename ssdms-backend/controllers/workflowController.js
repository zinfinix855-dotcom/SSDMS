const workflowService = require('../services/WorkflowService');
const { sendSuccess } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

// @desc    Forward file to next stage
// @route   POST /api/workflow/forward
// @access  Private
const forwardFile = asyncHandler(async (req, res, next) => {
    const { visit_number, current_stage, data, remarks } = req.body;
    const result = await workflowService.forwardFile(visit_number, current_stage, data, remarks, req.user.employee_id);

    return sendSuccess(res, result, `File forwarded to ${result.nextStage}`);
});

// @desc    Admin Override File stage
// @route   POST /api/workflow/override
// @access  Private (Admin)
const overrideWorkflow = asyncHandler(async (req, res, next) => {
    const { visit_number, target_stage, reason } = req.body;
    const result = await workflowService.overrideWorkflow(visit_number, target_stage, reason, req.user.employee_id, req.ip);

    return sendSuccess(res, result, `Workflow overriden. File moved to ${result.targetStage}`);
});

// @desc    Return file
// @route   POST /api/workflow/return
// @access  Private
const returnFile = asyncHandler(async (req, res, next) => {
    const { visit_number, return_to_stage, remarks } = req.body;
    const result = await workflowService.returnFile(visit_number, return_to_stage, remarks, req.user.employee_id);

    return sendSuccess(res, result, `File returned to ${result.returnToStage}`);
});

// @desc    Perform bulk workflow actions
// @route   POST /api/workflow/bulk-action
// @access  Private (Admin, Moderator)
const bulkAction = asyncHandler(async (req, res, next) => {
    const { visit_numbers, action, remarks } = req.body;

    if (!Array.isArray(visit_numbers) || visit_numbers.length === 0) {
        throw new AppError('No files selected', 400);
    }

    const results = await workflowService.bulkAction(visit_numbers, action, remarks, req.user.employee_id);
    const successCount = results.success.length;
    const totalCount = visit_numbers.length;

    return sendSuccess(res, results, `Processed ${successCount} of ${totalCount} files successfully.`);
});

module.exports = {
    forwardFile,
    overrideWorkflow,
    returnFile,
    bulkAction
};
