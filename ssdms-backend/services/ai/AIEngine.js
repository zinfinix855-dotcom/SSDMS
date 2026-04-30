const RiskModel = require('./RiskModel');
const TimeEstimator = require('./TimeEstimator');
const AnomalyDetector = require('./AnomalyDetector');
const NarrativeService = require('./NarrativeService');

/**
 * AIEngine — The physical aggregator unit executing local AI logic silently
 */
class AIEngine {
    /**
     * Executes all internal bounded ML Models synchronously (extremely fast)
     */
    static generatePredictions(file, slaConfig, returnCount = 0) {
        // 1. Risk Evaluation
        const riskScore = RiskModel.calculateRiskScore(file, slaConfig);

        // 2. Expected Completion Time Projection
        const predictedHours = TimeEstimator.estimateCompletionHours(file, riskScore, slaConfig);

        // 3. Statistical Anomaly Validation
        const currentHours = (Date.now() - new Date(file.updated_at).getTime()) / 3600000;
        
        // Phase 6: Historical Baseline (In production, this comes from a cached aggregator)
        const historicalMean = slaConfig?.max_hours || predictedHours; 
        
        const anomalyReport = AnomalyDetector.detect(file, predictedHours, currentHours, historicalMean);

        // 4. Narrative Synthesis
        const aiSummary = NarrativeService.generateSummary(file, riskScore, predictedHours, anomalyReport, returnCount);

        return {
            risk_score: riskScore,
            predicted_completion_hours: predictedHours,
            ai_summary: aiSummary,
            anomalies: anomalyReport
        };
    }
}

module.exports = AIEngine;
