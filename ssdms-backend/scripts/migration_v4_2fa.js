require('dotenv').config();
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
    host: process.env.DB_HOST || '127.0.0.1',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'ssdms',
    port: process.env.DB_PORT || 3306,
});

async function migrate() {
    console.log('🚀 Starting 2FA Migration (Phase 6)...');
    const connection = await pool.getConnection();

    try {
        console.log('--- Adding 2FA columns to users ---');
        const [columns] = await connection.query(`SHOW COLUMNS FROM users LIKE 'two_factor_secret'`);
        if (columns.length === 0) {
            await connection.query(`ALTER TABLE users 
                ADD COLUMN two_factor_secret VARCHAR(255) DEFAULT NULL,
                ADD COLUMN two_factor_enabled BOOLEAN DEFAULT FALSE`);
            console.log('2FA columns added for users table.');
        } else {
            console.log('2FA columns already exist for users.');
        }

        console.log('✅ 2FA Migration Completed Successfully!');
    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
