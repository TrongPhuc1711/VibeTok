import axios from "axios";
import { TOKEN_KEY, USER_KEY } from "../utils/constants";

const apiUrl = import.meta.env.VITE_API_URL || '';
const baseURL = apiUrl ? `${apiUrl}/api` : '/api';

const api = axios.create({
    baseURL,
    headers: { 'Content-Type': 'application/json' },
    timeout: 30000,
});

// ── Request interceptor: attach token ──
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem(TOKEN_KEY);
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        // Cho trình duyệt tự tạo boundary nếu gửi FormData
        if (config.data instanceof FormData) {
            delete config.headers['Content-Type'];
        }
        return config;
    },
    (error) => Promise.reject(error)
);

// ── Response interceptor: handle auth errors ──
let isRedirecting = false; // prevent redirect loop

api.interceptors.response.use(
    (response) => response,
    (error) => {
        // Request bị abort (F5, navigate away) → không xóa auth, pass through
        if (axios.isCancel(error) || error.code === 'ERR_CANCELED') {
            return Promise.reject(error);
        }

        // Network error (no response)
        if (!error.response) {
            if (error.code === 'ECONNABORTED') {
                return Promise.reject(new Error('Request timeout. Vui lòng thử lại.'));
            }
            return Promise.reject(new Error('Lỗi kết nối mạng. Kiểm tra internet của bạn.'));
        }

        const { status, config } = error.response;

        // 401: Token expired or invalid
        if (status === 401) {
            const hadToken = !!localStorage.getItem(TOKEN_KEY);
            localStorage.removeItem(TOKEN_KEY);
            localStorage.removeItem(USER_KEY);

            if (hadToken && !isRedirecting) {
                // Only redirect if user was authenticated AND on a protected page
                const publicPaths = [
                    '/', '/explore', '/login', '/register',
                    '/forgot-password', '/reset-password'
                ];
                const currentPath = window.location.pathname;

                const isPublicPage =
                    publicPaths.includes(currentPath) ||
                    currentPath.startsWith('/profile/') ||
                    currentPath.startsWith('/video/');

                // Don't redirect if this was a background refresh (getMe, etc.)
                const isBackgroundRequest = config?.url?.includes('/auth/me');

                if (!isPublicPage && !isBackgroundRequest) {
                    isRedirecting = true;
                    // Small delay to let current request settle
                    setTimeout(() => {
                        isRedirecting = false;
                        window.location.href = '/login';
                    }, 100);
                }
            }
        }

        // 403: Forbidden - don't redirect, let components handle
        // 404: Not found - don't redirect
        // 429: Rate limited
        if (status === 429) {
            error.message = 'Quá nhiều yêu cầu. Vui lòng thử lại sau.';
        }

        // 500+: Server errors
        if (status >= 500) {
            console.error('[API] Server error:', status, error.response.data);
        }

        return Promise.reject(error);
    }
);

export default api;