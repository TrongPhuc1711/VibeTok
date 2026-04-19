import api from '../api/api';
import { setToken, setStoredUser } from '../utils/helpers';

export const googleLoginService = async (credential) => {
    try {
        const response = await api.post('/auth/social/google', { credential });
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
