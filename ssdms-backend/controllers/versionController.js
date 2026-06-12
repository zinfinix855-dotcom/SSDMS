const versionService = require('../services/VersionService');
const { sendSuccess } = require('../utils/response');

// @desc    Get workbook version history
// @route   GET /api/v1/versions/:visitNumber
// @access  Private
const getVersionHistory = async (req, res, next) => {
    try {
        const { visitNumber } = req.params;
        const history = await versionService.getHistory(visitNumber);

        return sendSuccess(res, history, 'Workbook version history retrieved successfully');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getVersionHistory
};
