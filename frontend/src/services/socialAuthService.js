import api from '../api/api';
import { setToken, setStoredUser } from '../utils/helpers';

export const googleLoginService = async (access_token) => {
    try {
        const response = await api.post('/auth/social/google', { access_token });
        const { token, user } = response.data;
        
        // Normalize user giống login thường
        const normalizedUser = {
            ...user,
            id:       String(user.id),
            username: user.username || user.ten_dang_nhap,
            fullName: user.fullName || user.ten_hien_thi || '',
        };

        // Lưu vào localStorage
        setToken(token);
        setStoredUser(normalizedUser);

        return { user: normalizedUser, token };
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Đăng nhập Google thất bại');
    }
};

export const facebookLoginService = async (access_token) => {
    try {
        const response = await api.post('/auth/social/facebook', { access_token });
        const { token, user } = response.data;
        
        const normalizedUser = {
            ...user,
            id:       String(user.id),
            username: user.username || user.ten_dang_nhap,
            fullName: user.fullName || user.ten_hien_thi || '',
        };

        setToken(token);
        setStoredUser(normalizedUser);

        return { user: normalizedUser, token };
    } catch (error) {
        throw new Error(error.response?.data?.message || 'Đăng nhập Facebook thất bại');
    }
};

