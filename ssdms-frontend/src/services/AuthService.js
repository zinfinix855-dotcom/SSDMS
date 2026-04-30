import API from '../api/axios';

const AuthService = {
    login: async (authId, password) => {
        const response = await API.post('/auth/login', { authId, password });
        return response.data;
    },

    refreshToken: async () => {
        const response = await API.post('/auth/refresh-token');
        return response.data;
    },

    getMe: async () => {
        const response = await API.get('/auth/me');
        return response.data;
    },

    logout: async () => {
        try {
            await API.post('/auth/logout');
        } catch (e) {
            console.error('Logout request failed', e);
        }
        localStorage.removeItem('ssdms_user');
        window.location.href = '/login';
    },

    // Phase 6: 2FA Methods
    verify2FA: async (employeeId, otp) => {
        const response = await API.post('/auth/verify-2fa', { employeeId, token: otp });
        return response.data;
    },

    setup2FA: async () => {
        const response = await API.post('/auth/setup-2fa');
        return response.data;
    },

    confirm2FA: async (otp) => {
        const response = await API.post('/auth/confirm-2fa', { token: otp });
        return response.data;
    }
};

export default AuthService;
