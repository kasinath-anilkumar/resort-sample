import axios from 'axios';

function getRuntimeApiUrl() {
    if (typeof window !== 'undefined' && window.__API_URL__) return window.__API_URL__;
    if (import.meta.env && import.meta.env.VITE_API_URL) return import.meta.env.VITE_API_URL;
    return 'http://localhost:5000/api';
}

const API = axios.create({
    baseURL: getRuntimeApiUrl()
});

// Add request interceptor to include auth token
API.interceptors.request.use(
    (config) => {
        const userInfo = JSON.parse(localStorage.getItem('userInfo'));
        if (userInfo?.token) {
            config.headers.Authorization = `Bearer ${userInfo.token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export default API;
