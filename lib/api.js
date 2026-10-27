import axios from 'axios';

// In local dev, Next.js rewrites /api → localhost:5000 (see next.config.mjs).
// In production (Hostinger static export), there is no proxy — use the full
// backend URL baked in at build time via NEXT_PUBLIC_API_URL.
const PROD_API_URL = process.env.NEXT_PUBLIC_API_URL || '/api';
const SSR_API_URL  = process.env.NEXT_LOCALHOST_API_URL || PROD_API_URL;

const api = axios.create({
  baseURL: typeof window !== 'undefined' ? PROD_API_URL : SSR_API_URL,
  headers: { 'Content-Type': 'application/json' }
});


import { getHostType, getTenantSlug } from './host';

// Request interceptor — attach token and host context
api.interceptors.request.use(config => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('academix_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    const hostType = getHostType(window.location.hostname);
    if (hostType) {
      config.headers['X-Host-Type'] = hostType;
    }
    const tenantSlug = getTenantSlug(window.location.hostname);
    if (tenantSlug) {
      config.headers['X-Tenant-Slug'] = tenantSlug;
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

// ─── Named helpers ────────────────────────────────────────────────────────────
// Unwrap axios response so callers get the JSON body directly:
//   const res = await apiGet('/payment-proofs');  → res.success, res.data, etc.
// These are thin wrappers; errors still propagate as axios errors.

export const apiGet    = (url, config)       => api.get(url, config).then(r => r.data);
export const apiPost   = (url, body, config) => api.post(url, body, config).then(r => r.data);
export const apiPut    = (url, body, config) => api.put(url, body, config).then(r => r.data);
export const apiDelete = (url, config)       => api.delete(url, config).then(r => r.data);
export const apiPatch  = (url, body, config) => api.patch(url, body, config).then(r => r.data);

