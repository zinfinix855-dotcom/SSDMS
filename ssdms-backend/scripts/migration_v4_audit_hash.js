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
    console.log('🚀 Starting Audit Hash Migration (Phase 3)...');
    const connection = await pool.getConnection();

    try {
        console.log('--- Checking/Adding Hash Columns to audit_logs ---');
        const [columns] = await connection.query(`SHOW COLUMNS FROM audit_logs LIKE 'previous_hash'`);
        if (columns.length === 0) {
            await connection.query(`ALTER TABLE audit_logs ADD COLUMN previous_hash VARCHAR(64) DEFAULT NULL`);
            await connection.query(`ALTER TABLE audit_logs ADD COLUMN current_hash VARCHAR(64) DEFAULT NULL`);
            console.log('Columns added.');
        } else {
            console.log('Columns already exist.');
        }

        console.log('✅ Audit Hash Migration Completed Successfully!');
    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
