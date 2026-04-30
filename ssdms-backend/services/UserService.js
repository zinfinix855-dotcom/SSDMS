const bcrypt = require('bcrypt');
const userRepository = require('../repositories/UserRepository');
const BaseService = require('./BaseService');
const AppError = require('../utils/AppError');

class UserService extends BaseService {
    constructor() {
        super(userRepository);
    }

    async getAllUsers() {
        return await userRepository.findAll();
    }

    async getPaginatedUsers(page = 1, limit = 20) {
        const offset = (page - 1) * limit;
        return await userRepository.getPaginated(limit, offset);
    }

    async createUser(userData) {
        const { password, assigned_sections } = userData;

        // Hashing password in service layer
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(password, salt);

        const userToCreate = {
            ...userData,
            password_hash,
            assigned_sections: JSON.stringify(assigned_sections)
        };
        delete userToCreate.password;

        try {
            return await userRepository.create(userToCreate);
        } catch (error) {
            if (error.code === 'ER_DUP_ENTRY') {
                throw new AppError('Employee ID or Email already exists', 400);
            }
            throw error;
        }
    }

    async resetUserPassword(employeeId, newPassword) {
        const salt = await bcrypt.genSalt(10);
        const password_hash = await bcrypt.hash(newPassword, salt);

        const result = await userRepository.update(employeeId, { password_hash }, 'employee_id');
        if (!result) throw new AppError('User not found', 404);
        return result;
    }

    async updateUserDetails(employeeId, details) {
        if (details.assigned_sections !== undefined) {
            details.assigned_sections = JSON.stringify(details.assigned_sections);
        }

        const result = await userRepository.update(employeeId, details, 'employee_id');
        if (!result) throw new AppError('User not found', 404);
        return result;
    }
}

module.exports = new UserService();
