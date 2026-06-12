const VersionRepository = require('../repositories/VersionRepository');

class VersionService {
    async createVersionSnapshot(visitNumber, stageName, data, changedBy, changeType = 'update', connection = null) {
        return await VersionRepository.createVersion(visitNumber, stageName, data, changedBy, changeType, connection);
    }

    async getHistory(visitNumber) {
        return await VersionRepository.getVersions(visitNumber);
    }
}

module.exports = new VersionService();
