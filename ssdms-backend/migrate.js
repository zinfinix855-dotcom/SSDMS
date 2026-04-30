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
        console.log('Migrating records from Admission back to Discharge...');
        const [rows] = await pool.query('SELECT visit_number FROM files WHERE current_stage = "Admission" AND status = "In Progress" AND deleted_at IS NULL');
        
        console.log(`Found ${rows.length} records.`);
        
        for (const row of rows) {
            await pool.query('UPDATE files SET current_stage = "Discharge", updated_at = NOW() WHERE visit_number = ?', [row.visit_number]);
            console.log(`Moved ${row.visit_number} to Discharge.`);
        }
        
    } catch (err) {
        console.error('Migration failed:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
})();
