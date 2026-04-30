/**
 * Time Estimator predicting optimal completion loops based on structural averages.
 */
class TimeEstimator {
    /**
     * Predict how many hours it will take to exit current stage
     */
    static estimateCompletionHours(file, riskScore, slaConfig) {
        // Base estimation uses SLA standard if history absent
        let baseEstimator = slaConfig?.max_hours || 12;

        // Apply risk inflation
        // If risk is 90% (0.9), expect delay to practically double
        const riskMultiplier = 1 + (riskScore / 100); 

        // Apply Financial Drag Coefficient
        const dragCoefficient = file.amount ? Math.log10(file.amount / 50000 + 1) * 0.15 : 0;

        const projectedHours = baseEstimator * riskMultiplier * (1 + dragCoefficient);

        return Math.max(1, Math.round(projectedHours));
    }
}

module.exports = TimeEstimator;
