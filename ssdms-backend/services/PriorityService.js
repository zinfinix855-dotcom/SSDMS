const { pool } = require('../config/database');
const logger = require('../utils/logger');

class PriorityService {
    static weights = null;
    static slaConfigs = null;
    static lastFetched = null;

    /**
     * Refreshes AI weights and SLA configs from database (cached for 5 mins)
     */
    static async refreshConfig() {
        const now = Date.now();
        if (this.weights && this.lastFetched && (now - this.lastFetched < 5 * 60 * 1000)) {
            return;
        }

        try {
            // 1. Fetch AI Weights
            const [aiRows] = await pool.query('SELECT config_key, config_value FROM ai_config');
            const newWeights = {};
            aiRows.forEach(r => newWeights[r.config_key] = parseFloat(r.config_value));
            this.weights = {
                waiting_time_weight: 0.40,
                financial_volume_weight: 0.25,
                stage_criticality_weight: 0.20,
                sla_urgency_weight: 0.15,
                ...newWeights
            };

            // 2. Fetch Stage Specific SLA/Priority Weights
            const [slaRows] = await pool.query('SELECT stage_name, priority_weight, max_hours FROM sla_config');
            const newSla = {};
            slaRows.forEach(r => newSla[r.stage_name] = { 
                weight: parseFloat(r.priority_weight), 
                maxHours: r.max_hours 
            });
            this.slaConfigs = newSla;

            this.lastFetched = now;
            logger.debug('AI Priority configuration refreshed');
        } catch (err) {
            logger.error('Failed to fetch AI config, using safety defaults', err);
            this.weights = { waiting_time_weight: 0.40, financial_volume_weight: 0.30, stage_criticality_weight: 0.30, sla_urgency_weight: 0 };
            this.slaConfigs = {};
        }
    }

    static async calculatePriority(file) {
        await this.refreshConfig();

        // 1. Normalize Waiting Time (0-100)
        // Using a sigmoid-like function: hits ~90 score at 48 hours
        const hours = this.getWaitingHours(file.updated_at);
        const waitScore = 100 * (1 - Math.exp(-hours / 24));

        // 2. Normalize Financial Volume (0-100)
        // Logarithmic scale: 100k -> ~50, 1M -> ~80, 10M -> ~95
        const amount = file.amount || 0;
        const financialScore = amount > 0 ? Math.min(100, 20 * Math.log10(amount / 1000 + 1)) : 0;

        // 3. Stage Criticality (0-100)
        const stage = file.current_stage || 'Admission';
        const stageConfig = this.slaConfigs[stage] || { weight: 1, maxHours: 24 };
        const stageScore = Math.min(100, stageConfig.weight * 10);

        // 4. SLA Urgency Boost (0-100)
        let slaScore = 0;
        if (file.deadline_at) {
            const timeLeft = new Date(file.deadline_at).getTime() - Date.now();
            const hoursLeft = timeLeft / (1000 * 60 * 60);
            
            if (hoursLeft <= 0) {
                slaScore = 100; // Immediate Max Priority if breached
            } else if (hoursLeft < 6) {
                slaScore = 80 + (6 - hoursLeft) * 3.33; // Sharp ramp in last 6 hours
            } else {
                slaScore = Math.max(0, 50 * Math.exp(-hoursLeft / 24)); // Gradual increase
            }
        }

        // 5. Escalation Awareness Boost
        // Files flagged by the SLAWorker get a hard boost based on escalation level
        const escalationBoost = (file.escalation_level || 0) * 20; // 20 pts per level

        // 6. Normalized Decay Function
        // Prevents ancient "dead" files from clogging the top of the queue.
        // Starts decaying after 5 days, hits 50% at 14 days.
        const decayFactor = 1 / (1 + Math.exp((hours - 336) / 72)); // Logistic decay

        const w = this.weights;
        let rawScore = (waitScore * w.waiting_time_weight) + 
                         (financialScore * w.financial_volume_weight) + 
                         (stageScore * w.stage_criticality_weight) +
                         (slaScore * (w.sla_urgency_weight || 0)) +
                         escalationBoost;

        // 7. AI Risk Engine Intelligence Boost
        if (file.risk_score) {
            const aiMultiplier = 1 + (file.risk_score / 200); // Ex: 100 risk = 1.5x boost
            rawScore *= aiMultiplier;
        }

        const finalScore = rawScore * decayFactor;

        return parseFloat(Math.min(1000, finalScore).toFixed(2));
    }
  
    static getWaitingHours(updatedAt) {
        if (!updatedAt) return 0;
        const diff = Date.now() - new Date(updatedAt).getTime();
        return Math.max(0, diff / (1000 * 60 * 60));
    }
}
  
module.exports = PriorityService;
