const fileRepository = require('../repositories/FileRepository');
const logger = require('../utils/logger');
const EventBus = require('./EventBus');

class AIService {
    constructor() {
        this.setupListeners();
    }

    setupListeners() {
        EventBus.on('FILE_ADMITTED', (event) => this.recalculateSingle(event.visitNumber));
        EventBus.on('FILE_FORWARDED', (event) => this.recalculateSingle(event.visitNumber));
        EventBus.on('FILE_RETURNED', (event) => this.recalculateSingle(event.visitNumber));
    }

    async recalculateSingle(visitNumber) {
        try {
            const file = await fileRepository.findByVisitOrSsc(visitNumber);
            if (!file) return;

            const score = this.calculatePriorityScore(file, new Date());
            await fileRepository.updatePriorityScore(visitNumber, score);
            logger.debug(`AI Service: Recalculated priority for ${visitNumber} -> ${score}`);
        } catch (err) {
            logger.error(`AI Service: Failed to recalibrate ${visitNumber}`, err);
        }
    }
    async recalculateAllScores() {
        const files = await fileRepository.getAllActiveFiles();
        logger.info(`AI Service: Recalculating scores for ${files.length} active files`);

        const now = new Date();
        let updatedCount = 0;

        for (const file of files) {
            const score = this.calculatePriorityScore(file, now);
            await fileRepository.updatePriorityScore(file.visit_number, score);
            updatedCount++;
        }

        logger.info(`AI Service: Scoring complete. Updated ${updatedCount} files.`);
        return updatedCount;
    }

    /**
     * Scoring Algorithm (0-100)
     */
    calculatePriorityScore(file, now) {
        let score = 0;

        // 1. Financial Staleness (40%)
        // Days since last update. Max 30 days = 40 points
        const updatedAt = new Date(file.updated_at);
        const diffDays = Math.floor((now - updatedAt) / (1000 * 60 * 60 * 24));
        const stalenessScore = Math.min(diffDays * 1.33, 40);
        score += stalenessScore;

        // 2. Stage Criticality (30%)
        // Some stages are higher priority
        const stageWeights = {
            'Approval': 30,
            'Pre-Approval': 30,
            'File Verification': 20,
            'E-Claim': 15,
            'Finance': 10,
            'Discharge': 5
        };
        score += stageWeights[file.current_stage] || 0;

        // 3. Overall Age (30%)
        // Total age of the file. Max 60 days = 30 points
        const createdAt = new Date(file.created_at);
        const ageDays = Math.floor((now - createdAt) / (1000 * 60 * 60 * 24));
        const ageScore = Math.min(ageDays * 0.5, 30);
        score += ageScore;

        return Math.min(Math.round(score), 100);
    }
}

module.exports = new AIService();
