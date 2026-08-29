import axios from 'axios';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api';

const api = axios.create({
  baseURL: typeof window !== 'undefined' ? '/api' : API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor — attach token
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('academix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
}, error => Promise.reject(error));

// Response interceptor — handle 401 and feature disabled 403
api.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('academix_token');
        localStorage.removeItem('academix_user');
        window.location.href = '/login';
      }
    }
    if (error.response?.status === 403 && error.response?.data?.disabled) {
      error.isFeatureDisabled = true;
      error.disabledFeature = error.response.data.feature;
    }
    return Promise.reject(error);
  }
);

export default api;
