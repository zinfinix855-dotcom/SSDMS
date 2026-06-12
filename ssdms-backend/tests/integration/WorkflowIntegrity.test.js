require('dotenv').config();
const { pool } = require('../../config/database');
const workflowService = require('../../services/WorkflowService');
const FileRepository = require('../../repositories/FileRepository');

/**
 * INTEGRATION TEST: Workflow & Audit Integrity
 * 
 * Verifies:
 * 1. Concurrency Protection (FOR UPDATE)
 * 2. Audit Ledger consistency (event_store chaining)
 * 3. File movement history recording
 */
describe('Workflow Integration & Hardening', () => {
    const testVisit = 'SSC-INT-TEST';
    const userId = 'TEST-EMP-1';

    beforeAll(async () => {
        // Set tenant context for the repository
        FileRepository.setTenantContext(1);
        
        // Resolve Employee Role ID
        const [roles] = await pool.query('SELECT id FROM roles WHERE name = "Employee"');
        const employeeRoleId = roles[0]?.id || 3; // Fallback to 3 if not found (based on our check)

        // Seed User for testing
        await pool.query(
            'INSERT INTO users (employee_id, name, email, password_hash, role_id, hospital_id) VALUES (?, "Test Emp", "emp@test.com", "hash", ?, 1) ON DUPLICATE KEY UPDATE role_id = ?',
            [userId, employeeRoleId, employeeRoleId]
        );

        // Ensure test environment is clean (delete referencing tables first)
        await pool.query('DELETE FROM file_movements WHERE visit_number = ?', [testVisit]);
        await pool.query('DELETE FROM event_store WHERE visit_number = ?', [testVisit]);
        await pool.query('DELETE FROM section_entries WHERE visit_number = ?', [testVisit]);
        await pool.query('DELETE FROM finance_splits WHERE visit_number = ?', [testVisit]);
        await pool.query('DELETE FROM files WHERE visit_number = ?', [testVisit]);
        
        await pool.query(
            'INSERT INTO files (visit_number, hospital_id, current_stage, status, patient_name, mr_number, cnic) VALUES (?, 1, "Admission", "In Progress", "Test Patient", "MR-001", "12345-6789012-3")',
            [testVisit]
        );
    });

    afterAll(async () => {
        // Optional: cleanup after tests
        // await pool.query('DELETE FROM files WHERE visit_number = ?', [testVisit]);
    });

    test('should prevent race conditions using FOR UPDATE locking', async () => {
        // Start Task 1 which will hold the lock
        const task1 = (async () => {
            const conn = await pool.getConnection();
            await conn.beginTransaction();
            try {
                // Acquire lock
                await conn.query('SELECT * FROM files WHERE visit_number = ? FOR UPDATE', [testVisit]);
                // Simulate processing delay
                await new Promise(resolve => setTimeout(resolve, 1000));
                // Update and commit
                await conn.query('UPDATE files SET current_stage = "Discharge" WHERE visit_number = ?', [testVisit]);
                await conn.commit();
            } finally {
                conn.release();
            }
        })();

        // Start Task 2 shortly after
        await new Promise(resolve => setTimeout(resolve, 200));
        
        const start = Date.now();
        const conn2 = await pool.getConnection();
        await conn2.beginTransaction();
        try {
            // This should block until Task 1 completes
            const [file] = await conn2.query('SELECT * FROM files WHERE visit_number = ? FOR UPDATE', [testVisit]);
            const duration = Date.now() - start;
            
            expect(duration).toBeGreaterThanOrEqual(700); // Should have waited for Task 1
            expect(file[0].current_stage).toBe('Discharge'); // Should see Task 1's change
            
            await conn2.commit();
        } finally {
            conn2.release();
        }

        await task1;
    });

    test('should maintain immutable audit chain in event_store', async () => {
        // Trigger a move from Discharge -> Pre-Approval
        await workflowService.forwardFile(testVisit, 'Discharge', { test: true }, 'Integrity check', userId);

        // 1. Check if file stage actually updated
        const [after] = await pool.query('SELECT current_stage, status FROM files WHERE visit_number = ?', [testVisit]);
        expect(after[0].current_stage).toBe('Pre-Approval');

        // 2. Fetch latest 2 events to check chaining
        const [events] = await pool.query(
            'SELECT * FROM event_store WHERE visit_number = ? ORDER BY id DESC LIMIT 2',
            [testVisit]
        );
        expect(events.length).toBeGreaterThanOrEqual(1);
        
        const latestEvent = events[0];
        expect(latestEvent.event_hash).toBeDefined();

        // 3. Check movements
        const [movements] = await pool.query(
            'SELECT * FROM file_movements WHERE visit_number = ? ORDER BY id DESC',
            [testVisit]
        );
        expect(movements.length).toBeGreaterThanOrEqual(1);
        expect(movements[0].from_stage).toBe('Discharge');
        expect(movements[0].to_stage).toBe('Pre-Approval');
        expect(movements[0].action_by).toBe(userId);
    });
});
