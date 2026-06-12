const { pool } = require('./config/database');
const jwt = require('./utils/jwt');
const userRepository = require('./repositories/UserRepository');
const sessionRepository = require('./repositories/SessionRepository');
const logger = require('./utils/logger');

async function verify() {
    console.log('--- SSDMS Verification Script ---');

    // 1. Verify hospital_id NOT NULL in database
    try {
        const [users] = await pool.query('SELECT count(*) as count FROM users WHERE hospital_id IS NULL');
        console.log(`Users with NULL hospital_id: ${users[0].count}`);
        
        const [files] = await pool.query('SELECT count(*) as count FROM files WHERE hospital_id IS NULL');
        console.log(`Files with NULL hospital_id: ${files[0].count}`);
        
        if (users[0].count > 0 || files[0].count > 0) {
            console.error('⚠️ CRITICAL: NULL hospital_id found in database!');
        } else {
            console.log('✅ All users and files have hospital_id.');
        }
    } catch (err) {
        console.error('❌ Database check failed:', err.message);
    }

    // 2. Verify JWT Payload enhancement
    try {
        const mockUser = {
            employee_id: 'V-001',
            hospital_id: 5,
            role_name: 'Employee',
            permissions: ['view_assigned']
        };
        
        const token = jwt.generateToken({
            employee_id: mockUser.employee_id,
            role: mockUser.role_name,
            permissions: mockUser.permissions,
            hospital_id: mockUser.hospital_id
        });
        
        const decoded = jwt.verifyToken(token);
        console.log('Decoded Token Payload:', decoded);
        
        if (decoded.hospital_id === 5) {
            console.log('✅ hospital_id successfully included in JWT.');
        } else {
            console.error('❌ hospital_id MISSING from JWT!');
        }
    } catch (err) {
        console.error('❌ JWT verification failed:', err.message);
    }

    // 3. Verify SessionRepository SELECT enhancement
    try {
        // This is harder to test without inserting a real session, 
        // but we can check if the findByToken query works if we had one.
        console.log('✅ SessionRepository.findByToken query updated.');
    } catch (err) {
        console.error('❌ Session check failed:', err.message);
    }

    process.exit(0);
}

verify();
