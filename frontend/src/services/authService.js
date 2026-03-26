import { delay, ok, fail, mockUsers } from './mockData';
import { setToken, setStoredUser, clearAuth } from '../utils/helpers';
import api from '../api/api';
const safe = ({ password: _, ...u }) => u;

/* POST /api/auth/login */
export const login = async ({ email, password }) => {
    try {
        // Map 'password' từ form sang 'mat_khau'
        const response = await api.post('/auth/login', { 
            email: email, 
            mat_khau: password 
        });
        
        const { token, user } = response.data;

        // Lưu thông tin vào localStorage
        setToken(token);
        setStoredUser(user);
        
        return { user, token };
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Đăng nhập thất bại. Vui lòng kiểm tra lại!');
    }
};

/* POST /api/auth/register */
export const register = async ({ fullName, email, password }) => {
    try {
        const payload = {
            email: email,
            mat_khau: password,
            ten_hien_thi: fullName,
            // Cắt phần trước @ của email làm tên đăng nhập tạm thời
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
        return { user: response.data.user };
    } catch (error) {
        clearAuth(); 
        throw new Error('Chưa đăng nhập hoặc phiên đăng nhập hết hạn');
    }
};


export const forgotPassword = async ({ email }) => {
    throw new Error('Tính năng đang được phát triển');
};