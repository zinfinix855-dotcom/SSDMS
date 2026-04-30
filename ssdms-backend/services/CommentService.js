const CommentRepository = require('../repositories/CommentRepository');
const BaseService = require('./BaseService');
const AppError = require('../utils/AppError');

class CommentService extends BaseService {
    constructor() {
        super(CommentRepository);
    }

    async getFileComments(visitNumber) {
        return await CommentRepository.findByVisitNumber(visitNumber);
    }

    async addComment(visitNumber, employeeId, comment) {
        if (!comment) throw new AppError('Comment content is required', 400);

        const result = await CommentRepository.create({
            visit_number: visitNumber,
            employee_id: employeeId,
            comment
        });

        return await CommentRepository.findByIdWithUser(result.id);
    }
}

module.exports = new CommentService();
