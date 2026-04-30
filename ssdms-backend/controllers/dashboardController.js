const dashboardService = require('../services/DashboardService');
const reportService = require('../services/ReportService');
const { sendSuccess, sendPaginated } = require('../utils/response');
const asyncHandler = require('../utils/asyncHandler');

// @desc    Get Dashboard Statistics
// @route   GET /api/dashboard/stats
// @access  Private
const getStats = asyncHandler(async (req, res, next) => {
    const data = await dashboardService.getGlobalDashboardData();
    return sendSuccess(res, data, 'Dashboard stats retrieved');
});

// @desc    Get per-employee file forwarding stats
// @route   GET /api/dashboard/employee-stats
// @access  Private (Admin, Moderator)
const getEmployeeStats = asyncHandler(async (req, res, next) => {
    const stats = await dashboardService.getEmployeePerformance();
    return sendSuccess(res, stats, 'Employee stats retrieved');
});

// @desc    Get audit logs
// @route   GET /api/dashboard/logs
// @access  Private (Admin)
const getAuditLogs = asyncHandler(async (req, res, next) => {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const { logs, total } = await dashboardService.getAuditLogs(page, limit);

    return sendPaginated(res, logs, page, limit, total, 'Audit logs retrieved');
});

// @desc    Get Lead Time (Stage Bottleneck) Analytics
// @route   GET /api/dashboard/lead-time
// @access  Private (Admin, Moderator)
const getLeadTimeAnalytics = asyncHandler(async (req, res, next) => {
    const leadTime = await dashboardService.getLeadTimeAnalytics();
    return sendSuccess(res, leadTime, 'Lead time analytics retrieved');
});

// @desc    Get Daily System Performance Summary
// @route   GET /api/dashboard/daily-summary
// @access  Private (Admin, Moderator)
const getDailySummary = asyncHandler(async (req, res, next) => {
    const summary = await reportService.getDailyPerformanceSummary();
    return sendSuccess(res, summary, 'Daily summary retrieved');
});

module.exports = {
    getStats,
    getEmployeeStats,
    getAuditLogs,
    getLeadTimeAnalytics,
    getDailySummary
};
