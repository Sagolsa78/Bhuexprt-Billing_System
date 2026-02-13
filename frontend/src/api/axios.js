import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Request interceptor to add token to headers
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// Response interceptor to handle errors (e.g., 401 Unauthorized)
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const originalRequest = error.config;

        // If 401 and we haven't tried to refresh token (optional future enhancement)
        // For now, we just reject, and components/context can handle redirection
        if (error.response?.status === 401 && !originalRequest._retry) {
            // Handle unauthorized access (e.g., clear token, redirect to login)
            // Note: Direct navigation here might be tricky if not in a component
            // We can emit an event or just let the caller handle it
            localStorage.removeItem('token');
            localStorage.removeItem('userInfo');
            // Window reload or redirection could be done here if strictly needed
            // window.location.href = '/login'; 
        }
        return Promise.reject(error);
    }
);

export default api;
