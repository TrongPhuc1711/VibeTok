import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleLoginService } from '../services/socialAuthService';
import { useAuthContext } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';
import { ROUTES } from '../utils/constants';

export const useSocialAuth = () => {
    const [loading, setLoading] = useState(false);
    const { login: contextLogin } = useAuthContext();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();

    const handleGoogleSuccess = async (credentialResponse) => {
        setLoading(true);
        try {
            const { access_token } = credentialResponse;
            const { user } = await googleLoginService(access_token);
            
            contextLogin(user);
            showSuccess('Đăng nhập thành công!', `Chào mừng ${user.fullName} 👋`);
            
            setTimeout(() => {
                navigate(user.vai_tro === 'admin' ? '/admin' : ROUTES.HOME);
            }, 600);

        } catch (error) {
            showError('Lỗi đăng nhập', error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleError = () => {
        showError('Đăng nhập thất bại', 'Không thể kết nối với Google');
    };

    return {
        loading,
        handleGoogleSuccess,
        handleGoogleError
    };
};
