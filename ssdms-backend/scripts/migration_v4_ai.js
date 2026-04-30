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
    console.log('🚀 Starting AI Configuration Migration (Phase 2)...');
    const connection = await pool.getConnection();

    try {
        // 1. Create ai_config table
        console.log('--- Creating ai_config Table ---');
        await connection.query(`
            CREATE TABLE IF NOT EXISTS ai_config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                config_key VARCHAR(100) UNIQUE NOT NULL,
                config_value DECIMAL(10, 2) NOT NULL,
                description TEXT,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
        `);

        // 2. Seed default weights
        console.log('--- Seeding AI Weights ---');
        const weights = [
            ['waiting_time_weight', 0.50, 'Weight for hours waited in stage (50%)'],
            ['financial_volume_weight', 0.30, 'Weight for total approved amount/volume (30%)'],
            ['stage_criticality_weight', 0.20, 'Weight for stage-specific importance (20%)']
        ];

        for (const [key, val, desc] of weights) {
            await connection.query(
                'INSERT INTO ai_config (config_key, config_value, description) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE config_value = ?',
                [key, val, desc, val]
            );
        }

        console.log('✅ AI Configuration Migration Completed Successfully!');
    } catch (err) {
        console.error('❌ Migration Failed:', err.message);
    } finally {
        connection.release();
        process.exit();
    }
}

migrate();
