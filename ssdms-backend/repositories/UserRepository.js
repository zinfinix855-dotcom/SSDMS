const BaseRepository = require('./BaseRepository');

class UserRepository extends BaseRepository {
    constructor() {
        super('users');
    }

    async findByAuthId(authId) {
        const query = `
      SELECT u.*, r.name as role_name, r.permissions 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE (u.employee_id = ? OR u.email = ?) AND u.deleted_at IS NULL
    `;
        const [rows] = await this.pool.query(query, [authId, authId]);
        return rows[0];
    }

    async updateLastLogin(employeeId) {
        const query = `UPDATE users SET last_login = NOW() WHERE employee_id = ?`;
        await this.pool.query(query, [employeeId]);
    }

    async updateRefreshToken(employeeId, token) {
        const query = `UPDATE users SET refresh_token = ? WHERE employee_id = ?`;
        await this.pool.query(query, [token, employeeId]);
    }

    async findByRefreshToken(token) {
        const query = `
      SELECT u.*, r.name as role_name, r.permissions 
      FROM users u 
      JOIN roles r ON u.role_id = r.id 
      WHERE u.refresh_token = ? AND u.deleted_at IS NULL
    `;
        const [rows] = await this.pool.query(query, [token]);
        return rows[0];
    }

    async findBySection(section, connection = null) {
        const conn = connection || this.pool;
        // Search for the section in the assigned_sections string or for universal access '*'
        const query = `
            SELECT employee_id, name, email 
            FROM users 
            WHERE (assigned_sections LIKE ? OR assigned_sections LIKE '%*%') 
              AND deleted_at IS NULL 
              AND is_active = 1
        `;
        const [rows] = await conn.query(query, [`%${section}%`]);
        return rows;
    }

    async getPaginated(limit, offset) {
        const [users] = await this.pool.query(
            `SELECT u.*, r.name as role_name 
             FROM users u 
             JOIN roles r ON u.role_id = r.id 
             WHERE u.deleted_at IS NULL 
             ORDER BY u.created_at DESC 
             LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [[{ total }]] = await this.pool.query(
            `SELECT COUNT(*) as total FROM users WHERE deleted_at IS NULL`
        );

        return { users, total };
    }
}

module.exports = new UserRepository();
