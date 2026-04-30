const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runMigration() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        multipleStatements: true
    });

    try {
        const sql = fs.readFileSync(path.join(__dirname, 'migration_refresh_token.sql'), 'utf8');
        await connection.query(sql);
        console.log('Refresh token migration completed successfully');
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runMigration();
