import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

// Create axios instance with default config
const api = axios.create({
    baseURL: API_BASE_URL,
    withCredentials: true, // Send cookies with requests
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add response interceptor for error handling
api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Don't redirect to login if it's just checking auth status
        const isAuthCheck = error.config?.url?.includes('/auth/me');

        if (error.response?.status === 401 && !isAuthCheck) {
            // Redirect to login if unauthorized (but not on initial auth check)
            window.location.href = '/login';
        }
        return Promise.reject(error);
    }
);

export default api;
