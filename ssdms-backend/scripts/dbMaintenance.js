const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const config = {
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
};

/**
 * Database Maintenance & Cleanup Script
 */
async function runMaintenance() {
    let connection;
    try {
        console.log('--- SSDMS Database Maintenance ---');
        connection = await mysql.createConnection(config);

        // 1. Identify and Report Stale Files (> 7 days no movement)
        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        const [staleFiles] = await connection.execute(
            `SELECT visit_number, patient_name, current_stage, updated_at 
             FROM files 
             WHERE updated_at < ? AND status NOT IN ('Completed', 'Archived')`,
            [sevenDaysAgo]
        );

        console.log(`[INFO] Found ${staleFiles.length} stale files.`);
        if (staleFiles.length > 0) {
            console.log('--- Stale Files List ---');
            staleFiles.forEach(f => console.log(`- ${f.visit_number} | ${f.patient_name} | ${f.current_stage} | Last Activity: ${f.updated_at}`));
        }

        // 2. Perform Table Optimizations
        console.log('[ACTION] Optimizing tables...');
        await connection.execute('OPTIMIZE TABLE files, file_movements, audit_logs');
        console.log('[SUCCESS] Tables optimized.');

        // 3. Optional: Cleanup old audit logs (> 1 year)
        const oneYearAgo = new Date(Date.now() - 365 * 24 * 60 * 60 * 1000);
        const [deletedLogs] = await connection.execute(
            'DELETE FROM audit_logs WHERE created_at < ?',
            [oneYearAgo]
        );
        console.log(`[CLEANUP] Removed ${deletedLogs.affectedRows} old audit logs.`);

        console.log('--- Maintenance Complete ---');
    } catch (err) {
        console.error('[ERROR] Maintenance failed:', err);
    } finally {
        if (connection) await connection.end();
    }
}

runMaintenance();
