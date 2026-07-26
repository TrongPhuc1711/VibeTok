import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { googleLoginService, facebookLoginService } from '../services/socialAuthService';
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

    const handleFacebookLogin = async () => {
        // Kiểm tra FB SDK đã load chưa
        if (!window.FB) {
            showError('Lỗi', 'Facebook SDK chưa được tải. Vui lòng thử lại sau.');
            return;
        }

        setLoading(true);

        window.FB.login((response) => {
            if (response.authResponse) {
                const { accessToken } = response.authResponse;
                // Gọi backend với access_token
                facebookLoginService(accessToken)
                    .then(({ user }) => {
                        contextLogin(user);
                        showSuccess('Đăng nhập thành công!', `Chào mừng ${user.fullName} 👋`);
                        setTimeout(() => {
                            navigate(user.vai_tro === 'admin' ? '/admin' : ROUTES.HOME);
                        }, 600);
                    })
                    .catch((error) => {
                        showError('Lỗi đăng nhập Facebook', error.message);
                    })
                    .finally(() => {
                        setLoading(false);
                    });
            } else {
                // User hủy hoặc không cấp quyền
                setLoading(false);
                showError('Đăng nhập bị hủy', 'Bạn đã hủy đăng nhập Facebook');
            }
        }, { scope: 'public_profile,email' });
    };

    return {
        loading,
        handleGoogleSuccess,
        handleGoogleError,
        handleFacebookLogin,
    };
};
