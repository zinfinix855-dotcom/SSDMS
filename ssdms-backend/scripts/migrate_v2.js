const { pool } = require('../config/database');

async function migrate() {
    console.log('🚀 Starting Database Migration (v2)...');
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();

        const addColumnIfMissing = async (table, column, definition) => {
            const [cols] = await connection.query(`SHOW COLUMNS FROM ${table} LIKE ?`, [column]);
            if (cols.length === 0) {
                console.log(`🔹 Adding ${column} to ${table}...`);
                await connection.query(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
            } else {
                console.log(`🔸 Column ${column} already exists in ${table}.`);
            }
        };

        const addIndexIfMissing = async (table, indexName, columns) => {
            const [indices] = await connection.query(`SHOW INDEX FROM ${table} WHERE Key_name = ?`, [indexName]);
            if (indices.length === 0) {
                console.log(`🔹 Creating index ${indexName} on ${table}...`);
                await connection.query(`CREATE INDEX ${indexName} ON ${table}(${columns})`);
            } else {
                console.log(`🔸 Index ${indexName} already exists on ${table}.`);
            }
        };

        await addColumnIfMissing('users', 'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
        await addColumnIfMissing('files', 'deleted_at', 'TIMESTAMP NULL DEFAULT NULL');
        await addColumnIfMissing('files', 'is_archived', 'BOOLEAN DEFAULT FALSE');

        await addIndexIfMissing('files', 'idx_files_deleted_at', 'deleted_at');
        await addIndexIfMissing('users', 'idx_users_deleted_at', 'deleted_at');
        await addIndexIfMissing('files', 'idx_files_archived', 'is_archived');

        await connection.commit();
        console.log('✅ Migration successful!');
    } catch (error) {
        if (connection) await connection.rollback();
        console.error('❌ Migration failed:', error.message);
        process.exit(1);
    } finally {
        if (connection) connection.release();
        process.exit(0);
    }
}

migrate();
