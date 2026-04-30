const financeService = require('../services/FinanceService');

/**
 * Get all finance splits for a file
 */
const getFileSplits = async (req, res, next) => {
    try {
        const { visitNumber } = req.params;
        const splits = await financeService.getFileSplits(visitNumber);
        res.status(200).json({ status: 'success', splits });
    } catch (error) {
        next(error);
    }
};

/**
 * Approve all splits for a file (Admin/Finance only)
 */
const approveSplits = async (req, res, next) => {
    try {
        const { visitNumber } = req.params;
        const result = await financeService.approveFileSplits(visitNumber, req.user.employee_id);

        res.status(200).json({
            status: 'success',
            message: result.message
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getFileSplits,
    approveSplits
};
