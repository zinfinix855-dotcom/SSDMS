const mysql = require('mysql2/promise');
const bcrypt = require('bcrypt');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function updateAdminCredentials() {
    const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ssdms',
        port: process.env.DB_PORT || 3306,
    });

    try {
        console.log('Hashing new password...');
        const newPasswordHash = await bcrypt.hash('admin4755', 10);

        console.log('Disabling foreign key checks...');
        await connection.execute('SET foreign_key_checks = 0;');

        console.log('Updating users table...');
        const [resultUser] = await connection.execute(
            'UPDATE users SET employee_id = ?, password_hash = ? WHERE employee_id = ?',
            ['Admin01', newPasswordHash, 'ADMIN-001']
        );

        console.log('Updating dependent tables...');
        const updates = [
            'UPDATE files SET created_by = ? WHERE created_by = ?',
            'UPDATE file_movements SET action_by = ? WHERE action_by = ?',
            'UPDATE section_entries SET entered_by = ? WHERE entered_by = ?',
            'UPDATE finance_splits SET approved_by = ? WHERE approved_by = ?',
            'UPDATE audit_logs SET employee_id = ? WHERE employee_id = ?',
            'UPDATE notifications SET employee_id = ? WHERE employee_id = ?',
            'UPDATE file_comments SET employee_id = ? WHERE employee_id = ?',
            'UPDATE file_attachments SET employee_id = ? WHERE employee_id = ?'
        ];

        for (const query of updates) {
            await connection.execute(query, ['Admin01', 'ADMIN-001']).catch(e => console.log(`Skipped query due to error: ${e.message}`));
        }

        console.log('Re-enabling foreign key checks...');
        await connection.execute('SET foreign_key_checks = 1;');

        console.log('Users updated:', resultUser.affectedRows);

        const [users] = await connection.execute(
            'SELECT employee_id, email, is_active, role_id FROM users WHERE employee_id = ?',
            ['Admin01']
        );
        console.log('Updated User Details:', users[0]);

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await connection.end();
    }
}

updateAdminCredentials();
