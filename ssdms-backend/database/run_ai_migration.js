const fs = require('fs');
const path = require('path');
const { pool } = require('../config/database');
const logger = require('../utils/logger');

async function runMigration() {
    try {
        const sqlPath = path.join(__dirname, 'migration_ai_engine.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        
        // Remove comments and split by semicolon
        const statements = sql
            .split(';')
            .map(stmt => stmt.trim())
            .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

        for (const statement of statements) {
            logger.info(`Executing: ${statement}`);
            await pool.query(statement);
        }

        logger.info('✅ AI Engine Migration applied successfully!');
    } catch (error) {
        logger.error('❌ Migration failed:', error.message);
    } finally {
        await pool.end();
        process.exit();
    }
}

runMigration();
