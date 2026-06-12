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
        console.log('Querying knex_migrations table...');
        const [rows] = await pool.query('SELECT * FROM knex_migrations');
        console.log('Migrations:', rows);
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
})();
