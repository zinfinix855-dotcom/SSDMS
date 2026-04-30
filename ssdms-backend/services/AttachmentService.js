const AttachmentRepository = require('../repositories/AttachmentRepository');
const BaseService = require('./BaseService');
const AppError = require('../utils/AppError');

class AttachmentService extends BaseService {
    constructor() {
        super(AttachmentRepository);
    }

    async getFileAttachments(visitNumber) {
        return await AttachmentRepository.findByVisitNumber(visitNumber);
    }

    async saveAttachment(visitNumber, employeeId, fileData) {
        if (!fileData) throw new AppError('No file data provided', 400);

        const { originalname, filename, mimetype, size } = fileData;

        return await AttachmentRepository.create({
            visit_number: visitNumber,
            employee_id: employeeId,
            file_name: originalname,
            file_path: filename,
            file_type: mimetype,
            file_size: size
        });
    }
}

module.exports = new AttachmentService();
