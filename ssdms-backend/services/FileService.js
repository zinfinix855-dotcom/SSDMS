const fileRepository = require('../repositories/FileRepository');
const auditRepository = require('../repositories/AuditRepository');
const BaseService = require('./BaseService');
const AppError = require('../utils/AppError');
const logger = require('../utils/logger');
const EventBus = require('./EventBus');

class FileService extends BaseService {
    constructor() {
        super(fileRepository);
    }

    async generateVisitNumber() {
        const lastNumber = await fileRepository.getLatestVisitNumber();
        if (!lastNumber) return 'SS-0000001';

        const numberPart = parseInt(lastNumber.split('-')[1], 10);
        const nextNumber = numberPart + 1;
        return `SS-${String(nextNumber).padStart(7, '0')}`;
    }

    async createAdmission(data, userId) {
        const { ssc_visit_number } = data;

        if (ssc_visit_number) {
            const existing = await fileRepository.findByVisitOrSsc(ssc_visit_number);
            if (existing) {
                throw new AppError(`SSC Visit Number '${ssc_visit_number}' is already in use.`, 409);
            }
        }

        const visit_number = await this.generateVisitNumber();

        logger.info(`Creating new admission: ${visit_number} (SSC: ${ssc_visit_number || 'N/A'})`);

        return await this.repository.transaction(async (connection) => {
            // 1. Create file record
            await fileRepository.createAdmissionRecord(visit_number, data, userId, connection);

            EventBus.emit('FILE_ADMITTED', {
                visitNumber: visit_number,
                sscVisitNumber: ssc_visit_number || null,
                userId,
                timestamp: new Date()
            });

            // 2. Add movement record
            await fileRepository.logMovement(
                visit_number,
                'Admission',
                'Discharge',
                userId,
                'Patient admitted and moved to Discharge',
                'Forwarded',
                connection
            );

            return { visit_number, ssc_visit_number: ssc_visit_number || null };
        });
    }

    async getFileDetail(visitNumber, user = null, ip = null) {
        const detail = await fileRepository.getFullDetail(visitNumber);
        if (!detail) throw new AppError('File not found', 404);

        if (user && ip) {
            // Log access for audit (Compliance Requirement)
            await auditRepository.logAction({
                employeeId: user.employee_id,
                action: 'File View',
                targetResource: visitNumber,
                ipAddress: ip,
                metadata: { ssc_visit_number: detail.file.ssc_visit_number }
            });
        }

        return detail;
    }

    async getParsedSectionEntries(visitNumber) {
        const detail = await this.getFileDetail(visitNumber);
        return detail.sections.map(sec => ({
            ...sec,
            data: typeof sec.data === 'string' ? JSON.parse(sec.data) : sec.data
        }));
    }

    async searchFiles(params, user = null, ip = null) {
        const { 
            query, stage, status, visit_number, ssc_visit_number, 
            date_from, date_to, min_priority,
            page = 1, limit = 20 
        } = params;
        const offset = (parseInt(page) - 1) * parseInt(limit);

        const stages = stage ? (Array.isArray(stage) ? stage : [stage]) : null;
        let statuses = null;

        if (status) {
            const statusMap = {
                in_progress: 'In Progress', completed: 'Completed',
                objected: 'Objected', returned: 'Returned'
            };
            statuses = status.split(',').map(s => statusMap[s.trim()] || s.trim());
        }

        const result = await fileRepository.search({ 
            query, stages, statuses, visit_number, ssc_visit_number,
            date_from, date_to, min_priority
        }, parseInt(limit), offset);

        if (user && ip) {
            // Log search action for audit
            await auditRepository.logAction({
                employeeId: user.employee_id,
                action: 'File Search',
                targetResource: 'Search Engine',
                ipAddress: ip,
                metadata: { filters: params, results_count: result.total }
            });
        }

        logger.debug(`File search performed: ${JSON.stringify({ query, stages, statuses })} - Results: ${result.total}`);

        return {
            results: result.files.length,
            total: result.total,
            page: parseInt(page),
            limit: parseInt(limit),
            totalPages: Math.ceil(result.total / parseInt(limit)),
            files: result.files
        };
    }
}

module.exports = new FileService();
