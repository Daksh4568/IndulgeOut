import axios from 'axios';

// API configuration for different environments
const API_BASE_URL = (
  import.meta.env.VITE_API_URL || 
  (import.meta.env.PROD ? 'https://indulge-out-git-main-daksh-pratap-singhs-projects-a6093574.vercel.app' : 'http://localhost:5000')
).replace(/\/$/, '');

// Create axios instance with base configuration
export const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Export URL string as named export
export const API_URL = API_BASE_URL;

// Export URL string as default for backward compatibility with existing code
export default API_BASE_URL;