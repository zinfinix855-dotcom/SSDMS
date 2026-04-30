const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runQuery() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME
    });

    try {
        const [rows] = await connection.query(process.argv[2]);
        console.log(JSON.stringify(rows, null, 2));
    } catch (error) {
        console.error('Query failed:', error);
        process.exit(1);
    } finally {
        await connection.end();
    }
}

runQuery();
