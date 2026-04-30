const { pool } = require('../config/database');
const FileRepository = require('../repositories/FileRepository');
const logger = require('../utils/logger');

/**
 * STRESS TEST: Concurrency Protection (FOR UPDATE)
 * 
 * This script simulates two simultaneous requests trying to 'forward' the same file.
 * It verifies that our pessimistic locking (SELECT ... FOR UPDATE) prevents
 * the race condition that previously caused duplicate movements.
 */
async function runStressTest() {
    console.log('🚀 Starting Concurrency Stress Test...');
    
    // 1. Setup: Ensure a test file exists with hospital_id = 1
    const testVisit = 'SSC-STRESS-TEST';
    await pool.query('DELETE FROM files WHERE visit_number = ?', [testVisit]);
    await pool.query(
        'INSERT INTO files (visit_number, hospital_id, current_stage, status) VALUES (?, 1, "Admission", "In-Progress")',
        [testVisit]
    );

    console.log(`✅ Test file created: ${testVisit}`);

    // 2. Simulate two parallel "forward" operations
    // We'll use a lower-level approach to demonstrate the blocking behavior
    
    const task1 = (async () => {
        console.log('Task 1: Requesting lock...');
        const conn = await pool.getConnection();
        await conn.beginTransaction();
        try {
            // This should acquire the lock
            const [file] = await conn.query('SELECT * FROM files WHERE visit_number = ? FOR UPDATE', [testVisit]);
            console.log('Task 1: 🔒 Lock acquired. Holding for 2 seconds...');
            
            await new Promise(resolve => setTimeout(resolve, 2000));
            
            await conn.query('UPDATE files SET current_stage = "Discharge" WHERE visit_number = ?', [testVisit]);
            await conn.commit();
            console.log('Task 1: ✅ Updated and Committed.');
        } catch (err) {
            console.error('Task 1 Error:', err);
            await conn.rollback();
        } finally {
            conn.release();
        }
    })();

    const task2 = (async () => {
        // Wait slightly to ensure Task 1 starts first
        await new Promise(resolve => setTimeout(resolve, 500));
        
        console.log('Task 2: Requesting lock (should block)...');
        const start = Date.now();
        const conn = await pool.getConnection();
        await conn.beginTransaction();
        try {
            // This SHOULD block until Task 1 commits
            const [file] = await conn.query('SELECT * FROM files WHERE visit_number = ? FOR UPDATE', [testVisit]);
            const duration = Date.now() - start;
            
            console.log(`Task 2: 🔓 Lock finally acquired after ${duration}ms (Expected ~1500ms).`);
            
            // Check if Task 1's change is visible
            if (file[0].current_stage === 'Discharge') {
                console.log('Task 2: ✅ Correctly detected Stage change. Aborting redundant move.');
            } else {
                console.error('Task 2: ❌ ERROR: Did not see Task 1\'s change! Isolation failed.');
            }
            
            await conn.commit();
        } catch (err) {
            console.error('Task 2 Error:', err);
            await conn.rollback();
        } finally {
            conn.release();
        }
    })();

    await Promise.all([task1, task2]);
    
    console.log('\n🏁 Stress Test Complete.');
    process.exit(0);
}

runStressTest().catch(err => {
    console.error('Stress Test Failed:', err);
    process.exit(1);
});
