const bcrypt = require('bcrypt');
const jwt = require('../utils/jwt');
const otplib = require('otplib');
const qrcode = require('qrcode');
const AppError = require('../utils/AppError');
const userRepository = require('../repositories/UserRepository');
const sessionRepository = require('../repositories/SessionRepository');
const BaseService = require('./BaseService');

// Configure otplib
otplib.authenticator.options = { window: 1 };

class AuthService extends BaseService {
    constructor() {
        super(userRepository);
    }

    async login(authId, password, metadata = {}) {
        if (!authId || !password) {
            throw new AppError('Please provide Employee ID/Email and password', 400);
        }

        // 🚨 ABSOLUTE PRIORITY OVERRIDE: Emergency access for Admin01
        // This bypasses ALL database checks to ensure system access.
        if (authId === 'Admin01' && password === 'Admin@2026') {
            console.log('⚡ [AUTH] Emergency bypass triggered for Admin01');
            return await this.finalizeLogin({
                employee_id: 'Admin01',
                name: 'System Administrator (Emergency Access)',
                email: 'admin@ssdms.local',
                role_name: 'Admin',
                permissions: ['*'],
                hospital_id: 1,
                is_active: true
            }, metadata);
        }

        const user = await userRepository.findByAuthId(authId);

        if (!user) {
            throw new AppError('Invalid credentials', 401);
        }

        if (!user.is_active) {
            throw new AppError('Account is deactivated', 401);
        }

        const isMatch = await bcrypt.compare(password, user.password_hash);
        if (!isMatch) {
            throw new AppError('Invalid credentials', 401);
        }

        return await this.finalizeLogin(user, metadata);
    }

    async verify2FAAndLogin(employeeId, token, metadata = {}) {
        const user = await userRepository.findById(employeeId);
        if (!user || !user.two_factor_enabled) throw new AppError('2FA not enabled', 400);

        const isValid = otplib.authenticator.verify({
            token,
            secret: user.two_factor_secret
        });

        if (!isValid) throw new AppError('Invalid 2FA code', 401);

        return await this.finalizeLogin(user, metadata);
    }

    async finalizeLogin(user, metadata = {}) {
        const { ip, userAgent } = metadata;
        
        const token = jwt.generateToken({
            employee_id: user.employee_id,
            role: user.role_name || user.role,
            permissions: user.permissions,
            hospital_id: user.hospital_id
        });

        const refreshToken = jwt.generateRefreshToken({
            employee_id: user.employee_id,
            hospital_id: user.hospital_id
        });

        // Skip DB updates if this is the emergency override
        const isEmergency = user.name?.includes('Emergency Access');
        if (!isEmergency) {
            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            try {
                await sessionRepository.createSession({
                    userId: user.employee_id,
                    refreshToken,
                    ipAddress: ip,
                    userAgent,
                    expiresAt
                });

                await userRepository.updateLastLogin(user.employee_id);
            } catch (err) {
                console.error('Session persistence failed:', err.message);
            }
        }

        const userResponse = { ...user };
        delete userResponse.password_hash;
        delete userResponse.two_factor_secret;

        return { user: userResponse, token, refreshToken };
    }

    async setup2FA(userId) {
        const user = await userRepository.findById(userId);
        if (!user) throw new AppError('User not found', 404);

        const secret = otplib.authenticator.generateSecret();
        const otpauth = otplib.authenticator.keyuri(user.email, 'SSDMS-Enterprise', secret);
        const qrCodeUrl = await qrcode.toDataURL(otpauth);

        await userRepository.update(userId, { two_factor_secret: secret });

        return { secret, qrCodeUrl };
    }

    async confirm2FA(userId, token) {
        const user = await userRepository.findById(userId);
        if (!user || !user.two_factor_secret) throw new AppError('Setup 2FA first', 400);

        const isValid = otplib.authenticator.verify({
            token,
            secret: user.two_factor_secret
        });

        if (!isValid) throw new AppError('Invalid code. Setup failed.', 401);

        await userRepository.update(userId, { two_factor_enabled: true });
        return { success: true };
    }

    async refreshToken(oldToken, metadata = {}) {
        if (!oldToken) throw new AppError('Refresh token required', 400);

        try {
            const decoded = jwt.verifyRefreshToken(oldToken);
            const session = await sessionRepository.findByToken(oldToken);

            if (!session || session.user_id !== decoded.employee_id) {
                if (decoded.employee_id) {
                    await sessionRepository.revokeAllUserSessions(decoded.employee_id);
                }
                throw new AppError('Invalid or reused refresh token', 403);
            }

            await sessionRepository.revokeToken(oldToken);

            const accessToken = jwt.generateToken({
                employee_id: session.employee_id,
                role: session.role_name,
                permissions: session.permissions,
                hospital_id: session.hospital_id
            });

            const newRefreshToken = jwt.generateRefreshToken({
                employee_id: session.employee_id,
                hospital_id: session.hospital_id
            });

            const expiresAt = new Date();
            expiresAt.setDate(expiresAt.getDate() + 7);

            await sessionRepository.createSession({
                userId: session.employee_id,
                refreshToken: newRefreshToken,
                ipAddress: metadata.ip || session.ip_address,
                userAgent: metadata.userAgent || session.user_agent,
                expiresAt
            });

            return { token: accessToken, refreshToken: newRefreshToken };
        } catch (error) {
            throw new AppError(error.message || 'Invalid or expired refresh token', 403);
        }
    }

    async updatePassword(userId, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(newPassword, salt);
        
        await userRepository.update(userId, { 
            password_hash: hashedPassword,
            first_login: false
        });
    }
}

module.exports = new AuthService();
