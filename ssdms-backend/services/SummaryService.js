const FileRepository = require('../repositories/FileRepository');
const logger = require('../utils/logger');

/**
 * SummaryService — Generates intelligent "File Biographies".
 * Helps staff understand the "Why" behind a file's journey without reading logs.
 */
class SummaryService {
    /**
     * Generate a narative summary of a file's history
     * @param {string} visitNumber 
     */
    async getFileNarrative(visitNumber) {
        try {
            const movements = await FileRepository.getFileMovements(visitNumber);
            if (!movements || movements.length === 0) return "No history recorded for this file yet.";

            const returnCounts = movements.filter(m => m.status === 'Returned').length;
            const distinctStages = new Set(movements.map(m => m.to_stage)).size;
            
            let narrative = `File has traveled through ${distinctStages} departments. `;
            
            if (returnCounts > 1) {
                const returnPoints = movements
                    .filter(m => m.status === 'Returned')
                    .map(m => m.from_stage);
                narrative += `🚩 High friction detected: This file was returned ${returnCounts} times, mostly from ${[...new Set(returnPoints)].join(', ')}. `;
            }

            const latestMovement = movements[0];
            narrative += `Currently stationed at ${latestMovement.to_stage}. `;

            // Heuristic for bottlenecks
            const totalHours = (new Date() - new Date(movements[movements.length - 1].created_at)) / (1000 * 60 * 60);
            if (totalHours > 72 && latestMovement.status !== 'Completed') {
                narrative += `⏳ Aging alert: This process has been active for ${Math.floor(totalHours / 24)} days.`;
            }

            return narrative;
        } catch (err) {
            logger.error(`[Summary Service] Failed for ${visitNumber}:`, err.message);
            return "Unable to generate summary at this time.";
        }
    }
}

module.exports = new SummaryService();
