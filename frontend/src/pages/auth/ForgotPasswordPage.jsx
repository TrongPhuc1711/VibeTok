import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormInput from '../../components/common/FormInput/FormInput';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import api from '../../api/api';
import { ROUTES } from '../../utils/constants';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    
    const [step, setStep] = useState(1); // 1: Nhập Email, 2: Nhập OTP & MK mới
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);

    // Xử lý gửi OTP
    const handleSendOTP = async () => {
        if (!email) return showError('Lỗi', 'Vui lòng nhập email');
        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            showSuccess('Thành công', 'Mã OTP đã được gửi đến email của bạn!');
            setStep(2);
        } catch (error) {
            showError('Lỗi', error.response?.data?.message || 'Không thể gửi mã OTP');
        } finally {
            setLoading(false);
        }
    };

    // Xử lý đổi mật khẩu
    const handleResetPassword = async () => {
        if (!otp || !newPassword) return showError('Lỗi', 'Vui lòng nhập đầy đủ thông tin');
        if (newPassword.length < 8) return showError('Lỗi', 'Mật khẩu tối thiểu 8 ký tự');
        
        setLoading(true);
        try {
            await api.post('/auth/reset-password', { 
                email, 
                otp, 
                mat_khau_moi: newPassword 
            });
            showSuccess('Thành công', 'Mật khẩu đã được đặt lại!');
            setTimeout(() => navigate(ROUTES.LOGIN), 1500);
        } catch (error) {
            showError('Lỗi', error.response?.data?.message || 'Mã OTP không hợp lệ');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-base flex flex-col items-center justify-center font-body px-4">
            <div className="w-full max-w-[440px] bg-surface border border-border rounded-2xl p-8 flex flex-col gap-5">
                <h2 className="font-display font-bold text-[24px] text-white text-center">
                    Quên Mật Khẩu
                </h2>
                
                {step === 1 ? (
                    <>
                        <p className="text-text-faint text-sm text-center">
                            Nhập email bạn đã đăng ký, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
                        </p>
                        <FormInput 
                            label="Email" 
                            type="email" 
                            value={email}
                            onChange={v => setEmail(v)} 
                            placeholder="nguyenvibe@email.com" 
                            required 
                        />
                        <Button onClick={handleSendOTP} loading={loading} fullWidth>
                            Gửi mã OTP
                        </Button>
                    </>
                ) : (
                    <>
                        <p className="text-text-faint text-sm text-center">
                            Nhập mã OTP gồm 6 chữ số đã được gửi đến <strong>{email}</strong>
                        </p>
                        <FormInput 
                            label="Mã OTP" 
                            type="text" 
                            value={otp}
                            onChange={v => setOtp(v)} 
                            placeholder="Nhập mã 6 số" 
                            required 
                        />
                        <FormInput 
                            label="Mật khẩu mới" 
                            type="password" 
                            value={newPassword}
                            onChange={v => setNewPassword(v)} 
                            placeholder="Tối thiểu 8 ký tự" 
                            required 
                        />
                        <Button onClick={handleResetPassword} loading={loading} fullWidth>
                            Đặt lại mật khẩu
                        </Button>
                    </>
                )}

                <button 
                    onClick={() => navigate(-1)} 
                    className="bg-transparent border-none text-text-secondary text-sm hover:text-white mt-2 cursor-pointer transition-colors"
                >
                    Quay lại đăng nhập
                </button>
            </div>
        </div>
    );}