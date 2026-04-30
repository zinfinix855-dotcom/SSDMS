const FileType = require('file-type');
const fs = require('fs');
const path = require('path');
const logger = require('../utils/logger');

const validateFileMagicBytes = async (req, res, next) => {
    if (!req.file) return next();

    try {
        const filePath = req.file.path;
        const buffer = fs.readFileSync(filePath, { encoding: null, flag: 'r' });
        const type = await FileType.fromBuffer(buffer);

        const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];

        if (!type || !allowedMimes.includes(type.mime)) {
            // Delete the malicious file
            fs.unlinkSync(filePath);
            logger.warn(`Security Breach: Malicious file upload attempted. MIME spoofing detected for ${req.file.originalname}`);
            return res.status(400).json({
                status: 'error',
                message: 'Invalid file content. Spoofed MIME types are not allowed.'
            });
        }

        // Additional check: Extension must match detected MIME
        const ext = path.extname(req.file.originalname).toLowerCase();
        const mimeToExt = {
            'image/jpeg': ['.jpg', '.jpeg'],
            'image/png': ['.png'],
            'application/pdf': ['.pdf']
        };

        if (!mimeToExt[type.mime].includes(ext)) {
            fs.unlinkSync(filePath);
            return res.status(400).json({
                status: 'error',
                message: 'File extension does not match file content.'
            });
        }

        next();
    } catch (err) {
        logger.error('File validation error:', err.message);
        if (req.file) fs.unlinkSync(req.file.path);
        next(err);
    }
};

module.exports = { validateFileMagicBytes };
