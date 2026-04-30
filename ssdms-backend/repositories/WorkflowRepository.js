const { pool } = require('../config/database');

class WorkflowRepository {
    async getValidTransitions(fromStage) {
        const [rows] = await pool.query(
            'SELECT to_stage, allowed_roles FROM workflow_rules WHERE from_stage = ? AND is_active = TRUE',
            [fromStage]
        );
        return rows;
    }

    /**
     * Validates that a transition is permitted for a given role.
     * Checks both that the transition exists in workflow_rules AND that
     * the caller's role is listed in the allowed_roles JSON column.
     */
    async validateTransition(fromStage, toStage, role) {
        const [rows] = await pool.query(
            'SELECT allowed_roles FROM workflow_rules WHERE from_stage = ? AND to_stage = ? AND is_active = TRUE',
            [fromStage, toStage]
        );

        if (rows.length === 0) return false;

        try {
            const allowedRoles = typeof rows[0].allowed_roles === 'string'
                ? JSON.parse(rows[0].allowed_roles)
                : rows[0].allowed_roles;

            return Array.isArray(allowedRoles) && (
                allowedRoles.includes('*') || allowedRoles.includes(role)
            );
        } catch (err) {
            return false;
        }
    }

    async getSlaConfig(stageName) {
        const [rows] = await pool.query(
            'SELECT max_hours, escalation_hours FROM sla_config WHERE stage_name = ?',
            [stageName]
        );
        return rows[0] || null;
    }
}

module.exports = new WorkflowRepository();
