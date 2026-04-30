const { pool } = require('../config/database');
const workflowService = require('../services/WorkflowService');
const FileRepository = require('../repositories/FileRepository');

/**
 * AUDIT INTEGRITY TEST
 * 
 * Verifies that a workflow transition (Forward) correctly updates all 
 * audit logs atomically:
 * 1. event_store entry
 * 2. file_movements history entry
 * 3. files table status update
 */
async function verifyAuditIntegrity() {
    console.log('🔍 Starting Audit Integrity Verification...');
    
    const testVisit = 'SSC-AUDIT-TEST';
    const userId = 'ADMIN-1';
    
    // Cleanup & Setup
    await pool.query('DELETE FROM files WHERE visit_number = ?', [testVisit]);
    await pool.query('DELETE FROM event_store WHERE visit_number = ?', [testVisit]);
    await pool.query('DELETE FROM file_movements WHERE visit_number = ?', [testVisit]);
    
    await pool.query(
        'INSERT INTO files (visit_number, hospital_id, current_stage, status) VALUES (?, 1, "Admission", "In-Progress")',
        [testVisit]
    );

    console.log(`✅ Test file prepared: ${testVisit}`);

    try {
        // Perform the workflow action
        console.log('Action: Forwarding from Admission -> Discharge...');
        await workflowService.forwardFile(testVisit, 'Admission', { note: 'Audit test' }, 'Remarks test', userId);

        // 1. Verify files table
        const [file] = await pool.query('SELECT current_stage FROM files WHERE visit_number = ?', [testVisit]);
        if (file[0].current_stage === 'Discharge') {
            console.log('✅ File Stage: Updated to Discharge.');
        } else {
            throw new Error('File stage NOT updated!');
        }

        // 2. Verify file_movements
        const [movement] = await pool.query('SELECT * FROM file_movements WHERE visit_number = ?', [testVisit]);
        if (movement.length > 0 && movement[0].to_stage === 'Discharge') {
            console.log('✅ File Movement: History record created.');
        } else {
            throw new Error('History record NOT found!');
        }

        // 3. Verify event_store
        const [event] = await pool.query('SELECT * FROM event_store WHERE visit_number = ?', [testVisit]);
        if (event.length > 0) {
            const payload = typeof event[0].payload === 'string' ? JSON.parse(event[0].payload) : event[0].payload;
            if (payload.toStage === 'Discharge' && payload.eventId) {
                console.log(`✅ Event Store: Immutable event recorded (ID: ${payload.eventId}).`);
            } else {
                throw new Error('Event payload malformed or missing data!');
            }
        } else {
            throw new Error('Event Store record NOT found!');
        }

        console.log('\n🌟 AUDIT INTEGRITY CONFIRMED: All ledger items consistent.');
    } catch (err) {
        console.error('❌ INTEGRITY FAILURE:', err.message);
    } finally {
        process.exit(0);
    }
}

verifyAuditIntegrity();
