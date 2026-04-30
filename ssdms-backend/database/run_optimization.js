const mysql = require('mysql2/promise');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

async function runOptimization() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || '127.0.0.1',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ssdms',
        multipleStatements: true
    });

    try {
        console.log('Executing optimization script...');
        const sql = fs.readFileSync(path.join(__dirname, 'final_optimization.sql'), 'utf8');
        await connection.query(sql);
        console.log('✅ Final database optimization complete');
    } catch (error) {
        // If some indexes already exist, we'll see errors, but we can continue or ignore
        if (error.code === 'ER_DUP_KEYNAME') {
            console.log('⚠️ Some indexes already exist, skipping duplicates.');
        } else {
            console.error('❌ Optimization failed:', error);
        }
    } finally {
        await connection.end();
    }
}

runOptimization();
