const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Querying DB tables...');
        const [rows] = await pool.query('SHOW CREATE TABLE file_movements');
        console.log(rows[0]['Create Table']);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
})();
