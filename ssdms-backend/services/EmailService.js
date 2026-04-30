const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

/**
 * EmailService — Enterprise Notification Hub.
 */
class EmailService {
    constructor() {
        this.transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST || 'smtp.mailtrap.io', // Default for dev
            port: process.env.SMTP_PORT || 2525,
            auth: {
                user: process.env.SMTP_USER || null,
                pass: process.env.SMTP_PASS || null,
            },
        });
    }

    /**
     * Deliver Weekly Executive Summary
     */
    async sendWeeklyReport(pdfPath, filename) {
        try {
            const mailOptions = {
                from: '"SSDMS Enterprise" <noreply@ssdms.gov.pk>',
                to: process.env.ADMIN_EMAIL || 'admin@hospital.gov.pk',
                subject: `📊 Weekly Executive Summary — ${new Date().toLocaleDateString()}`,
                text: 'Please find attached the weekly operational performance report for the SSDMS system.',
                attachments: [
                    {
                        filename: filename,
                        path: pdfPath,
                        contentType: 'application/pdf'
                    }
                ]
            };

            const info = await this.transporter.sendMail(mailOptions);
            logger.info(`📧 Report Email Sent: ${info.messageId}`);
            return true;
        } catch (err) {
            logger.error('❌ EmailService: Failed to deliver weekly report:', err.message);
            return false;
        }
    }

    /**
     * Send Security Alert (Integrity Violation)
     */
    async sendSecurityAlert(details) {
        try {
            const mailOptions = {
                from: '"SSDMS Security" <security@ssdms.gov.pk>',
                to: process.env.SECURITY_EMAIL || 'security-officer@hospital.gov.pk',
                subject: '🚨 CRITICAL: System Integrity Violation Detected',
                html: `
                    <h3>Security Alert: Tamper Detected</h3>
                    <p>The daily cryptographic audit has identified potential database tampering.</p>
                    <p><b>Violations Count:</b> ${details.count}</p>
                    <p><b>Target IDs:</b> ${details.details.join(', ')}</p>
                    <hr/>
                    <p>This is an automated enterprise security alert. Please investigate immediately.</p>
                `
            };

            await this.transporter.sendMail(mailOptions);
            logger.warn('📧 Security Alert Email Dispatched.');
        } catch (err) {
            logger.error('❌ EmailService: Failed to dispatch security alert:', err.message);
        }
    }
}

module.exports = new EmailService();
