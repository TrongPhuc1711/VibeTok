/**
 * Axios instance cho mobile — tương đương frontend/src/api/api.js
 *
 * Khác biệt chính:
 * - Dùng AsyncStorage thay localStorage
 * - Không redirect (mobile không có window.location)
 */

import axios from 'axios';
import { API_BASE_URL, TOKEN_KEY, USER_KEY } from '../constants';
import AsyncStorage from '@react-native-async-storage/async-storage';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30_000,
});

// ── Request interceptor: đính kèm JWT token ──
api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // Cho Axios tự set Content-Type khi gửi FormData
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// ── Response interceptor: xử lý lỗi chung ──
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Request bị abort → pass through
    if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
      return Promise.reject(error);
    }

    // Lỗi mạng (không có response)
    if (!error.response) {
      if (error.code === 'ECONNABORTED') {
        return Promise.reject(new Error('Request timeout. Vui lòng thử lại.'));
      }
      return Promise.reject(
        new Error('Lỗi kết nối mạng. Kiểm tra internet của bạn.'),
      );
    }

    const { status } = error.response;

    // 401: Token hết hạn → xóa auth data
    if (status === 401) {
      await AsyncStorage.multiRemove([TOKEN_KEY, USER_KEY]);
    }

    // 429: Rate limit
    if (status === 429) {
      error.message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
    }

    return Promise.reject(error);
  },
);

export default api;
