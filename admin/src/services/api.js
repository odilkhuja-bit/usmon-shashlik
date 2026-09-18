// ============================================
// USMON SHASHLIK — Admin API Service
// ============================================

import axios from 'axios';

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

// Attach JWT token from localStorage
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('usmon_admin_token');
  if (token) {
    config.headers['Authorization'] = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor: handle 401 unauthenticated
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    if (error.response?.status === 401 && !window.location.pathname.includes('/login')) {
      localStorage.removeItem('usmon_admin_token');
      localStorage.removeItem('usmon_admin_user');
      window.location.href = '/login';
    }
    const message = error.response?.data?.error || error.message || 'Xatolik yuz berdi';
    return Promise.reject(new Error(message));
  }
);

export const adminAPI = {
  // Auth
  login: (credentials) => api.post('/admin/login', credentials),
  getMe: () => api.get('/admin/me'),
  changePassword: (data) => api.put('/admin/change-password', data),

  // Dashboard
  getDashboard: () => api.get('/admin/dashboard'),

  // Orders
  getOrders: (params) => api.get('/admin/orders', { params }),
  getOrder: (id) => api.get(`/admin/orders/${id}`),
  updateOrderStatus: (id, status) => api.patch(`/admin/orders/${id}`, { status }),
  updateOrderItems: (id, data) => api.patch(`/admin/orders/${id}/items`, data),
  exportOrdersCsvUrl: () => `${API_URL}/admin/orders/export`,

  // Products
  getProducts: (params) => api.get('/admin/products', { params }),
  getProduct: (id) => api.get(`/admin/products/${id}`),
  createProduct: (data) => api.post('/admin/products', data),
  updateProduct: (id, data) => api.put(`/admin/products/${id}`, data),
  deleteProduct: (id) => api.delete(`/admin/products/${id}`),
  restoreProduct: (id) => api.patch(`/admin/products/${id}/restore`),
  permanentDeleteProduct: (id) => api.delete(`/admin/products/${id}/permanent`),

  // Categories
  getCategories: () => api.get('/admin/categories'),
  createCategory: (data) => api.post('/admin/categories', data),
  updateCategory: (id, data) => api.put(`/admin/categories/${id}`, data),
  deleteCategory: (id) => api.delete(`/admin/categories/${id}`),

  // Branches
  getBranches: () => api.get('/admin/branches'),
  getBranch: (id) => api.get(`/admin/branches/${id}`),
  createBranch: (data) => api.post('/admin/branches', data),
  updateBranch: (id, data) => api.put(`/admin/branches/${id}`, data),
  deleteBranch: (id) => api.delete(`/admin/branches/${id}`),

  // Users
  getUsers: (params) => api.get('/admin/users', { params }),
  getUser: (id) => api.get(`/admin/users/${id}`),
  toggleUserBlock: (id) => api.patch(`/admin/users/${id}/block`),
  exportUsersCsvUrl: () => `${API_URL}/admin/users/export`,

  // Broadcast
  getBroadcastHistory: (params) => api.get('/admin/broadcast', { params }),
  getTargetCount: (params) => api.get('/admin/broadcast/target-count', { params }),
  createBroadcast: (data) => api.post('/admin/broadcast', data),

  // Analytics
  getAnalytics: (params) => api.get('/admin/analytics', { params }),
  getRevenueChart: (params) => api.get('/admin/analytics/revenue', { params }),
  getPopularProducts: (params) => api.get('/admin/analytics/popular', { params }),
  getBranchStats: (params) => api.get('/admin/analytics/branches', { params }),

  // Admins
  getAdmins: () => api.get('/admin/admins'),
  createAdmin: (data) => api.post('/admin/admins', data),
  updateAdmin: (id, data) => api.put(`/admin/admins/${id}`, data),
  deleteAdmin: (id) => api.delete(`/admin/admins/${id}`),

  // Settings
  getSettings: () => api.get('/admin/settings'),
  updateSettings: (data) => api.put('/admin/settings', data),
};

export default api;
