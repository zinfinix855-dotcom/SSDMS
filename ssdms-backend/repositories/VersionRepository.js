const BaseRepository = require('./BaseRepository');

class VersionRepository extends BaseRepository {
    constructor() {
        super('workbook_versions');
    }

    async getLatestVersionNumber(visitNumber, connection = null) {
        const conn = connection || this.pool;
        const query = `SELECT MAX(version_number) as max_v FROM workbook_versions WHERE visit_number = ?`;
        const [rows] = await conn.query(query, [visitNumber]);
        return rows[0]?.max_v || 0;
    }

    async createVersion(visitNumber, stageName, data, changedBy, changeType = 'update', connection = null) {
        const latestVersion = await this.getLatestVersionNumber(visitNumber, connection);
        const newVersionNumber = latestVersion + 1;

        const newVersion = {
            visit_number: visitNumber,
            stage_name: stageName,
            version_number: newVersionNumber,
            data: typeof data === 'string' ? data : JSON.stringify(data),
            changed_by: changedBy,
            change_type: changeType
        };

        return await this.create(newVersion, connection);
    }

    async getVersions(visitNumber) {
        const query = `
            SELECT wv.*, u.name as changed_by_name 
            FROM workbook_versions wv
            LEFT JOIN users u ON wv.changed_by = u.employee_id
            WHERE wv.visit_number = ?
            ORDER BY wv.version_number DESC
        `;
        const [rows] = await this.pool.query(query, [visitNumber]);
        return rows;
    }
}

module.exports = new VersionRepository();
