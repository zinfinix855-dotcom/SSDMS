const aiService = require('../../services/AIService');

describe('AIService', () => {
    describe('calculatePriorityScore', () => {
        const now = new Date('2026-03-13T12:00:00Z');

        test('should calculate high score for old staleness and critical stage', () => {
            const file = {
                current_stage: 'Approval',
                updated_at: '2026-02-10T12:00:00Z', // ~31 days ago
                created_at: '2026-02-01T12:00:00Z'  // ~40 days ago
            };
            const score = aiService.calculatePriorityScore(file, now);
            // Staleness: 40, Stage: 30, Age: 20 -> 90
            expect(score).toBeGreaterThanOrEqual(85);
        });

        test('should calculate low score for fresh file in early stage', () => {
            const file = {
                current_stage: 'Discharge',
                updated_at: now.toISOString(),
                created_at: now.toISOString()
            };
            const score = aiService.calculatePriorityScore(file, now);
            // Staleness: 0, Stage: 5, Age: 0 -> 5
            expect(score).toBe(5);
        });

        test('should cap score at 100', () => {
            const file = {
                current_stage: 'Approval',
                updated_at: '2025-01-01T12:00:00Z',
                created_at: '2025-01-01T12:00:00Z'
            };
            const score = aiService.calculatePriorityScore(file, now);
            expect(score).toBe(100);
        });
    });
});
