require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ssdms',
    port: process.env.DB_PORT || 3306,
});

async function migrate() {
    console.log('🚀 Starting Multitenancy Migration (Phase 3)...');
    const connection = await pool.getConnection();

    try {
        const tables = [
            'files', 
            'users', 
            'roles', 
            'audit_logs', 
            'workflow_rules', 
            'sla_config',
            'file_movements',
            'section_entries',
            'finance_splits'
        ];

        for (const table of tables) {
            console.log(`--- Adding hospital_id to ${table} ---`);
            const [columns] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE 'hospital_id'`);
            if (columns.length === 0) {
                await connection.query(`ALTER TABLE ${table} ADD COLUMN hospital_id INT DEFAULT 1`);
                await connection.query(`CREATE INDEX idx_${table}_hospital ON ${table} (hospital_id)`);
                console.log(`Column added and indexed for ${table}.`);
            } else {
                console.log(`hospital_id already exists for ${table}.`);
            }
        }

        console.log('✅ Multitenancy Migration Completed Successfully!');
    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
