const BaseRepository = require('./BaseRepository');

class SessionRepository extends BaseRepository {
    constructor() {
        super('user_sessions');
    }

    async createSession({ userId, refreshToken, ipAddress, userAgent, expiresAt }) {
        const query = `
            INSERT INTO user_sessions (user_id, refresh_token, ip_address, user_agent, expires_at) 
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await this.pool.query(query, [userId, refreshToken, ipAddress, userAgent, expiresAt]);
        return result.insertId;
    }

    async findByToken(token) {
        const query = `
            SELECT s.*, u.employee_id, u.hospital_id, r.name as role_name, r.permissions 
            FROM user_sessions s
            JOIN users u ON s.user_id = u.employee_id
            JOIN roles r ON u.role_id = r.id
            WHERE s.refresh_token = ? AND s.expires_at > NOW() AND u.deleted_at IS NULL
        `;
        const [rows] = await this.pool.query(query, [token]);
        return rows[0];
    }

    async revokeToken(token) {
        const query = `DELETE FROM user_sessions WHERE refresh_token = ?`;
        await this.pool.query(query, [token]);
    }

    async revokeAllUserSessions(userId) {
        const query = `DELETE FROM user_sessions WHERE user_id = ?`;
        await this.pool.query(query, [userId]);
    }
}

module.exports = new SessionRepository();
