const express = require('express');
const router = express.Router();
const { getStats, getEmployeeStats, getAuditLogs, getLeadTimeAnalytics, getDailySummary } = require('../../controllers/dashboardController');
const { protect, restrictTo } = require('../../middlewares/auth');

router.get('/stats', protect, getStats);
router.get('/employee-stats', protect, restrictTo('Admin', 'Moderator'), getEmployeeStats);
router.get('/logs', protect, restrictTo('Admin'), getAuditLogs);
router.get('/lead-time', protect, restrictTo('Admin', 'Moderator'), getLeadTimeAnalytics);
router.get('/daily-summary', protect, restrictTo('Admin', 'Moderator'), getDailySummary);

module.exports = router;
