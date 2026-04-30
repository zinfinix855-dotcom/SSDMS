const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');

// Ensure uploads directory exists
const uploadDir = path.join(__dirname, '../uploads/attachments');
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const fileType = require('file-type');

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Enforce UUID renaming to prevent filename collisions and directory traversal
        const uniqueName = uuidv4() + path.extname(file.originalname).toLowerCase();
        cb(null, uniqueName);
    }
});

const fileFilter = (req, file, cb) => {
    // Stage 1: MIME Type Allowlisting (Shallow)
    const allowedMimes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedMimes.includes(file.mimetype)) {
        return cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPG, PNG and PDF allowed.'), false);
    }
};

/**
 * Stage 2: Deep Magic Byte Validation
 * Runs after multer has saved the file to disk to verify actual file integrity.
 */
const validateFileMagic = async (req, res, next) => {
    if (!req.file) return next();

    try {
        const type = await fileType.fromFile(req.file.path);
        const allowedExtensions = ['jpg', 'png', 'pdf'];

        if (!type || !allowedExtensions.includes(type.ext)) {
            // Delete the malicious/invalid file
            fs.unlinkSync(req.file.path);
            return res.status(400).json({
                status: 'error',
                message: 'Security Alert: File signature mismatch. Upload rejected.'
            });
        }
        next();
    } catch (error) {
        if (fs.existsSync(req.file.path)) fs.unlinkSync(req.file.path);
        next(error);
    }
};

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
    fileFilter: fileFilter
});

module.exports = { upload, validateFileMagic };
