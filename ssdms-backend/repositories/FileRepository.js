const BaseRepository = require('./BaseRepository');
const { encrypt, decrypt, blindIndex } = require('../utils/encryption');
const crypto = require('crypto');

class FileRepository extends BaseRepository {
    constructor() {
        super('files');
    }

    async findByVisitOrSsc(visitNumber, connection = null, lock = false) {
        let query = `
            SELECT * FROM files 
            WHERE (visit_number = ? OR ssc_visit_number = ?) AND hospital_id = ? AND deleted_at IS NULL
        `;
        if (lock) {
            query += ' FOR UPDATE';
        }

        const conn = connection || this.pool;
        const [rows] = await conn.query(query, [visitNumber, visitNumber, this.hospitalId]);
        return rows[0];
    }

    async getLatestVisitNumber() {
        const query = `SELECT visit_number FROM files WHERE deleted_at IS NULL ORDER BY created_at DESC LIMIT 1`;
        const [rows] = await this.pool.query(query);
        return rows[0]?.visit_number;
    }

    async search(filters, limit, offset) {
        let whereClauses = ['hospital_id = ?', 'deleted_at IS NULL'];
        let params = [this.hospitalId];

        if (filters.query) {
            const { blindIndex } = require('../utils/encryption');
            const query = filters.query.trim();
            const queryBindex = blindIndex(query);

            whereClauses.push(`(visit_number LIKE ? OR ssc_visit_number LIKE ? OR cnic_bindex = ? OR patient_name_bindex = ? OR mr_number LIKE ?)`);
            
            const searchParam = `${query}%`; 
            params.push(searchParam, searchParam, queryBindex, queryBindex, searchParam);
        }

        if (filters.visit_number) {
            whereClauses.push('visit_number = ?');
            params.push(filters.visit_number);
        }

        if (filters.ssc_visit_number) {
            whereClauses.push('ssc_visit_number = ?');
            params.push(filters.ssc_visit_number);
        }

        if (filters.stages && filters.stages.length > 0) {
            whereClauses.push(`current_stage IN (${filters.stages.map(() => '?').join(',')})`);
            params.push(...filters.stages);
        }

        if (filters.statuses && filters.statuses.length > 0) {
            whereClauses.push(`status IN (${filters.statuses.map(() => '?').join(',')})`);
            params.push(...filters.statuses);
        }

        // Phase 7: Advanced Filtering
        if (filters.date_from) {
            whereClauses.push('created_at >= ?');
            params.push(filters.date_from);
        }
        if (filters.date_to) {
            whereClauses.push('created_at <= ?');
            params.push(filters.date_to);
        }
        if (filters.min_priority) {
            whereClauses.push('priority_score >= ?');
            params.push(filters.min_priority);
        }

        const whereSql = ` WHERE ${whereClauses.join(' AND ')}`;

        const countSql = `SELECT COUNT(*) as total FROM files${whereSql}`;
        const [countResult] = await this.pool.query(countSql, params);
        const total = countResult[0].total;

        // Enforce Enterprise Pagination (Phase 2)
        const finalLimit = Math.min(parseInt(limit) || 50, 100); 
        const finalOffset = parseInt(offset) || 0;

        const sql = `
            SELECT visit_number, ssc_visit_number, patient_name, mr_number, cnic, current_stage, status, priority_score, deadline_at, updated_at 
            FROM files${whereSql} 
            ORDER BY priority_score DESC, updated_at DESC LIMIT ? OFFSET ?
        `;
        const [files] = await this.pool.query(sql, [...params, finalLimit, finalOffset]);

        const { decrypt } = require('../utils/encryption');
        const decryptedFiles = files.map(file => ({
            ...file,
            patient_name: decrypt(file.patient_name),
            cnic: decrypt(file.cnic)
        }));

        return { files: decryptedFiles, total };
    }

