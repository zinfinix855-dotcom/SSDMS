import axios from 'axios';
import { toast } from 'react-hot-toast';

const API = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api/v1',
    withCredentials: true,
    xsrfCookieName: 'XSRF-TOKEN',
    xsrfHeaderName: 'X-XSRF-TOKEN',
});

let isRefreshing = false;
let failedQueue = [];

const processQueue = (error, token = null) => {
    failedQueue.forEach(prom => {
        if (error) {
            prom.reject(error);
        } else {
            prom.resolve(token);
        }
    });
    failedQueue = [];
};

// Attach the active hospital ID header for multi-hospital support
API.interceptors.request.use((config) => {
    const hospitalId = localStorage.getItem('ssdms_hospital_id');
    if (hospitalId) {
        config.headers['X-Hospital-Id'] = hospitalId;
    }
    return config;
});

// Handle data unwrapping and errors globally
API.interceptors.response.use(
    (response) => {
        // Automatically unwrap the 'data' property from standardized success responses
        if (response.data?.status === 'success' && response.data?.data !== undefined) {
            // Keep metadata like message if needed, but for SSDMS we mostly want the payload
            response.data = response.data.data;
        }
        return response;
    },
    async (error) => {
        const originalRequest = error.config;

        // If it's a 401 and NOT already a retry
        if (error.response?.status === 401 && !originalRequest._retry) {
            if (isRefreshing) {
                return new Promise(function (resolve, reject) {
                    failedQueue.push({ resolve, reject });
                }).then(() => {
                    return API(originalRequest);
                }).catch(err => {
                    return Promise.reject(err);
                });
            }

            originalRequest._retry = true;
            isRefreshing = true;

            try {
                // refreshToken is now in a cookie, so no body needed
                await axios.post(`${API.defaults.baseURL}/auth/refresh-token`, {}, { withCredentials: true });
                
                processQueue(null);
                return API(originalRequest);
            } catch (refreshError) {
                processQueue(refreshError, null);
                localStorage.removeItem('ssdms_user');
                // Only redirect if NOT already on the login page to prevent infinite reload loops
                if (window.location.pathname !== '/login') {
                    window.location.href = '/login';
                }
            } finally {
                isRefreshing = false;
            }
        }

        // Handle error display
        const message = error.response?.data?.message;
        const isLoginRequest = originalRequest.url.endsWith('/auth/login');
        const isMeRequest = originalRequest.url.endsWith('/auth/me');
        const isRefreshRequest = originalRequest.url.endsWith('/auth/refresh-token');

        // Suppress toasts for expected unauthenticated errors (session check on load)
        const isExpectedAuthError = (isMeRequest || isRefreshRequest) && 
            (error.response?.status === 401 || error.response?.status === 400);

        if (!isLoginRequest && !isExpectedAuthError && error.response?.status !== 401) {
            if (message) {
                toast.error(message);
            } else if (error.code === 'ERR_NETWORK') {
                toast.error('Network error: Is the backend running?');
            } else {
                toast.error('An unexpected error occurred');
            }
        }

        return Promise.reject(error);
    }
);

export default API;
