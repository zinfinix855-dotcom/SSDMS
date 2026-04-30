const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const applyMigration = async () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: parseInt(process.env.DB_PORT, 10) || 3306,
        multipleStatements: true
    });

    try {
        const migrationPath = path.join(__dirname, '../database/migrations/20260330_enterprise_schema.sql');
        const sql = fs.readFileSync(migrationPath, 'utf8');

        console.log('🚀 Applying enterprise schema migration...');
        await pool.query(sql);
        console.log('✅ Migration applied successfully.');
    } catch (error) {
        console.error('❌ Migration failed:', error.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
};

applyMigration();
