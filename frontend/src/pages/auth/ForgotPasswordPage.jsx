import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FormInput from '../../components/common/FormInput/FormInput';
import Button from '../../components/ui/Button';
import { useToast } from '../../components/ui/Toast';
import api from '../../api/api';
import { ROUTES } from '../../utils/constants';
import { isValidEmail } from '../../utils/validators';

export default function ForgotPasswordPage() {
    const navigate = useNavigate();
    const { showSuccess, showError, showWarning } = useToast();

    const [step, setStep] = useState(1);
    const [email, setEmail] = useState('');
    const [otp, setOtp] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [countdown, setCountdown] = useState(0); // đếm ngược giây

    // Đếm ngược khi bước 2 bắt đầu
    useEffect(() => {
        if (countdown <= 0) return;
        const t = setTimeout(() => setCountdown(c => c - 1), 1000);
        return () => clearTimeout(t);
    }, [countdown]);

    const handleSendOTP = async () => {
        if (!email.trim()) return showWarning('Thiếu thông tin', 'Vui lòng nhập email');
        if (!isValidEmail(email)) return showError('Lỗi', 'Email không đúng định dạng');

        setLoading(true);
        try {
            await api.post('/auth/forgot-password', { email });
            showSuccess('Thành công', 'Mã OTP đã được gửi đến email của bạn!');
            setStep(2);
            setCountdown(600); // 10 phút
        } catch (error) {
            showError('Lỗi', error.response?.data?.message || 'Không thể gửi mã OTP');
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setOtp('');
        setStep(1);
        setCountdown(0);
    };

    const handleResetPassword = async () => {
        if (!otp.trim() || !newPassword.trim())
            return showWarning('Thiếu thông tin', 'Vui lòng nhập đầy đủ thông tin');
        if (!/^\d{6}$/.test(otp))
            return showError('Lỗi', 'Mã OTP phải gồm đúng 6 chữ số');
        if (newPassword.length < 8)
            return showError('Lỗi', 'Mật khẩu tối thiểu 8 ký tự');

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
            showError('Lỗi', error.response?.data?.message || 'Mã OTP không hợp lệ hoặc đã hết hạn');
        } finally {
            setLoading(false);
        }
    };

    const fmtCountdown = (s) =>
        `${String(Math.floor(s / 60)).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`;

    return (
        <div className="min-h-screen bg-base flex flex-col items-center justify-center font-body px-4">
            <div className="w-full max-w-[440px] bg-surface border border-border rounded-2xl p-8 flex flex-col gap-5">
                <h2 className="font-display font-bold text-[24px] text-white text-center">
                    Quên Mật Khẩu
                </h2>

                {step === 1 ? (
                    <>
                        <p className="text-text-faint text-sm text-center">
                            Nhập email bạn đã đăng ký, chúng tôi sẽ gửi mã OTP 6 chữ số.
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
                            Nhập mã OTP gồm 6 chữ số đã được gửi đến{' '}
                            <strong className="text-white">{email}</strong>
                        </p>

                        {/* Đếm ngược */}
                        {countdown > 0 ? (
                            <p className="text-center text-[12px] font-body text-text-faint">
                                Mã hết hạn sau{' '}
                                <span className="text-primary font-semibold">{fmtCountdown(countdown)}</span>
                            </p>
                        ) : (
                            <p className="text-center text-[12px] font-body text-red-400">
                                Mã OTP đã hết hạn.{' '}
                                <button
                                    onClick={handleResend}
                                    className="text-primary underline bg-transparent border-none cursor-pointer"
                                >
                                    Gửi lại
                                </button>
                            </p>
                        )}

                        <FormInput
                            label="Mã OTP"
                            type="text"
                            value={otp}
                            onChange={v => setOtp(v.replace(/\D/g, '').slice(0, 6))}
                            placeholder="6 chữ số"
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
                        <Button
                            onClick={handleResetPassword}
                            loading={loading}
                            disabled={countdown === 0}
                            fullWidth
                        >
                            Đặt lại mật khẩu
                        </Button>

                        <button
                            onClick={handleResend}
                            className="bg-transparent border-none text-text-secondary text-sm hover:text-white cursor-pointer transition-colors text-center"
                        >
                            ← Thay đổi email
                        </button>
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
    );
}