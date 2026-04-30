/**
 * Z-Score Statistical Detection to flag severe anomalies off normal bounds
 */
class AnomalyDetector {
    /**
     * Detect if a file is exhibiting extreme anomalous behaviors.
     * @param {Object} file - File record
     * @param {Number} predictedHours - AI predicted completion
     * @param {Number} currentHours - Actual hours in stage
     * @param {Number} historicalMean - Observed stage average from DB
     */
    static detect(file, predictedHours, currentHours, historicalMean = null) {
        const anomalies = [];

        // Use historical data if available, otherwise fallback to prediction
        const mu = historicalMean || predictedHours; 
        const sigma = Math.max(mu * 0.3, 4); // Assume 30% std deviation or minimal 4 hours

        // Z-Score = (X - μ) / σ
        const zScore = (currentHours - mu) / sigma;

        if (zScore > 2.5) { // 99% deviation
            anomalies.push('CRITICAL_TIME_ANOMALY');
        } else if (zScore > 1.5) {
            anomalies.push('ELEVATED_STAGE_DELAY');
        }

        // Stagnation Index: If current time exceeds 3x the mean
        if (currentHours > (mu * 3)) {
            anomalies.push('STAGNATION_INDEX_BREACH');
        }

        if (file.status === 'Returned' && currentHours > mu) {
            anomalies.push('RETURN_STALL_DETECTED');
        }

        return {
            isAnomalous: anomalies.length > 0,
            zScore: parseFloat(zScore.toFixed(2)),
            flags: anomalies
        };
    }
}

module.exports = AnomalyDetector;
