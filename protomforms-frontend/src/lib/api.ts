import axios from 'axios';
import { getApiUrl } from './utils';

// Create axios instance with base configuration
const api = axios.create({
  baseURL: getApiUrl(),
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // Important for NextAuth cookies
});

// Request interceptor to add auth token if available
api.interceptors.request.use(
  (config) => {
    // Add x-user-id header if user is logged in (for custom auth flow)
    // Try to get from localStorage first (set by AuthContext)
    const userId = localStorage.getItem('user_id');
    if (userId && !config.headers['x-user-id']) {
      config.headers['x-user-id'] = userId;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      console.error('Unauthorized access - redirecting to login');
      // You can redirect to login page here
    }
    return Promise.reject(error);
  }
);

export default api;

// API endpoints
// NOTA: getApiUrl() già ritorna /api, quindi gli endpoint NON devono iniziare con /api/
export const endpoints = {
  // Auth
  auth: {
    login: '/auth/login',
    signin: '/auth/signin',
    signout: '/auth/signout',
    session: '/auth/session',
  },
  // Forms
  forms: {
    list: '/forms',
    create: '/forms',
    get: (id: string) => `/forms/${id}`,
    update: (id: string) => `/forms/${id}`,
    delete: (id: string) => `/forms/${id}`,
    public: '/forms/public',
    bySlug: (slug: string) => `/forms/by-slug/${slug}`,
  },
  // Users
  users: {
    list: '/users',
    get: (id: string) => `/users/${id}`,
    stats: '/users/stats',
  },
  // Responses
  responses: {
    create: '/responses',
    list: '/responses',
    get: (slug: string, progressive: string) => `/responses/${slug}/${progressive}`,
  },
  // Dashboard
  dashboard: {
    stats: '/dashboard/stats',
    analytics: '/analytics',
  },
  // Health
  health: {
    database: '/health/database',
  },
};


