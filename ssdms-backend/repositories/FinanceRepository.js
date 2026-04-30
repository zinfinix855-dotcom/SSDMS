const BaseRepository = require('./BaseRepository');

class FinanceRepository extends BaseRepository {
    constructor() {
        super('finance_splits');
    }

    async findByVisitNumber(visitNumber) {
        const query = `SELECT fs.*, u.name as approved_by_name 
                       FROM finance_splits fs 
                       LEFT JOIN users u ON fs.approved_by = u.employee_id 
                       WHERE fs.visit_number = ?`;
        const [rows] = await this.pool.query(query, [visitNumber]);
        return rows;
    }

    async approveAllPending(visitNumber, approvedBy, approvedAt, connection = null) {
        const conn = connection || this.pool;
        const query = `UPDATE finance_splits 
                       SET approved_by = ?, approved_at = ?, payment_status = 'Paid' 
                       WHERE visit_number = ? AND approved_by IS NULL`;
        const [result] = await conn.query(query, [approvedBy, approvedAt, visitNumber]);
        return result.affectedRows;
    }
}

module.exports = new FinanceRepository();
