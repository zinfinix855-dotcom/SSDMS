const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'migration_ai_learning.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
            logger.info(`Executing: ${statement.substring(0, 50)}...`);
            await pool.query(statement);
        }

        logger.info('✅ AI Learning Feedback Tables applied successfully!');
    } catch (error) {
        logger.error('❌ Migration failed:', error.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

runMigration();
