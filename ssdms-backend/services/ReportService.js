const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Gets a summary of system activity for the last 24 hours.
 * Includes counts for Forwarded, Returned, and Completed actions.
 */
const getDailyPerformanceSummary = async () => {
    try {
        const last24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

        // 1. Forwarded & Returned counts from file_movements
        const [movementStats] = await pool.query(`
            SELECT 
                status, 
                COUNT(*) as count 
            FROM file_movements 
            WHERE action_date >= ? 
            AND status IN ('Forwarded', 'Returned')
            GROUP BY status
        `, [last24h]);

        // 2. Completed files (moved to Indexation or status set to Completed)
        const [completedStats] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM file_movements 
            WHERE action_date >= ? 
            AND to_stage = 'Indexation' 
            AND status = 'Forwarded'
        `, [last24h]);

        // 3. New files admitted
        const [newFiles] = await pool.query(`
            SELECT COUNT(*) as count 
            FROM files 
            WHERE created_at >= ?
        `, [last24h]);

        const summary = {
            forwarded: movementStats.find(s => s.status === 'Forwarded')?.count || 0,
            returned: movementStats.find(s => s.status === 'Returned')?.count || 0,
            completed: completedStats[0].count || 0,
            new_admissions: newFiles[0].count || 0,
            timestamp: new Date().toISOString()
        };

        return summary;
    } catch (error) {
        logger.error('Error generating daily summary:', error);
        throw error;
    }
};

module.exports = { getDailyPerformanceSummary };
