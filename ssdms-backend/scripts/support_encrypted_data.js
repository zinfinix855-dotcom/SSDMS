require('dotenv').config();
const { pool } = require('../config/database');

/**
 * Migration: PII/PHI Encryption Support
 * Converts section_entries.data from JSON to LONGTEXT to support encrypted blobs.
 */
async function supportEncryptedData() {
    console.log('🏗️ Starting PII/PHI Encryption Schema Support...');

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        console.log('Altering section_entries.data column type...');
        await connection.query('ALTER TABLE section_entries MODIFY COLUMN data LONGTEXT');
        
        await connection.commit();
        console.log('✅ Migration Successful: section_entries.data now supports encrypted data.');
    } catch (err) {
        await connection.rollback();
        console.error('❌ Migration Failed:', err.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

supportEncryptedData();
