const { pool } = require('../config/database');

/**
 * AnalyticsService provides deep insights into workflow performance and department bottlenecks.
 */
class AnalyticsService {
    /**
     * Calculates the average time spent in each stage (in hours)
     */
    async getStageBottlenecks() {
        const query = `
            SELECT 
                from_stage as stage_name,
                AVG(TIMESTAMPDIFF(HOUR, created_at, action_date)) as avg_hours,
                COUNT(*) as total_movements
            FROM file_movements
            WHERE from_stage != 'System'
            GROUP BY from_stage
            ORDER BY avg_hours DESC
        `;
        
        const [rows] = await pool.query(query);
        return rows;
    }

    /**
     * Identifies current "hot" departments with high pending file counts
     */
    async getDepartmentLoad() {
        const query = `
            SELECT 
                current_stage,
                COUNT(*) as pending_files,
                SUM(CASE WHEN last_sla_status = 'Violated' THEN 1 ELSE 0 END) as sla_violations
            FROM files
            WHERE status = 'In Progress'
            GROUP BY current_stage
            ORDER BY pending_files DESC
        `;
        
        const [rows] = await pool.query(query);
        return rows;
    }
}

module.exports = new AnalyticsService();
