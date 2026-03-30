import { setToken, setStoredUser, clearAuth } from '../utils/helpers';
import api from '../api/api';

/* POST /api/auth/login */
export const login = async ({ email, password }) => {
    try {
        const response = await api.post('/auth/login', {
            email:    email,
            mat_khau: password
        });

        const { token, user } = response.data;

        // Chuẩn hoá user object trước khi lưu vào localStorage
        // Đảm bảo cả 2 field gốc (ten_dang_nhap) lẫn alias (username, fullName) đều có
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
        throw new Error(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
    }
};

/* POST /api/auth/register */
export const register = async ({ fullName, email, password }) => {
    try {
        const payload = {
            email:         email,
            mat_khau:      password,
            ten_hien_thi:  fullName,
            ten_dang_nhap: email.split('@')[0] + Math.floor(Math.random() * 1000)
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
        clearAuth();
        return { message: 'Đã đăng xuất' };
    } catch (error) {
        throw new Error('Lỗi khi đăng xuất');
    }
};

/* GET /api/auth/me */
export const getMe = async () => {
    try {
        const response = await api.get('/auth/me');
        const user = response.data.user;

        //cập nhật lại localStorage mỗi lần getMe thành công
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
        clearAuth();
        throw new Error('Chưa đăng nhập hoặc phiên đăng nhập hết hạn');
    }
};

export const forgotPassword = async ({ email }) => {
    throw new Error('Tính năng đang được phát triển');
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