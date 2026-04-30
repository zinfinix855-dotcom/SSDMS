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
    console.log('🚀 Starting Auth Migration (Phase 2)...');
    const connection = await pool.getConnection();

    try {
        // 1. Create user_sessions table
        console.log('--- Creating user_sessions Table ---');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS user_sessions (
                id INT AUTO_INCREMENT PRIMARY KEY,
                user_id VARCHAR(50) NOT NULL,
                refresh_token VARCHAR(255) NOT NULL,
                ip_address VARCHAR(45) DEFAULT NULL,
                user_agent TEXT DEFAULT NULL,
                expires_at DATETIME NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                KEY idx_refresh_token (refresh_token),
                KEY idx_user_id (user_id)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        console.log('✅ Auth Migration Completed Successfully!');
    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
