const BaseRepository = require('./BaseRepository');

class AttachmentRepository extends BaseRepository {
    constructor() {
        super('file_attachments');
    }

    async findByVisitNumber(visitNumber) {
        const query = `SELECT fa.*, u.name as employee_name FROM file_attachments fa 
                       JOIN users u ON fa.employee_id = u.employee_id 
                       WHERE fa.visit_number = ? 
                       ORDER BY fa.created_at DESC`;
        const [rows] = await this.pool.query(query, [visitNumber]);
        return rows;
    }
}

module.exports = new AttachmentRepository();
