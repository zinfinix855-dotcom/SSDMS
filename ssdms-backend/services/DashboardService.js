const DashboardRepository = require('../repositories/DashboardRepository');
const analyticsService = require('./AnalyticsService');
const { generalCache } = require('../utils/Cache');

class DashboardService {
    async getGlobalDashboardData() {
        const cacheKey = 'global_dashboard_data';
        const cachedData = await generalCache.get(cacheKey);
        if (cachedData) return cachedData;

        const stats = await this.getGlobalStats();
        const bottlenecks = await analyticsService.getStageBottlenecks();
        const deptLoad = await analyticsService.getDepartmentLoad();

        const data = {
            stats,
            analytics: {
                bottlenecks,
                deptLoad
            }
        };

        await generalCache.set(cacheKey, data, 300); // 5 min cache
        return data;
    }

    async getGlobalStats() {
        const stats = await DashboardRepository.getGlobalStats();
        const stageFiles = await DashboardRepository.getFilesByStage();

        return {
            total: Number(stats.totalFiles),
            totalFiles: Number(stats.totalFiles),
            inProgress: Number(stats.inProgress),
            objected: Number(stats.objected),
            completed: Number(stats.completed),
            byStage: stageFiles,
            staleFiles: Number(stats.staleCount)
        };
    }

    async getEmployeePerformance() {
        return await DashboardRepository.getEmployeePerformance();
    }

    async getAuditLogs(page = 1, limit = 50) {
        const offset = (page - 1) * limit;
        return await DashboardRepository.getAuditLogs(limit, offset);
    }

    async getLeadTimeAnalytics() {
        const cacheKey = 'lead_time_analytics';
        const cachedData = await generalCache.get(cacheKey);
        if (cachedData) return cachedData;

        const leadTime = await DashboardRepository.getLeadTimeAnalytics();
        await generalCache.set(cacheKey, leadTime, 300);
        return leadTime;
    }
}

module.exports = new DashboardService();
