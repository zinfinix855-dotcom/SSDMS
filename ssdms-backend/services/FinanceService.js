const FinanceRepository = require('../repositories/FinanceRepository');
const BaseService = require('./BaseService');

class FinanceService extends BaseService {
    constructor() {
        super(FinanceRepository);
    }

    async getFileSplits(visitNumber) {
        return await FinanceRepository.findByVisitNumber(visitNumber);
    }

    async approveFileSplits(visitNumber, employeeId) {
        const now = new Date();
        const affectedRows = await FinanceRepository.approveAllPending(visitNumber, employeeId, now);

        if (affectedRows === 0) {
            // This might not be an error, just no pending splits to approve
            return { message: 'No pending splits found for approval' };
        }

        return { message: `${affectedRows} split(s) approved and marked as Paid` };
    }
}

module.exports = new FinanceService();
