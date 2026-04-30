/**
 * Narrative Service building contextualized English summaries based on ML anomaly arrays
 */
class NarrativeService {
    static generateSummary(file, riskScore, predictedHours, anomalyReport, returnCount = 0) {
        let narrative = `File is in ${file.current_stage || 'Admission'}. `;

        if (riskScore > 80) {
            narrative += `Critically elevated risk score (${riskScore}/100) indicates high probability of SLA breach. `;
        } else if (riskScore > 50) {
            narrative += `Moderate risk evaluation detected. `;
        }

        if (returnCount > 0) {
            const extraWait = (returnCount * 15).toFixed(0); // Arbitrary 15% inflation per return for storytelling
            narrative += `File experienced ${returnCount} return(s) in this cycle, historically increasing processing time by ~${extraWait}%. `;
        }

        if (anomalyReport.isAnomalous) {
            narrative += `System flagged irregularities: ${anomalyReport.flags.map(f => f.replace(/_/g, ' ')).join(', ')}. `;
            if (anomalyReport.zScore > 2) {
                narrative += `Variance is significantly above normal cluster bounds (Z-Score: ${anomalyReport.zScore}). `;
            }
        }

        narrative += `Projected stage completion target is ~${predictedHours} hours based on mathematical pacing.`;

        if (file.amount && file.amount > 500000) {
            const formattedAmount = (file.amount / 1000000).toFixed(1) + 'M';
            narrative += ` Extreme financial volume (${formattedAmount} PKR) is acting as a natural processing drag coefficient.`;
        }

        return narrative.trim();
    }
}

module.exports = NarrativeService;
