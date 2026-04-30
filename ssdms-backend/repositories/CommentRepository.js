const BaseRepository = require('./BaseRepository');

class CommentRepository extends BaseRepository {
    constructor() {
        super('file_comments');
    }

    async findByVisitNumber(visitNumber) {
        const query = `SELECT fc.*, u.name as employee_name FROM file_comments fc 
                       JOIN users u ON fc.employee_id = u.employee_id 
                       WHERE fc.visit_number = ? 
                       ORDER BY fc.created_at DESC`;
        const [rows] = await this.pool.query(query, [visitNumber]);
        return rows;
    }

    async findByIdWithUser(id) {
        const query = `SELECT fc.*, u.name as employee_name FROM file_comments fc 
                       JOIN users u ON fc.employee_id = u.employee_id 
                       WHERE fc.id = ?`;
        const [rows] = await this.pool.query(query, [id]);
        return rows[0];
    }
}

module.exports = new CommentRepository();