    async getFullDetail(visitNumber) {
        const { decrypt } = require('../utils/encryption');
        const file = await this.findByVisitOrSsc(visitNumber);
        if (!file) return null;

        // Decrypt PII
        file.patient_name = decrypt(file.patient_name);
        file.cnic = decrypt(file.cnic);

        const vn = file.visit_number;

        const [history] = await this.pool.query(
            `SELECT fm.*, u.name as employee_name FROM file_movements fm LEFT JOIN users u ON fm.action_by = u.employee_id WHERE fm.visit_number = ? ORDER BY fm.action_date DESC`,
            [vn]
        );

        const [sections] = await this.pool.query(
            `SELECT se.*, u.name as entered_by_name FROM section_entries se LEFT JOIN users u ON se.entered_by = u.employee_id WHERE se.visit_number = ? ORDER BY se.created_at ASC`,
            [vn]
        );

        // FIX: Decrypt section data if encrypted (Phase 6 Hardening)
        const decryptedSections = sections.map(se => {
            let dataObj = se.data;
            if (typeof se.data === 'string' && se.data.includes(':')) {
                const decrypted = decrypt(se.data);
                if (decrypted !== 'DECRYPTION_ERROR') {
                    try { dataObj = JSON.parse(decrypted); } catch(e) { dataObj = decrypted; }
                }
            } else if (typeof se.data === 'string') {
                try { dataObj = JSON.parse(se.data); } catch(e) {}
            }
            return { ...se, data: dataObj };
        });

        const [comments] = await this.pool.query(
            `SELECT fc.*, u.name as employee_name FROM file_comments fc LEFT JOIN users u ON fc.employee_id = u.employee_id WHERE fc.visit_number = ? ORDER BY fc.created_at DESC`,
            [vn]
        );

        const [attachments] = await this.pool.query(
            `SELECT fa.*, u.name as employee_name FROM file_attachments fa LEFT JOIN users u ON fa.employee_id = u.employee_id WHERE fa.visit_number = ? ORDER BY fa.created_at DESC`,
            [vn]
        );

        const [splits] = await this.pool.query(
            `SELECT * FROM finance_splits WHERE visit_number = ? ORDER BY id ASC`,
            [vn]
        );

        return { file, history, sections: decryptedSections, comments, attachments, splits };
    }

    async updateFileStatus(visitNumber, stage, status, connection) {
        const conn = connection || this.pool;
        await conn.query(
            `UPDATE files SET current_stage = ?, status = ?, updated_at = NOW() WHERE visit_number = ?`,
            [stage, status, visitNumber]
        );
    }

    async updateFileStatusV4(visitNumber, stage, status, score, deadlineSql, connection) {
        const conn = connection || this.pool;
        
        // Ensure atomic update with timestamp
        let query = `UPDATE files SET current_stage = ?, status = ?, priority_score = ?, updated_at = NOW()`;
        const params = [stage, status, score];

        if (deadlineSql) {
            query += `, deadline_at = ${deadlineSql}`; 
        }

        query += ` WHERE visit_number = ?`;
        params.push(visitNumber);

        const [result] = await conn.query(query, params);
        if (result.affectedRows === 0) {
            throw new Error(`Failed to update file ${visitNumber}. Not found or concurrency conflict.`);
        }
    }

