const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function checkSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ssdms',
    });

    try {
        const [filesCols] = await connection.query('DESCRIBE files');
        const fileColNames = filesCols.map(c => c.Field);
        console.log('Files columns:', fileColNames.join(', '));

        const [movCols] = await connection.query('DESCRIBE file_movements');
        const movColNames = movCols.map(c => c.Field);
        console.log('File Movements columns:', movColNames.join(', '));

    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        await connection.end();
    }
}

checkSchema();
