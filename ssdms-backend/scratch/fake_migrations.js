const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_NAME,
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('Inserting fake migrations into knex_migrations...');
        
        // Let's make sure the table exists. We can run any basic knex command to initialize migrations table if it wasn't.
        // Wait, knex_migrations table already exists in SHOW TABLES, so we can just insert directly.
        
        const migrationsToFake = [
            '20260423101652_baseline_enterprise_schema.js',
            '20260516153121_enforce_hospital_id_integrity.js'
        ];

        for (const migration of migrationsToFake) {
            // Check if already in the table
            const [existing] = await pool.query('SELECT * FROM knex_migrations WHERE name = ?', [migration]);
            if (existing.length === 0) {
                await pool.query(
                    'INSERT INTO knex_migrations (name, batch, migration_time) VALUES (?, ?, NOW())',
                    [migration, 1]
                );
                console.log(`Faked migration: ${migration}`);
            } else {
                console.log(`Migration ${migration} already registered.`);
            }
        }
    } catch (err) {
        console.error('Error:', err);
    } finally {
        await pool.end();
    }
})();