    async logMovement(visitNumber, from, to, userId, remarks, type = 'Forwarded', connection) {
        const conn = connection || this.pool;
        await conn.query(
            `INSERT INTO file_movements (visit_number, from_stage, to_stage, action_by, status, remarks) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [visitNumber, from, to, userId, type, remarks]
        );
    }

    async addSectionEntry(visitNumber, stage, data, userId, connection) {
        const conn = connection || this.pool;

        // Phase 6: Granular Diffing for Auditing
        const [latest] = await conn.query(
            `SELECT data FROM section_entries WHERE visit_number = ? AND stage_name = ? ORDER BY id DESC LIMIT 1`,
            [visitNumber, stage]
        );

        let diff = {};
        if (latest && latest.length > 0) {
            let oldData = latest[0].data;
            // FIX: Decrypt for diffing if encrypted
            if (typeof oldData === 'string' && oldData.includes(':')) {
                const decrypted = decrypt(oldData);
                if (decrypted !== 'DECRYPTION_ERROR') oldData = decrypted;
            }
            
            const oldObj = typeof oldData === 'string' ? JSON.parse(oldData) : oldData;
            
            for (const key in data) {
                 if (JSON.stringify(data[key]) !== JSON.stringify(oldObj[key])) {
                     diff[key] = { from: oldObj[key], to: data[key] };
                 }
            }
        } else {
            diff = { _new: true };
        }

        // FIX: Encrypt the data blob before insertion (Enterprise Hardening)
        const encryptedData = encrypt(JSON.stringify(data));

        await conn.query(
            `INSERT INTO section_entries (visit_number, stage_name, data, entered_by) 
             VALUES (?, ?, ?, ?)`,
            [visitNumber, stage, encryptedData, userId]
        );

        return diff;
    }

    /**
     * Permanent Record of System Events (Phase 4 Requirement)
     * Implements SHA-256 hash chaining for immutable audit ledger.
     */
    async saveEvent(eventType, payload, visitNumber, connection) {
        const conn = connection || this.pool;
        
        // 1. Get the latest event hash for chaining
        const [lastEvent] = await conn.query(
            'SELECT event_hash FROM event_store ORDER BY id DESC LIMIT 1'
        );
        const previousHash = lastEvent[0]?.event_hash || '0'.repeat(64);

        // 2. Generate hash for current event
        const eventData = JSON.stringify({
            eventType,
            payload,
            visitNumber,
            previousHash,
            timestamp: new Date().toISOString()
        });
        const eventHash = crypto.createHash('sha256').update(eventData).digest('hex');

        // 3. Persist with chain integrity
        await conn.query(
            `INSERT INTO event_store (event_type, payload, visit_number, event_hash, previous_hash) 
             VALUES (?, ?, ?, ?, ?)`,
            [eventType, JSON.stringify(payload), visitNumber, eventHash, previousHash]
        );
    }

    async addFinanceSplits(visitNumber, splits, connection) {
        const conn = connection || this.pool;
        for (const split of splits) {
            await conn.query(
                `INSERT INTO finance_splits (visit_number, doctor_name, approved_amount, payment_status, remarks) 
                VALUES (?, ?, ?, ?, ?)`,
                [visitNumber, split.doctor_name, split.amount, split.status || 'Pending', split.remarks]
            );
        }
    }

    async createAdmissionRecord(visitNumber, data, userId, connection) {
        const conn = connection || this.pool;
        const { ssc_visit_number, patient_name, mr_number, cnic, cnic_image_url, hospital_name } = data;

        const encryptedName = encrypt(patient_name);
        const nameBindex = blindIndex(patient_name);
        const encryptedCnic = encrypt(cnic);
        const cnicBindex = blindIndex(cnic);

        await conn.query(
            `INSERT INTO files (visit_number, ssc_visit_number, patient_name, patient_name_bindex, mr_number, cnic, cnic_bindex, cnic_image_url, hospital_name, admission_date, current_stage, created_by, hospital_id) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), 'Discharge', ?, ?)`,
            [visitNumber, ssc_visit_number || null, encryptedName, nameBindex, mr_number, encryptedCnic, cnicBindex, cnic_image_url || null, hospital_name, userId, this.hospitalId]
        );
    }

    async getAllActiveFiles() {
        const query = `
            SELECT visit_number, current_stage, status, updated_at, created_at 
            FROM files 
            WHERE status != 'Completed' AND status != 'Archived' AND deleted_at IS NULL
        `;
        const [rows] = await this.pool.query(query);
        return rows;
    }

    async updatePriorityScore(visitNumber, score, aiPredictions = null, connection = null) {
        const conn = connection || this.pool;
        if (aiPredictions) {
            await conn.query(
                `UPDATE files SET priority_score = ?, risk_score = ?, predicted_completion_hours = ?, ai_summary = ? WHERE visit_number = ?`,
                [score, aiPredictions.risk_score, aiPredictions.predicted_completion_hours, aiPredictions.ai_summary, visitNumber]
            );
        } else {
            await conn.query(
                `UPDATE files SET priority_score = ? WHERE visit_number = ?`,
                [score, visitNumber]
            );
        }
    }

    /**
     * AI Engine v2 Learning Feed
     */
    async saveAIFeedback(visitNumber, stage, predictedHours, actualHours, predictedRisk, breached, connection = null) {
        const conn = connection || this.pool;
        await conn.query(
            `INSERT INTO ai_feedback (visit_number, current_stage, predicted_hours, actual_hours, predicted_risk, breached) 
             VALUES (?, ?, ?, ?, ?, ?)`,
            [visitNumber, stage, predictedHours, actualHours, predictedRisk, breached]
        );
    }

    async getReturnCount(visitNumber) {
        const [rows] = await this.pool.query(
            `SELECT COUNT(*) as count FROM file_movements WHERE visit_number = ? AND status = 'Returned'`,
            [visitNumber]
        );
        return rows[0]?.count || 0;
    }
}

module.exports = new FileRepository();
