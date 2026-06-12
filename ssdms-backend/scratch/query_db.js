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
        const [tables] = await pool.query('SHOW TABLES');
        console.log('Tables:', tables);

        for (const t of tables) {
            const tableName = Object.values(t)[0];
            const [columns] = await pool.query(`DESCRIBE \`${tableName}\``);
            console.log(`\nColumns for ${tableName}:`);
            columns.forEach(col => {
                console.log(`  ${col.Field} - ${col.Type} - ${col.Null} - ${col.Default}`);
            });
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
})();
