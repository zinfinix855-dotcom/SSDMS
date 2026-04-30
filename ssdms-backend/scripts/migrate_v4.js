const mysql = require('mysql2/promise');
require('dotenv').config();

(async () => {
    const pool = mysql.createPool({
        host: process.env.DB_HOST || 'localhost',
        user: process.env.DB_USER || 'root',
        password: process.env.DB_PASSWORD || '',
        database: process.env.DB_NAME || 'ssdms',
        port: process.env.DB_PORT || 3306
    });

    try {
        console.log('🚀 Starting V4 Database Migration...');

        // 1. Create Workflow Rules Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS workflow_rules (
                id INT AUTO_INCREMENT PRIMARY KEY,
                from_stage VARCHAR(50) NOT NULL,
                to_stage VARCHAR(50) NOT NULL,
                allowed_role VARCHAR(50) NOT NULL,
                is_active BOOLEAN DEFAULT TRUE,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('✅ Created workflow_rules table.');

        // 2. Create SLA Config Table
        await pool.query(`
            CREATE TABLE IF NOT EXISTS sla_config (
                id INT AUTO_INCREMENT PRIMARY KEY,
                stage_name VARCHAR(50) UNIQUE,
                max_hours INT NOT NULL,
                escalation_hours INT NOT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `);
        console.log('✅ Created sla_config table.');

        // 3. Alter Files Table (Ignore error if columns exist)
        const alterQueries = [
            "ALTER TABLE files ADD COLUMN deadline_at DATETIME",
            "ALTER TABLE files ADD COLUMN priority_score FLOAT DEFAULT 0",
            "ALTER TABLE files ADD COLUMN escalation_level INT DEFAULT 0"
        ];
        for (const query of alterQueries) {
            try {
                await pool.query(query);
            } catch (err) {
                if (err.code !== 'ER_DUP_FIELDNAME') throw err;
            }
        }
        console.log('✅ Altered files table setup (deadline, priority, escalation).');

        // 4. Seed Standard 10-Stage Workflow Rules
        console.log('🔄 Seeding standard 10-stage workflow transitions...');
        const workflowData = [
            ['Admission', 'Discharge', 'Employee'],
            ['Discharge', 'Pre-Approval', 'Employee'],
            ['Pre-Approval', 'Approval', 'Employee'],
            ['Approval', 'File Verification', 'Employee'],
            ['File Verification', 'E-Claim', 'Employee'],
            ['E-Claim', 'E-Claim Verification', 'Employee'],
            ['E-Claim Verification', 'Finance', 'Employee'],
            ['Finance', 'Segregation', 'Employee'],
            ['Segregation', 'Indexation', 'Employee']
        ];
        
        await pool.query('TRUNCATE TABLE workflow_rules');
        for (const [from, to, role] of workflowData) {
            await pool.query(
                'INSERT INTO workflow_rules (from_stage, to_stage, allowed_role) VALUES (?, ?, ?)',
                [from, to, role]
            );
        }

        // Add reverse flow (return to previous)
        const reverseData = [
            ['Discharge', 'Admission', 'Employee'],
            ['Pre-Approval', 'Discharge', 'Employee'],
            ['Approval', 'Pre-Approval', 'Employee'],
            ['File Verification', 'Approval', 'Employee'],
            ['E-Claim', 'File Verification', 'Employee'],
            ['E-Claim Verification', 'E-Claim', 'Employee'],
            ['Finance', 'E-Claim Verification', 'Employee'],
            ['Segregation', 'Finance', 'Employee'],
            ['Indexation', 'Segregation', 'Employee']
        ];
        for (const [from, to, role] of reverseData) {
            await pool.query(
                'INSERT INTO workflow_rules (from_stage, to_stage, allowed_role) VALUES (?, ?, ?)',
                [from, to, role]
            );
        }
        console.log('✅ Seeded workflow_rules forward and reverse paths.');

        // 5. Seed SLA Standards
        console.log('🔄 Seeding SLA config metrics...');
        const slaData = [
            ['Admission', 24, 48],
            ['Discharge', 24, 48],
            ['Pre-Approval', 48, 72],
            ['Approval', 48, 72],
            ['File Verification', 72, 96],
            ['E-Claim', 48, 72],
            ['E-Claim Verification', 72, 96],
            ['Finance', 96, 120],
            ['Segregation', 24, 48],
            ['Indexation', 24, 48]
        ];

        await pool.query('TRUNCATE TABLE sla_config');
        for (const [stage, max, esc] of slaData) {
            await pool.query(
                'INSERT INTO sla_config (stage_name, max_hours, escalation_hours) VALUES (?, ?, ?)',
                [stage, max, esc]
            );
        }
        console.log('✅ Seeded sla_config baseline metrics.');

        console.log('🎉 V4 Migration Completed Successfully!');

    } catch (err) {
        console.error('❌ V4 Migration failed:', err.message);
    } finally {
        await pool.end();
        process.exit(0);
    }
})();
