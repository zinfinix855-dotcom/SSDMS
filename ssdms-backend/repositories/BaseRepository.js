const { pool } = require('../config/database');

/**
 * Base Repository for common database operations
 */
class BaseRepository {
    constructor(tableName) {
        this.tableName = tableName;
        this.pool = pool;
        // FIX: hospitalId defaults to 1 for backward-compat with background workers
        // (SLAWorker, AIWorker). All request-scoped callers MUST call setTenantContext
        // or use the withTenant factory to avoid cross-hospital data leakage.
        this.hospitalId = 1;
    }

    /**
     * Set the tenant context for this repository instance.
     * Call this in every request handler: repo.setTenantContext(req.user.hospital_id)
     */
    setTenantContext(hospitalId) {
        if (!hospitalId) throw new Error('hospital_id is required for tenant context');
        this.hospitalId = hospitalId;
        return this; // allow chaining
    }

    /**
     * Factory: returns the singleton instance scoped to a specific hospital.
     * Usage: FileRepository.withTenant(req.user.hospital_id).findByVisitOrSsc(...)
     * Note: mutates the singleton — use only within a single synchronous call chain.
     * For true isolation across concurrent requests, instantiate a new class per request.
     */
    withTenant(hospitalId) {
        return this.setTenantContext(hospitalId);
    }

    /**
     * Get database transaction connection
     */
    async startTransaction() {
        const connection = await this.pool.getConnection();
        await connection.beginTransaction();
        return connection;
    }

    async commitTransaction(connection) {
        await connection.commit();
        connection.release();
    }

    async rollbackTransaction(connection) {
        await connection.rollback();
        connection.release();
    }

    /**
     * Wrapper for simple transaction execution
     */
    async transaction(work) {
        const connection = await this.startTransaction();
        try {
            const result = await work(connection);
            await this.commitTransaction(connection);
            return result;
        } catch (error) {
            await this.rollbackTransaction(connection);
            throw error;
        }
    }

    async findAll(includeDeleted = false) {
        let query = `SELECT * FROM ${this.tableName} WHERE hospital_id = ?`;
        if (!includeDeleted) {
            query += ` AND deleted_at IS NULL`;
        }
        const [rows] = await this.pool.query(query, [this.hospitalId]);
        return rows;
    }

    async findById(id, idColumn = 'id', includeDeleted = false) {
        let query = `SELECT * FROM ${this.tableName} WHERE ${idColumn} = ? AND hospital_id = ?`;
        if (!includeDeleted) {
            query += ` AND deleted_at IS NULL`;
        }
        const [rows] = await this.pool.query(query, [id, this.hospitalId]);
        return rows[0];
    }

    async create(data, connection = null) {
        const conn = connection || this.pool;
        const [result] = await conn.query(`INSERT INTO ${this.tableName} SET ?`, data);
        return { id: result.insertId, ...data };
    }

    async update(id, data, idColumn = 'id', connection = null) {
        const conn = connection || this.pool;
        const [result] = await conn.query(
            `UPDATE ${this.tableName} SET ? WHERE ${idColumn} = ? AND deleted_at IS NULL`,
            [data, id]
        );
        return result.affectedRows > 0;
    }

    async softDelete(id, idColumn = 'id', connection = null) {
        const conn = connection || this.pool;
        const [result] = await conn.query(
            `UPDATE ${this.tableName} SET deleted_at = NOW() WHERE ${idColumn} = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    async delete(id, idColumn = 'id', connection = null) {
        const conn = connection || this.pool;
        const [result] = await conn.query(
            `DELETE FROM ${this.tableName} WHERE ${idColumn} = ?`,
            [id]
        );
        return result.affectedRows > 0;
    }

    async findOne(conditions, includeDeleted = false) {
        const keys = Object.keys(conditions);
        let query = `SELECT * FROM ${this.tableName} WHERE ${keys.map(k => `${k} = ?`).join(' AND ')}`;
        if (!includeDeleted) {
            query += ` AND deleted_at IS NULL`;
        }
        const [rows] = await this.pool.query(query, Object.values(conditions));
        return rows[0];
    }
}

module.exports = BaseRepository;
