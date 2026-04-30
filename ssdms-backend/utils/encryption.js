const crypto = require('crypto');

const ALGORITHM = 'aes-256-gcm';

const ENCRYPTION_KEY = crypto.scryptSync(process.env.ENCRYPTION_KEY || 'ssdms-pii-encryption-fallback-key-32chars', 'salt', 32);
const BINDEX_SALT = crypto.scryptSync(process.env.BINDEX_SALT || 'ssdms-blind-index-fallback-salt', 'bindex-salt', 32);

/**
 * Encrypts sensitive data using AES-256-GCM
 */
const encrypt = (text) => {
    if (!text) return null;
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag().toString('hex');
    
    // Format: iv:authTag:encrypted
    return `${iv.toString('hex')}:${authTag}:${encrypted}`;
};

/**
 * Decrypts data encrypted with AES-256-GCM
 */
const decrypt = (encryptedText) => {
    if (!encryptedText || encryptedText === 'DECRYPTION_ERROR') return encryptedText;
    try {
        const [ivHex, authTagHex, encrypted] = encryptedText.split(':');
        
        const iv = Buffer.from(ivHex, 'hex');
        const authTag = Buffer.from(authTagHex, 'hex');
        const decipher = crypto.createDecipheriv(ALGORITHM, ENCRYPTION_KEY, iv);
        
        decipher.setAuthTag(authTag);
        
        let decrypted = decipher.update(encrypted, 'hex', 'utf8');
        decrypted += decipher.final('utf8');
        
        return decrypted;
    } catch (err) {
        return 'DECRYPTION_ERROR';
    }
};

/**
 * Generates a blind index (HMAC) for deterministic search on encrypted fields
 * Uses a separate key (BINDEX_SALT) derived specifically for indexing.
 */
const blindIndex = (text) => {
    if (!text) return null;
    return crypto.createHmac('sha256', BINDEX_SALT).update(text.toLowerCase().trim()).digest('hex');
};

module.exports = { encrypt, decrypt, blindIndex };
