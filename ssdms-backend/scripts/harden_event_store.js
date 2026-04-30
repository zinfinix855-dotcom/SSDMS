require('dotenv').config();
const { pool } = require('../config/database');

/**
 * Migration: Immutability Chaining for Event Store
 * Adds hash chaining to event_store to make it a verifiable audit ledger.
 */
async function hardenEventStore() {
    console.log('🏗️ Starting Event Store Hardening (Hash Chaining)...');

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        console.log('Adding hash columns to event_store...');
        await connection.query('ALTER TABLE event_store ADD COLUMN event_hash VARCHAR(64) AFTER visit_number');
        await connection.query('ALTER TABLE event_store ADD COLUMN previous_hash VARCHAR(64) AFTER event_hash');
        
        await connection.query('CREATE INDEX idx_event_hash ON event_store(event_hash)');

        await connection.commit();
        console.log('✅ Migration Successful: event_store now supports SHA-256 chaining.');
    } catch (err) {
        await connection.rollback();
        console.error('❌ Migration Failed:', err.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

hardenEventStore();
