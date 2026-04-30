const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { protect, restrictTo } = require('../middlewares/auth');

// All admin routes are protected
router.use(protect);
router.use(restrictTo('Admin'));

router.get('/health', adminController.getSystemHealth);
router.post('/audit/verify', adminController.verifyAuditIntegrity);
router.get('/audit/export', adminController.exportAuditLogs);
router.put('/ai-config', adminController.updateAiConfig);

module.exports = router;
