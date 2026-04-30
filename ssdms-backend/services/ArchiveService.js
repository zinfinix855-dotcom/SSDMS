const { pool } = require('../config/database');
const logger = require('../utils/logger');

/**
 * Script to archive completed files from the previous month
 */
const archivePreviousMonth = async () => {
    const connection = await pool.getConnection();
    try {
        // Calculate previous month string (YYYY-MM)
        const date = new Date();
        date.setMonth(date.getMonth() - 1);
        const archiveMonth = date.toISOString().slice(0, 7);

        await connection.beginTransaction();

        // 1. Get all completed files from that month
        const [files] = await connection.query(
            `SELECT * FROM files WHERE status = 'Completed' AND DATE_FORMAT(updated_at, '%Y-%m') = ?`,
            [archiveMonth]
        );

        if (files.length === 0) {
            logger.info(`No completed files found for archiving in ${archiveMonth}`);
            await connection.rollback();
            return;
        }

        // 2. Insert into monthly_archives
        await connection.query(
            `INSERT INTO monthly_archives (archive_month, file_data) VALUES (?, ?)`,
            [archiveMonth, JSON.stringify(files)]
        );

        // 3. Mark files as archived in active table (Business decision)
        await connection.query(
            `UPDATE files SET is_archived = 1, archived_at = NOW() WHERE status = 'Completed' AND DATE_FORMAT(updated_at, '%Y-%m') = ?`,
            [archiveMonth]
        );

        await connection.commit();
        logger.info(`Successfully archived and disabled ${files.length} files for ${archiveMonth}`);
    } catch (error) {
        await connection.rollback();
        logger.error(`Archiving failed: ${error.message}`);
    } finally {
        connection.release();
    }
};

module.exports = { archivePreviousMonth };
