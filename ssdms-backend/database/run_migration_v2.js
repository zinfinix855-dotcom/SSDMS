const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ssdms',
        multipleStatements: true
    });

    try {
        console.log('Reading migration file...');
        const sql = fs.readFileSync(path.join(__dirname, 'migration_v2.sql'), 'utf8');
        console.log('Executing migration...');
        await connection.query(sql);
        console.log('✅ Migration v2 completed successfully');
    } catch (error) {
        console.error('❌ Migration failed:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigration();
