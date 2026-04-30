const express = require('express');
const router = express.Router();
const { getNotifications, markAsRead } = require('../../controllers/notificationController');
const { protect } = require('../../middlewares/auth');

router.get('/', protect, getNotifications);
router.put('/:id/read', protect, markAsRead);

module.exports = router;
