import API from '../api/axios';

const FileService = {
    getAll: async (params) => {
        const response = await API.get('/files', { params });
        return response.data;
    },

    getDetail: async (visitNumber) => {
        const response = await API.get(`/files/${visitNumber}`);
        return response.data;
    },

    createAdmission: async (data) => {
        const response = await API.post('/files/admission', data);
        return response.data;
    },

    getStats: async () => {
        const response = await API.get('/dashboard/stats');
        return response.data;
    },

    getLeadTime: async () => {
        const response = await API.get('/dashboard/lead-time');
        return response.data;
    }
};

export default FileService;
