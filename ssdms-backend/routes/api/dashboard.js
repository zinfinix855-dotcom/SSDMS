const express = require('express');
const router = express.Router();
const dashboardController = require('../../controllers/dashboardController');
const { protect, restrictTo } = require('../../middlewares/auth');
const setTenant = require('../../middlewares/setTenant');

router.get('/stats', protect, setTenant, dashboardController.getStats);
router.get('/employee-stats', protect, restrictTo('Admin', 'Moderator'), setTenant, dashboardController.getEmployeeStats);
router.get('/logs', protect, restrictTo('Admin'), setTenant, dashboardController.getAuditLogs);
router.get('/lead-time', protect, restrictTo('Admin', 'Moderator'), setTenant, dashboardController.getLeadTimeAnalytics);
router.get('/daily-summary', protect, restrictTo('Admin', 'Moderator'), setTenant, dashboardController.getDailySummary);

module.exports = router;
