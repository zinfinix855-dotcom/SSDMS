const BaseRepository = require('./BaseRepository');
const crypto = require('crypto');
const logger = require('../utils/logger');

class AuditRepository extends BaseRepository {
    constructor() {
        super('audit_logs');
    }

    /**
     * Log a security/admin action with tamper-proof hashing
     */
    async logAction({ employeeId, action, targetResource, ipAddress, metadata = null, connection = null }) {
        const conn = connection || this.pool;

        try {
            // 1. Get the last log's hash to form the chain
            const [lastLogs] = await conn.query(
                `SELECT current_hash FROM audit_logs ORDER BY id DESC LIMIT 1`
            );
            const previousHash = lastLogs.length > 0 ? lastLogs[0].current_hash : 'GENESIS_HASH';

            // 2. Prepare data for hashing (include metadata stringified)
            const timestamp = new Date().toISOString();
            const metaStr = metadata ? JSON.stringify(metadata) : '';
            const payload = `${previousHash}|${employeeId}|${action}|${targetResource}|${ipAddress}|${metaStr}|${timestamp}`;
            
            // 3. Compute SHA-256 hash
            const currentHash = crypto.createHash('sha256').update(payload).digest('hex');

            // 4. Insert the log
            await conn.query(
                `INSERT INTO audit_logs (employee_id, action, target_resource, ip_address, metadata, previous_hash, current_hash) 
                 VALUES (?, ?, ?, ?, ?, ?, ?)`,
                [employeeId, action, targetResource, ipAddress, metadata ? JSON.stringify(metadata) : null, previousHash, currentHash]
            );

            logger.debug(`[Audit] Tamper-proof log created: ${action}`);
        } catch (err) {
            logger.error('[Audit] Failed to create tamper-proof log:', err.message);
            // Fallback to simple log if hashing fails (should not happen)
            await conn.query(
                `INSERT INTO audit_logs (employee_id, action, target_resource, ip_address) 
                 VALUES (?, ?, ?, ?)`,
                [employeeId, action, targetResource, ipAddress]
            );
        }
    }

    /**
     * Verify the integrity of the audit chain
     */
    async verifyIntegrity() {
        const [logs] = await this.pool.query(`SELECT * FROM audit_logs ORDER BY id ASC`);
        let lastHash = 'GENESIS_HASH';
        const violations = [];

        for (const log of logs) {
            // 1. Link Check: Previous hash must match the last record's current hash
            if (log.previous_hash !== lastHash) {
                violations.push({ id: log.id, reason: 'Broken chain link (previous_hash mismatch)' });
            }
            
            // 2. Content Check: Recalculate hash of current record
            // Use precise timestamp from the DB field
            const timestamp = new Date(log.created_at).toISOString();
            const metaStr = log.metadata ? (typeof log.metadata === 'string' ? log.metadata : JSON.stringify(log.metadata)) : '';
            const payload = `${log.previous_hash}|${log.employee_id}|${log.action}|${log.target_resource}|${log.ip_address}|${metaStr}|${timestamp}`;
            const expectedHash = crypto.createHash('sha256').update(payload).digest('hex');
            
            if (log.current_hash !== expectedHash) {
                violations.push({ id: log.id, reason: `Data tampering detected (current_hash mismatch) - Expected ${expectedHash.substring(0,8)}...` });
            }
            
            lastHash = log.current_hash;
        }
        
        if (violations.length > 0) {
            logger.error(`🚨 AUDIT INTEGRITY FAILURE: ${violations.length} violations detected!`);
        } else {
            logger.info('🛡️ Audit Integrity: All chains verified successfully.');
        }

        return violations;
    }
}

module.exports = new AuditRepository();
