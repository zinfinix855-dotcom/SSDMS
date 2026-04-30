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
        console.log('--- Files Table ---');
        const [filesCols] = await connection.query('DESCRIBE files');
        console.table(filesCols);

        console.log('\n--- File Movements Table ---');
        const [movCols] = await connection.query('DESCRIBE file_movements');
        console.table(movCols);

        console.log('\n--- Workflow SLA Rules Table ---');
        const [tables] = await connection.query('SHOW TABLES LIKE "workflow_sla_rules"');
        if (tables.length > 0) {
            console.log('✅ workflow_sla_rules exists');
            const [rules] = await connection.query('SELECT * FROM workflow_sla_rules');
            console.table(rules);
        } else {
            console.log('❌ workflow_sla_rules MISSING');
        }

    } catch (error) {
        console.error('Error checking schema:', error);
    } finally {
        await connection.end();
    }
}

checkSchema();
