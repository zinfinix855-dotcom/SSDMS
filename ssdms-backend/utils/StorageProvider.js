const fs = require('fs').promises;
const path = require('path');
const logger = require('./logger');

/**
 * StorageProvider — Abstraction layer for file storage.
 * Supports Local FS storage, with hooks for S3/MinIO cloud migration.
 */
class StorageProvider {
    constructor() {
        this.basePath = path.join(__dirname, '../uploads');
        this.mode = process.env.STORAGE_MODE || 'local'; // 'local' or 's3'
    }

    /**
     * Store a file and return its public/retrievable path
     * @param {Buffer} buffer 
     * @param {string} filename 
     */
    async upload(buffer, filename) {
        if (this.mode === 'local') {
            const fullPath = path.join(this.basePath, filename);
            await fs.writeFile(fullPath, buffer);
            logger.debug(`[Storage] File stored locally: ${filename}`);
            return `/uploads/${filename}`;
        }

        if (this.mode === 's3') {
            // S3 logic would go here (e.g. AWS.S3.upload)
            throw new Error('S3 Storage Provider not yet configured');
        }

        throw new Error(`Unsupported storage mode: ${this.mode}`);
    }

    /**
     * Check if file exists
     * @param {string} filename 
     */
    async exists(filename) {
        try {
            await fs.access(path.join(this.basePath, filename));
            return true;
        } catch {
            return false;
        }
    }

    /**
     * Delete file
     * @param {string} filename 
     */
    async delete(filename) {
        const fullPath = path.join(this.basePath, filename);
        if (await this.exists(filename)) {
            await fs.unlink(fullPath);
            logger.info(`[Storage] File deleted: ${filename}`);
        }
    }
}

module.exports = new StorageProvider();
