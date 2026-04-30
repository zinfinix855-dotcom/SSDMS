const NotificationRepository = require('../repositories/NotificationRepository');
const BaseService = require('./BaseService');
const logger = require('../utils/logger');

class NotificationService extends BaseService {
    constructor() {
        super(NotificationRepository);
    }

    async getUserNotifications(employeeId) {
        return await NotificationRepository.findByEmployeeId(employeeId);
    }

    async markNotificationAsRead(id, employeeId) {
        return await NotificationRepository.markAsRead(id, employeeId);
    }

    /**
     * Internal/External method to create notification
     */
    async notify(employeeId, message, type = 'Info') {
        try {
            return await NotificationRepository.create({
                employee_id: employeeId,
                message,
                type
            });
        } catch (error) {
            logger.error(`NotificationService error: ${error.message}`);
            // We don't necessarily want to break the main flow if notification fails
        }
    }
}

module.exports = new NotificationService();
