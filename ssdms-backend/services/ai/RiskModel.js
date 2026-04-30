/**
 * Heuristic Logistic Regression implementation for SLA risk evaluation.
 * Uses bounded algebraic scoring instead of heavy matrix multiplication.
 */
class RiskModel {
    /**
     * Compute risk probability [0-100]
     * @param {Object} file - The file record from DB
     * @param {Object} slaConfig - Baseline configuration for the stage
     */
    static calculateRiskScore(file, slaConfig) {
        let riskScore = 0;

        // 1. Feature: Time elapsed vs SLA limit
        const stageTimeMs = Date.now() - new Date(file.updated_at).getTime();
        const stageTimeHours = stageTimeMs / (1000 * 60 * 60);
        
        const maxHours = slaConfig?.max_hours || 24;
        const timeRatio = stageTimeHours / maxHours;

        // Logistic sigmoid mapping for time ratio
        // Centered around 0.8 (warning zone) = 50% probability
        const timePropProbability = 1 / (1 + Math.exp(-10 * (timeRatio - 0.8)));
        riskScore += (timePropProbability * 50); // 50% of total weight
        
        // 2. Feature: Escalation Awareness
        // If a file has already been escalated (SLA Worker), risk spikes
        if (file.escalation_level > 0) {
            riskScore += Math.min(30, file.escalation_level * 15); // Max 30 points
        }

        // 3. Feature: Financial Scrutiny Delay
        // Files with higher values naturally draw longer, riskier delays
        if (file.amount) {
            const financialRisk = Math.min(1.0, Math.log10(file.amount / 10000 + 1) * 0.3);
            riskScore += (financialRisk * 10); // Reduced to 10% weight
        }

        // 4. Status/Stage Anomalies
        if (file.status === 'Returned') {
            riskScore += 10; // Spikes risk logic 10 points
        }

        // 4. Stage-Specific Intelligence Multipliers
        // Certain stages have inherent "drag" or "complexity" weights.
        const stageMultipliers = {
            'Finance': 1.5,
            'Approval': 1.2,
            'File Verification': 1.3,
            'Indexation': 0.6,
            'Admission': 0.8
        };

        const multiplier = stageMultipliers[file.current_stage] || 1.0;
        riskScore *= multiplier;

        return Math.min(100, Math.round(riskScore));
    }
}

module.exports = RiskModel;
