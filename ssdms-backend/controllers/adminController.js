const { sendSuccess } = require('../utils/response');
const adminService = require('../services/AdminService');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');

/**
 * adminController — Enterprise monitoring and maintenance routes.
 */

// @desc    Get system health metrics
// @route   GET /api/admin/health
// @access  Private (Admin Only)
const getSystemHealth = asyncHandler(async (req, res, next) => {
    const stats = await adminService.getSystemHealth();
    return sendSuccess(res, stats, 'System health metrics retrieved');
});

// @desc    Verify Audit Log Integrity
// @route   POST /api/admin/verify-audit
// @access  Private (Admin Only)
const verifyAuditIntegrity = asyncHandler(async (req, res, next) => {
    const result = await adminService.verifyAuditIntegrity();
    return sendSuccess(res, result, 'Audit integrity check completed');
});

// @desc    Export full audit history to Excel
// @route   GET /api/admin/audit/export
// @access  Private (Admin Only)
const exportAuditLogs = asyncHandler(async (req, res, next) => {
    const buffer = await adminService.generateAuditExport();
    
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename=SSDMS_Audit_Export_${new Date().toISOString().split('T')[0]}.xlsx`);
    return res.send(buffer);
});

// @desc    Update AI Component Weights Dynamically
// @route   PUT /api/admin/ai-config
// @access  Private (Admin Only)
const updateAiConfig = asyncHandler(async (req, res, next) => {
    const { weights } = req.body;
    if (!weights || typeof weights !== 'object') {
        throw new AppError('Missing weights object', 400);
    }

    const result = await adminService.updateAiConfig(weights);
    return sendSuccess(res, result, 'AI config weights updated and refreshed instantly');
});

module.exports = {
    getSystemHealth,
    verifyAuditIntegrity,
    exportAuditLogs,
    updateAiConfig
};
