const mysql = require('mysql2/promise');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function fixSchema() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
    });

    try {
        console.log('Checking and fixing schema...');

        // Fix 'files' table
        const [filesColumns] = await connection.execute('SHOW COLUMNS FROM files');
        const filesHasCreatedAt = filesColumns.some(c => c.Field === 'created_at');
        if (!filesHasCreatedAt) {
            console.log('Adding created_at to files...');
            await connection.execute('ALTER TABLE files ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        } else {
            console.log('files already has created_at');
        }

        const filesHasSLA = filesColumns.some(c => c.Field === 'last_sla_status');
        if (!filesHasSLA) {
            console.log('Adding last_sla_status to files...');
            await connection.execute('ALTER TABLE files ADD COLUMN last_sla_status VARCHAR(50) DEFAULT "Grace"');
        } else {
            console.log('files already has last_sla_status');
        }

        // Fix 'file_movements' table
        const [movementsColumns] = await connection.execute('SHOW COLUMNS FROM file_movements');
        const movementsHasCreatedAt = movementsColumns.some(c => c.Field === 'created_at');
        if (!movementsHasCreatedAt) {
            console.log('Adding created_at to file_movements...');
            await connection.execute('ALTER TABLE file_movements ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP');
        } else {
            console.log('file_movements already has created_at');
        }

        console.log('Schema fix complete.');
    } catch (err) {
        console.error('Error fixing schema:', err);
    } finally {
        await connection.end();
    }
}

fixSchema();
