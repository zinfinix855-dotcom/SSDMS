require('dotenv').config({ path: '../.env' });
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ssdms',
    port: process.env.DB_PORT || 3306,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
});

async function migrate() {
    console.log('🚀 Starting Data Integrity Migration (Phase 1)...');
    const connection = await pool.getConnection();

    try {
        // 1. Add is_archived and archived_at
        console.log('--- Checking/Adding Archive Columns ---');
        const [columns] = await connection.query(`SHOW COLUMNS FROM files LIKE 'is_archived'`);
        if (columns.length === 0) {
            await connection.query(`ALTER TABLE files ADD COLUMN is_archived BOOLEAN DEFAULT FALSE`);
            await connection.query(`ALTER TABLE files ADD COLUMN archived_at DATETIME DEFAULT NULL`);
            console.log('Columns added.');
        } else {
            console.log('Columns already exist.');
        }

        // 2. Create index on deleted_at and is_archived for performance
        console.log('--- Creating Performance Indexes ---');
        // Check if index exists first (optional but safer)
        try {
            await connection.query(`CREATE INDEX idx_files_integrity ON files (deleted_at, is_archived)`);
        } catch (idxErr) {
            console.log('Index probably already exists, skipping...');
        }

        console.log('✅ Data Integrity Migration Completed Successfully!');
    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
