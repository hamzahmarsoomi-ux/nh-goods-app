import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_URL = process.env.EXPO_PUBLIC_BACKEND_URL || '';

const api = axios.create({
  baseURL: `${API_URL}/api`,
  timeout: 30000,
});

// Add auth token to requests
api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      await AsyncStorage.removeItem('auth_token');
      await AsyncStorage.removeItem('user');
    }
    return Promise.reject(error);
  }
);

export default api;

// API Functions
export const seedDatabase = () => api.post('/seed');

export const getProducts = (category?: string) => 
  api.get('/products', { params: { category } });

export const getProduct = (id: string) => api.get(`/products/${id}`);

export const getCategories = () => api.get('/categories');

export const createOrder = (data: { items: any[], notes?: string }) =>
  api.post('/orders', data);

export const getOrders = () => api.get('/orders');

export const getOrder = (id: string) => api.get(`/orders/${id}`);

export const getInvoices = () => api.get('/invoices');

export const submitVoiceOrder = (audioBase64: string) =>
  api.post('/voice-orders', { audio_base64: audioBase64 });

export const updateLocation = (latitude: number, longitude: number) =>
  api.post('/location/update', { latitude, longitude });

// Admin APIs
export const getUsers = () => api.get('/admin/users');

export const createUser = (data: any) => api.post('/admin/users', data);

export const deleteUser = (id: string) => api.delete(`/admin/users/${id}`);

export const toggleUserStatus = (id: string) =>
  api.put(`/admin/users/${id}/toggle-status`);

export const createProduct = (data: any) => api.post('/admin/products', data);

export const updateProduct = (id: string, data: any) =>
  api.put(`/admin/products/${id}`, data);

export const deleteProduct = (id: string) => api.delete(`/admin/products/${id}`);

export const getActivityLogs = (limit = 100) =>
  api.get('/admin/activity', { params: { limit } });

export const getVoiceOrders = () => api.get('/admin/voice-orders');

export const updateOrderStatus = (id: string, status: string) =>
  api.put(`/admin/orders/${id}/status`, null, { params: { status } });

export const getCustomerPresence = () => api.get('/admin/customer-presence');

export const getFlashDeals = () => api.get('/flash-deals');

export const getLastOrder = () => api.get('/last-order');

export const reorder = (orderId: string) => api.post(`/reorder/${orderId}`);
