const { Worker } = require('bullmq');
const redis = require('../config/redis');
const FileRepository = require('../repositories/FileRepository');
const PriorityService = require('../services/PriorityService');
const AIEngine = require('../services/ai/AIEngine');
const logger = require('../utils/logger');

/**
 * AIWorker — Recalculates file priority scores in the background.
 * Offloads compute-heavy AI logic from the main workflow transaction thread.
 */
class AIWorker {
    constructor() {
        this.worker = null;
    }

    start() {
        this.worker = new Worker('ai-scoring', async (job) => {
            const { visitNumber } = job.data;
            logger.debug(`[AI Worker] Recalculating priority for ${visitNumber}`);

            try {
                const file = await FileRepository.findByVisitOrSsc(visitNumber);
                if (!file) return;

                // Sync configs to ensure stage properties exist
                await PriorityService.refreshConfig();
                const slaConfig = PriorityService.slaConfigs ? PriorityService.slaConfigs[file.current_stage] : null;

                // 1. Generate Local AI ML Inferences
                const returnCount = await FileRepository.getReturnCount(visitNumber);
                const aiPredictions = AIEngine.generatePredictions(file, slaConfig, returnCount);

                // 2. Attach predicted risk so deterministic engine boosts correctly
                file.risk_score = aiPredictions.risk_score;

                // 3. Recalculate traditional timeline/financial ranking
                const newScore = await PriorityService.calculatePriority(file);
                
                // Update DB synchronously with ML Intelligence metadata
                await FileRepository.updatePriorityScore(visitNumber, newScore, aiPredictions);
                
                logger.debug(`[AI Engine] File ${visitNumber} -> Risk: ${aiPredictions.risk_score}/100 | Returns: ${returnCount} | Score: ${newScore}`);
            } catch (err) {
                logger.error(`[AI Worker] Recalculation failed for ${visitNumber}: ${err.message}`);
                throw err;
            }
        }, {
            connection: redis.connectionConfig,
            concurrency: 5,
            removeOnComplete: { count: 100 },
            removeOnFail: { count: 500 }
        });

        logger.info('🤖 [AI Worker] Online and ready for scoring...');
    }
}

module.exports = new AIWorker();
