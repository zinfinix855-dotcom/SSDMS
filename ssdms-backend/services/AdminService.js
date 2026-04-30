const auditRepository = require('../repositories/AuditRepository');
const QueueService = require('../services/QueueService');
const PriorityService = require('../services/PriorityService');
const redisClient = require('../config/redis');
const { pool } = require('../config/database');
const XLSX = require('xlsx');

class AdminService {
    async getSystemHealth() {
        return {
            redis: {
                status: redisClient ? (redisClient.status || 'connected') : 'offline',
                host: process.env.REDIS_HOST || '127.0.0.1'
            },
            queues: {
                sla: await QueueService.queues.sla.count(),
                ai: await QueueService.queues.ai.count(),
                maintenance: await QueueService.queues.maintenance.count()
            },
            audit: {
                integrity: 'Pending verification...'
            },
            timestamp: new Date()
        };
    }

    async verifyAuditIntegrity() {
        const violations = await auditRepository.verifyIntegrity();
        const status = violations.length === 0 ? 'Verified - No Tampering' : 'BREACH DETECTED';
        return { status, violations };
    }

    async generateAuditExport() {
        const [logs] = await pool.query(
            `SELECT al.*, u.name as employee_name 
             FROM audit_logs al 
             LEFT JOIN users u ON al.employee_id = u.employee_id 
             ORDER BY al.id DESC`
        );

        const data = logs.map(l => ({
            ID: l.id,
            Timestamp: l.created_at,
            Employee: `${l.employee_name} (${l.employee_id})`,
            Action: l.action,
            Resource: l.target_resource,
            IP: l.ip_address,
            Hash_Chain_Pos: l.current_hash ? l.current_hash.substring(0, 12) : 'N/A',
            Metadata: l.metadata ? (typeof l.metadata === 'string' ? l.metadata : JSON.stringify(l.metadata)) : ''
        }));

        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(data);
        XLSX.utils.book_append_sheet(wb, ws, "Audit Logs");

        return XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
    }

    async updateAiConfig(weights) {
        for (const [key, value] of Object.entries(weights)) {
            const num = parseFloat(value);
            if (!isNaN(num)) {
                await pool.query(
                    `UPDATE ai_config SET config_value = ? WHERE config_key = ?`,
                    [num, key]
                );
            }
        }

        // Force clear the 5-min cache locally
        PriorityService.lastFetched = null;
        await PriorityService.refreshConfig();
        
        return { applied: true };
    }
}

module.exports = new AdminService();
