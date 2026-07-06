import axios from 'axios';

function getRuntimeApiUrl() {
    // 1. Runtime-injected global (set by /config.json loader in main.jsx or server)
    if (typeof window !== 'undefined' && window.__API_URL__ && window.__API_URL__.trim() !== '') {
        return window.__API_URL__;
    }

    // 2. Build-time env, but avoid using localhost if built that way for prod
    const envUrl = import.meta.env && import.meta.env.VITE_API_URL ? import.meta.env.VITE_API_URL : '';
    if (envUrl && !envUrl.includes('localhost')) {
        return envUrl;
    }

    // 3. If running in a browser in a non-localhost origin, use same-origin /api
    if (typeof window !== 'undefined' && window.location && window.location.hostname && window.location.hostname !== 'localhost') {
        return `${window.location.origin}/api`;
    }

    // 4. Fallback to localhost for local development
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
