require('dotenv').config();
const { pool } = require('../config/database');

/**
 * Migration: Harden workflow_rules table
 * Moves 'allowed_role' (varchar) to 'allowed_roles' (JSON) and converts data.
 */
async function migrateWorkflowRules() {
    console.log('🏗️ Starting Workflow Rules Migration...');

    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        // 1. Add the new JSON column
        console.log('Adding allowed_roles JSON column...');
        await connection.query('ALTER TABLE workflow_rules ADD COLUMN allowed_roles JSON AFTER allowed_role');

        // 2. Transfer data: convert "Role" to ["Role"]
        console.log('Transferring data from allowed_role to allowed_roles...');
        const [rows] = await connection.query('SELECT id, allowed_role FROM workflow_rules');
        for (const row of rows) {
            const jsonValue = JSON.stringify([row.allowed_role]);
            await connection.query('UPDATE workflow_rules SET allowed_roles = ? WHERE id = ?', [jsonValue, row.id]);
        }

        // 3. Drop the old column
        console.log('Dropping legacy allowed_role column...');
        await connection.query('ALTER TABLE workflow_rules DROP COLUMN allowed_role');

        // 4. Verify
        const [verification] = await connection.query('DESCRIBE workflow_rules');
        console.table(verification);

        await connection.commit();
        console.log('✅ Migration Successful: workflow_rules is now hardened with JSON arrays.');
    } catch (err) {
        await connection.rollback();
        console.error('❌ Migration Failed:', err.message);
    } finally {
        connection.release();
        process.exit(0);
    }
}

migrateWorkflowRules();
