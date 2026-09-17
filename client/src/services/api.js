// ============================================
// USMON SHASHLIK — API Service
// ============================================

import axios from 'axios';
import { getInitData } from '../utils/telegram';

const API_URL =
  import.meta.env.VITE_API_URL ||
  (typeof window !== 'undefined' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1'
    ? `${window.location.origin}/api`
    : 'http://localhost:5000/api');

const api = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' },
});

// Add Telegram initData to every request
api.interceptors.request.use((config) => {
  const initData = getInitData();
  if (initData) {
    config.headers['x-telegram-init-data'] = initData;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.error || error.message || 'Network error';
    return Promise.reject(new Error(message));
  }
);

// ─── Client API ─────────────────────────────

export const clientAPI = {
  getProfile: () => api.get('/client/profile'),
  updateProfile: (data) => api.put('/client/profile', data),
  getProducts: (params) => api.get('/client/products', { params }),
  getCategories: () => api.get('/client/categories'),
  getBranches: () => api.get('/client/branches'),
  getStories: () => api.get('/client/stories'),
  getSettings: () => api.get('/client/settings'),
  getUpsellProducts: () => api.get('/client/upsell'),
  toggleFavorite: (productId) => api.post('/client/favorites/toggle', { productId }),
  getFavorites: () => api.get('/client/favorites'),
};

export const orderAPI = {
  create: (data) => api.post('/orders', data),
  getMyOrders: (params) => api.get('/orders', { params }),
  getOrder: (id) => api.get(`/orders/${id}`),
};

export default api;
