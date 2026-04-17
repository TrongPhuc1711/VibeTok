import axios from "axios";
import { TOKEN_KEY, USER_KEY } from "../utils/constants";
// Lấy API URL từ env hoặc dùng relative path nếu không có
const apiUrl = import.meta.env.VITE_API_URL || '';
const baseURL = apiUrl ? `${apiUrl}/api` : '/api';

const api = axios.create({
  baseURL: baseURL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000,
});
api.interceptors.request.use(
  (config) => {
      // 1. Lấy token từ localStorage
      const token = localStorage.getItem(TOKEN_KEY);
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
      return response;
  },
  (error) => {
      if (error.response && error.response.status === 401) {
          // Token hết hạn hoặc không hợp lệ → chỉ xóa token cũ
          // KHÔNG redirect tự động — để component/route guard xử lý
          // Tránh phá vỡ luồng public pages (feed, explore, profile)
          const hadToken = !!localStorage.getItem(TOKEN_KEY);
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
          
          // Chỉ redirect nếu user ĐANG đăng nhập (có token) và đang ở trang protected
          if (hadToken) {
              const publicPaths = ['/', '/explore', '/login', '/register', '/forgot-password'];
              const isPublicPage = publicPaths.some(p => window.location.pathname === p)
                  || window.location.pathname.startsWith('/profile/')
                  || window.location.pathname.startsWith('/video/');
              if (!isPublicPage) {
                  window.location.href = '/login';
              }
          }
      }
      return Promise.reject(error);
  }
);
export default api;