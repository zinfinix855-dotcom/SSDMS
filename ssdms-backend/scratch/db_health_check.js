require('dotenv').config();
const { pool } = require('../config/database');

async function checkDatabaseHealth() {
    console.log('📊 SSDMS DATABASE HEALTH CHECK\n');

    try {
        // 1. NULL hospital_id check
        const [usersWithNullHospital] = await pool.query('SELECT employee_id, name FROM users WHERE hospital_id IS NULL');
        if (usersWithNullHospital.length > 0) {
            console.log(`❌ CRITICAL: Found ${usersWithNullHospital.length} users with NULL hospital_id:`);
            usersWithNullHospital.forEach(u => console.log(`   - ID: ${u.employee_id}, Name: ${u.name}`));
        } else {
            console.log('✅ All users have a hospital_id assigned.');
        }

        // 2. workflow_rules check (Plural vs Singular detection)
        const [rules] = await pool.query('SELECT * FROM workflow_rules');
        let invalidCount = 0;
        rules.forEach(rule => {
            const roleData = rule.allowed_roles || rule.allowed_role;
            const columnName = rule.allowed_roles ? 'allowed_roles' : 'allowed_role';
            
            try {
                if (columnName === 'allowed_role' && typeof roleData === 'string') {
                    console.log(`⚠️  LEGACY: Rule ${rule.id} uses singular '${columnName}' string: "${roleData}"`);
                } else {
                    const roles = typeof roleData === 'string' ? JSON.parse(roleData) : roleData;
                    if (!Array.isArray(roles)) {
                        console.log(`❌ INVALID: Rule ${rule.id} (${rule.from_stage} -> ${rule.to_stage}) ${columnName} is not an array.`);
                        invalidCount++;
                    }
                }
            } catch (e) {
                console.log(`❌ CORRUPT: Rule ${rule.id} has invalid JSON in ${columnName}: ${roleData}`);
                invalidCount++;
            }
        });
        if (invalidCount === 0) {
            console.log('✅ All workflow_rules have valid JSON allowed_roles arrays.');
        }

        // 3. files table hospital_id check
        const [filesWithNullHospital] = await pool.query('SELECT visit_number FROM files WHERE hospital_id IS NULL');
        if (filesWithNullHospital.length > 0) {
            console.log(`❌ WARNING: Found ${filesWithNullHospital.length} files with NULL hospital_id.`);
        } else {
            console.log('✅ All files have a hospital_id assigned.');
        }

    } catch (err) {
        console.error('❌ Database check failed:', err.message);
    } finally {
        process.exit(0);
    }
}

checkDatabaseHealth();
