const EventBus = require('../services/EventBus');
const QueueService = require('../services/QueueService');
const notificationService = require('../services/NotificationService');
const userRepository = require('../repositories/UserRepository');
const WorkflowRepository = require('../repositories/WorkflowRepository');
const logger = require('../utils/logger');

/**
 * WorkflowSubscriber — Decouples side-effects from the core transition logic.
 * Listens for FILE_MOVED events to trigger SLA, Notifications, and AI.
 */
class WorkflowSubscriber {
    start() {
        EventBus.on('FILE_MOVED', async (data) => {
            const { visitNumber, from, to, status } = data;
            logger.info(`📢 Event Processed: File ${visitNumber} moved from ${from} to ${to}`);

            // 1. Handle SLA Scheduling
            try {
                const slaConfig = await WorkflowRepository.getSlaConfig(to);
                if (slaConfig) {
                    await QueueService.scheduleSLACheck(visitNumber, to, slaConfig.max_hours * 3600000);
                }
            } catch (err) {
                logger.error(`[Subscriber] SLA scheduling failed for ${visitNumber}:`, err);
            }

            // 2. Handle Notifications
            try {
                const targetUsers = await userRepository.findBySection(to);
                for (const user of targetUsers) {
                    await notificationService.notify(
                        user.employee_id,
                        `File ${visitNumber} is now at your stage: ${to} (Priority Update)`,
                        status === 'Returned' ? 'Warning' : 'Info'
                    );
                }
            } catch (err) {
                logger.error(`[Subscriber] Notification failed for ${visitNumber}:`, err);
            }

            // 3. Optional: Trigger secondary analytics or AI training hooks here
        });
    }
}

module.exports = new WorkflowSubscriber();
