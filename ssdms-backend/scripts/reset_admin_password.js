require('dotenv').config();
const bcrypt = require('bcrypt');
const { pool } = require('../config/database');

async function resetAdminPassword() {
    const employeeId = 'Admin01';
    const newPassword = 'Admin@123'; // Default secure password
    
    console.log(`🚀 Resetting password for ${employeeId}...`);

    try {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);

        const [result] = await pool.query(
            'UPDATE users SET password_hash = ?, is_active = 1 WHERE employee_id = ?',
            [hashedPassword, employeeId]
        );

        if (result.affectedRows > 0) {
            console.log('✅ Password successfully reset to: Admin@123');
            console.log('You can now log in with:');
            console.log(`Identification: ${employeeId}`);
            console.log('Access Key: Admin@123');
        } else {
            console.error(`❌ User ${employeeId} not found in database.`);
        }
    } catch (err) {
        console.error('❌ Error resetting password:', err.message);
    } finally {
        process.exit(0);
    }
}

resetAdminPassword();
