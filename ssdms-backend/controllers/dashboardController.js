const dashboardService = require('../services/DashboardService');
const reportService = require('../services/ReportService');
const asyncHandler = require('../utils/asyncHandler');
const BaseController = require('./BaseController');

/**
 * DashboardController
 * Centralized command for operational intelligence and performance metrics.
 */
class DashboardController extends BaseController {
    /**
     * @desc    Get Dashboard Statistics
     * @route   GET /api/dashboard/stats
     */
    getStats = asyncHandler(async (req, res) => {
        const data = await dashboardService.getGlobalDashboardData();
        return this.success(res, data, 'Dashboard stats retrieved');
    });

    /**
     * @desc    Get per-employee file forwarding stats
     * @route   GET /api/dashboard/employee-stats
     */
    getEmployeeStats = asyncHandler(async (req, res) => {
        const stats = await dashboardService.getEmployeePerformance();
        return this.success(res, stats, 'Employee stats retrieved');
    });

    /**
     * @desc    Get audit logs
     * @route   GET /api/dashboard/logs
     */
    getAuditLogs = asyncHandler(async (req, res) => {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 50;
        const { logs, total } = await dashboardService.getAuditLogs(page, limit);

        return res.status(200).json({
            status: 'success',
            data: logs,
            meta: { total, page, limit }
        });
    });

    /**
     * @desc    Get Lead Time (Stage Bottleneck) Analytics
     * @route   GET /api/dashboard/lead-time
     */
    getLeadTimeAnalytics = asyncHandler(async (req, res) => {
        const leadTime = await dashboardService.getLeadTimeAnalytics();
        return this.success(res, leadTime, 'Lead time analytics retrieved');
    });

    /**
     * @desc    Get Daily System Performance Summary
     * @route   GET /api/dashboard/daily-summary
     */
    getDailySummary = asyncHandler(async (req, res) => {
        const summary = await reportService.getDailyPerformanceSummary();
        return this.success(res, summary, 'Daily summary retrieved');
    });
}

module.exports = new DashboardController();
