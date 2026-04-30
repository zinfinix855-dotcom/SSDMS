const BaseRepository = require('./BaseRepository');

class DashboardRepository extends BaseRepository {
    constructor() {
        super(null); // No primary table for dashboard
    }

    async getGlobalStats() {
        const [rows] = await this.pool.query(`
            SELECT 
                (SELECT COUNT(*) FROM files WHERE deleted_at IS NULL) as totalFiles,
                (SELECT COUNT(*) FROM files WHERE status = 'In Progress' AND deleted_at IS NULL) as inProgress,
                (SELECT COUNT(*) FROM files WHERE status = 'Objected' AND deleted_at IS NULL) as objected,
                (SELECT COUNT(*) FROM files WHERE status = 'Completed' AND deleted_at IS NULL) as completed,
                (SELECT COUNT(*) FROM files WHERE updated_at < DATE_SUB(NOW(), INTERVAL 7 DAY) AND status NOT IN ('Completed', 'Archived') AND deleted_at IS NULL) as staleCount
        `);
        return rows[0];
    }

    async getFilesByStage() {
        const [rows] = await this.pool.query(
            `SELECT current_stage, COUNT(*) as count FROM files WHERE deleted_at IS NULL GROUP BY current_stage`
        );
        return rows;
    }

    async getEmployeePerformance() {
        const [rows] = await this.pool.query(
            `SELECT u.employee_id, u.name, r.name as role_name,
                    COUNT(fm.id) as total_actions,
                    SUM(fm.status = 'Forwarded') as forwarded,
                    SUM(fm.status = 'Returned') as returned,
                    SUM(fm.status = 'Overridden') as overridden
             FROM users u
             INNER JOIN roles r ON u.role_id = r.id
             LEFT JOIN file_movements fm ON u.employee_id = fm.action_by
             WHERE u.deleted_at IS NULL
             GROUP BY u.employee_id, u.name, r.name
             ORDER BY total_actions DESC`
        );
        return rows;
    }

    async getAuditLogs(limit, offset) {
        const [logs] = await this.pool.query(
            `SELECT al.*, u.name as employee_name
             FROM audit_logs al
             LEFT JOIN users u ON al.employee_id = u.employee_id
             ORDER BY al.created_at DESC
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [[{ total }]] = await this.pool.query(`SELECT COUNT(*) as total FROM audit_logs`);
        return { logs, total };
    }

    async getLeadTimeAnalytics() {
        // Optimized query to get average time in each stage
        const [rows] = await this.pool.query(
            `SELECT 
                fm1.to_stage as stage, 
                ROUND(AVG(TIMESTAMPDIFF(HOUR, fm1.action_date, fm2.action_date)), 1) as avg_hours
             FROM file_movements fm1
             INNER JOIN file_movements fm2 ON fm1.visit_number = fm2.visit_number 
                AND fm2.id = (
                    SELECT id FROM file_movements 
                    WHERE visit_number = fm1.visit_number 
                    AND action_date > fm1.action_date 
                    ORDER BY action_date ASC LIMIT 1
                )
             GROUP BY fm1.to_stage
             ORDER BY avg_hours DESC`
        );
        return rows;
    }
}

module.exports = new DashboardRepository();
