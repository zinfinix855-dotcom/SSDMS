const BaseRepository = require('./BaseRepository');

class NotificationRepository extends BaseRepository {
    constructor() {
        super('notifications');
    }

    async create(data, connection = null) {
        const conn = connection || this.pool;
        const [result] = await conn.query(`INSERT INTO ${this.tableName} SET ?`, data);
        return { id: result.insertId, ...data };
    }

    async findByEmployeeId(employeeId, limit = 50, connection = null) {
        const conn = connection || this.pool;
        const query = `SELECT * FROM notifications WHERE employee_id = ? ORDER BY created_at DESC LIMIT ?`;
        const [rows] = await conn.query(query, [employeeId, limit]);
        return rows;
    }

    async markAsRead(id, employeeId, connection = null) {
        const conn = connection || this.pool;
        const query = `UPDATE notifications SET is_read = TRUE WHERE id = ? AND employee_id = ?`;
        const [result] = await conn.query(query, [id, employeeId]);
        return result.affectedRows > 0;
    }

    async notify(employeeId, message, type = 'Info', connection = null) {
        try {
            return await this.create({
                employee_id: employeeId,
                message,
                type
            }, connection);
        } catch (error) {
            console.error('Error creating notification:', error);
            throw error;
        }
    }
}

module.exports = new NotificationRepository();
