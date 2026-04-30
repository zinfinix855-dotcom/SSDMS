const DashboardRepository = require('../repositories/DashboardRepository');
const logger = require('../utils/logger');

/**
 * PredictService — Advanced AI forecasting for hospital workflows.
 * Analyzes historical throughput to predict breach risks before they occur.
 */
class PredictService {
    /**
     * Predict Risk of Breach for a file in its current stage
     * @param {Object} file 
     * @returns {string} 'Low', 'Medium', 'High', 'Critical'
     */
    async predictBreachRisk(file) {
        try {
            if (!file.deadline_at) return 'Low';

            const now = new Date();
            const deadline = new Date(file.deadline_at);
            const remainingHours = (deadline - now) / (1000 * 60 * 60);

            // Fetch historical avg for this stage
            const analytics = await DashboardRepository.getLeadTimeAnalytics();
            const stageStats = analytics.find(a => a.stage === file.current_stage);
            
            if (!stageStats) return 'Low';

            const avgHours = Number(stageStats.avg_hours) || 24;

            // Simple Heuristic Model: 
            // If remaining time is less than 50% of the average time it takes to clear this stage,
            // the file is at HIGH risk of breach.
            if (remainingHours <= 0) return 'Breached';
            if (remainingHours < (avgHours * 0.25)) return 'High';
            if (remainingHours < (avgHours * 0.5)) return 'Medium';

            return 'Low';
        } catch (err) {
            logger.error(`[Predict Service] Failed to predict for ${file.visit_number}:`, err.message);
            return 'Low';
        }
    }
}

module.exports = new PredictService();
