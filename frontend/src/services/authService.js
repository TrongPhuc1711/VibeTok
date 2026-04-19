import { setToken, setStoredUser, clearAuth } from '../utils/helpers';
import api from '../api/api';

/* POST /api/auth/login */
export const login = async ({ email, password }) => {
    try {
        const response = await api.post('/auth/login', {
            email,
            mat_khau: password,
        });

        const { token, user } = response.data;

        const normalizedUser = {
            ...user,
            id:       String(user.id),
            username: user.username || user.ten_dang_nhap,
            fullName: user.fullName || user.ten_hien_thi || '',
            initials: user.initials || buildInitials(user.fullName || user.ten_hien_thi || ''),
        };

        setToken(token);
        setStoredUser(normalizedUser);

        return { user: normalizedUser, token };
    } catch (error) {
        // Giữ nguyên response data để LoginPage detect banned
        const err = new Error(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
        err.response = error.response;
        throw err;
    }
};

/* POST /api/auth/register */
export const register = async ({ fullName, email, password }) => {
    try {
        const payload = {
            email,
            mat_khau:      password,
            ten_hien_thi:  fullName,
            ten_dang_nhap: email.split('@')[0] + Math.floor(Math.random() * 1000),
        };
        const response = await api.post('/auth/register', payload);
        return response.data;
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Đăng ký thất bại. Vui lòng thử lại!');
    }
};

/* POST /api/auth/logout */
export const logout = async () => {
    try {
        // Reset socket connection khi logout để tránh leak
        // Import dynamic để tránh circular dependency
        const { resetSocket } = await import('../hooks/useMessages.js');
        resetSocket();
    } catch {
        // Bỏ qua lỗi import nếu module chưa load
    }
    clearAuth();
    return { message: 'Đã đăng xuất' };
};

/* GET /api/auth/me */
export const getMe = async () => {
    try {
        const response = await api.get('/auth/me');
        const user     = response.data.user;

        const normalizedUser = {
            ...user,
            id:       String(user.id),
            username: user.username || user.ten_dang_nhap,
            fullName: user.fullName || user.ten_hien_thi || '',
            initials: user.initials || buildInitials(user.fullName || user.ten_hien_thi || ''),
        };
        setStoredUser(normalizedUser);

        return { user: normalizedUser };
    } catch (error) {
        // Chỉ xóa auth khi server xác nhận token không hợp lệ (401/403)
        // Lỗi network/abort/timeout → giữ nguyên session, không xóa token
        const status = error.response?.status;
        if (status === 401 || status === 403) {
            clearAuth();
        }
        throw error;
    }
};

// Helper
function buildInitials(name = '') {
    return name
        .trim()
        .split(/\s+/)
        .map(w => w[0]?.toUpperCase() ?? '')
        .slice(0, 2)
        .join('') || 'U';
}