const mysql = require('mysql2/promise');
require('dotenv').config({ path: 'ssdms-backend/.env' });

(async () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Checking for records in Discharge stage that should be in Admission...');
        const [rows] = await pool.query('SELECT visit_number FROM files WHERE current_stage = "Discharge" AND status = "In Progress" AND deleted_at IS NULL');
        
        console.log(`Found ${rows.length} records to move.`);
        
        for (const row of rows) {
            await pool.query('UPDATE files SET current_stage = "Admission", updated_at = NOW() WHERE visit_number = ?', [row.visit_number]);
            console.log(`Moved ${row.visit_number} to Admission stage.`);
        }
        
        console.log('Data migration complete.');
    } catch (err) {
        console.error('Migration failed:', err);
    } finally {
        await pool.end();
        process.exit(0);
    }
})();
