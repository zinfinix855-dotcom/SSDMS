const mysql = require('mysql2/promise');
const config = require('./env');

// Create a connection pool to MySQL using environment variables
const pool = mysql.createPool({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME || 'ssdms',
    port: parseInt(process.env.DB_PORT || '3306', 10),
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Test connection
const testConnection = async () => {
    try {
        const connection = await pool.getConnection();
        console.log('✅ Connected to MySQL Database:', config.db.database);
        connection.release();
    } catch (error) {
        console.error('❌ Database connection failed:', error.message);
        process.exit(1);
    }
};

module.exports = {
    pool,
    testConnection
};
