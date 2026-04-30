const notificationService = require('../services/NotificationService');

/**
 * Internal helper to create a notification (Still exported for legacy support if needed)
 */
const createNotification = async (employeeId, message, type = 'Info') => {
    return await notificationService.notify(employeeId, message, type);
};

/**
 * Get notifications for a user
 */
const getNotifications = async (req, res, next) => {
    try {
        const notifications = await notificationService.getUserNotifications(req.user.employee_id);
        res.status(200).json({ status: 'success', notifications });
    } catch (error) {
        next(error);
    }
};

/**
 * Mark a notification as read
 */
const markAsRead = async (req, res, next) => {
    try {
        const { id } = req.params;
        await notificationService.markNotificationAsRead(id, req.user.employee_id);
        res.status(200).json({ status: 'success', message: 'Notification marked as read' });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    createNotification,
    getNotifications,
    markAsRead
};
