const express = require('express');
const router = express.Router();

const authRoutes = require('./api/auth');
const userRoutes = require('./api/users');
const fileRoutes = require('./api/files');
const workflowRoutes = require('./api/workflow');
const dashboardRoutes = require('./api/dashboard');
const exportRoutes = require('./api/export');
const notificationRoutes = require('./api/notifications');
const financeRoutes = require('./api/finance');
const commentRoutes = require('./api/comments');
const attachmentRoutes = require('./api/attachments');
const adminRoutes = require('./adminRoutes');

router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/files', fileRoutes);
router.use('/workflow', workflowRoutes);
router.use('/dashboard', dashboardRoutes);
router.use('/export', exportRoutes);
router.use('/notifications', notificationRoutes);
router.use('/finance', financeRoutes);
router.use('/comments', commentRoutes);
router.use('/attachments', attachmentRoutes);
router.use('/admin', adminRoutes);

module.exports = router;
