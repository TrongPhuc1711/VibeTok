import axios from "axios";

// Lấy API URL từ env hoặc dùng relative path nếu không có
const apiUrl = import.meta.env.API_URL || '';
const baseURL = apiUrl ? `${apiUrl}/api` : '/api';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
});
api.interceptors.request.use(
  (config) => {
      // 1. Lấy token từ localStorage
      const token = localStorage.getItem('token');
      // 2. Nếu có token, tự động đính vào Header
      if (token) {
          config.headers.Authorization = `Bearer ${token}`;
      }
      
      return config;
  },
  (error) => {
      return Promise.reject(error);
  }
);
api.interceptors.response.use(
  (response) => {
      // Nếu API trả về thành công, cứ trả về data bình thường
      return response;
  },
  (error) => {
      // Nếu API trả về lỗi 401 (Unauthorized) hoặc 403 (Forbidden)
      if (error.response && (error.response.status === 401 || error.response.status === 403)) {
          // Xóa token cũ đi
          localStorage.removeItem('token');
          
          // Đá người dùng về trang đăng nhập
          window.location.href = '/login';
      }
      return Promise.reject(error);
  }
);
export default api;