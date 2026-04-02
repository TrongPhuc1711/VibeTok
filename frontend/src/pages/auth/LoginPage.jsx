import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormInput from '../../components/common/FormInput/FormInput';
import Button from '../../components/ui/Button';
import { login } from '../../services/authService';
import { useValidation } from '../../hooks/useValidation';
import { loginSchema } from '../../utils/validators';
import { ROUTES } from '../../utils/constants';
import { useToast } from '../../components/ui/Toast';

export default function LoginPage() {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { errors, validate, validateField, clearField } = useValidation(loginSchema);
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');

    const set = (field) => (value) => {
        setForm(p => ({ ...p, [field]: value }));
        clearField(field);
        setApiError('');
    };

    const handleSubmit = async () => {
        if (!validate(form)) return;
        setLoading(true);
        try {
            const { user } = await login(form);
            showSuccess('Đăng nhập thành công!', `Chào mừng trở lại, ${user.fullName || user.username} 👋`);
            setTimeout(() => {
                if (user?.vai_tro === 'admin') {
                    navigate('/admin');
                } else {
                    navigate(ROUTES.HOME);
                }
            }, 600);
        } catch (e) {
            const msg = e.message || 'Đăng nhập thất bại';
            setApiError(msg);
            showError('Đăng nhập thất bại', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-base flex font-body">
            {/* Left branding */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                {[960, 700, 500, 340, 200].map((s, i) => (
                    <div key={s} className="absolute rounded-full border border-primary/[0.1] pointer-events-none"
                        style={{ width: s, height: s, opacity: 1 - i * 0.12 }} />
                ))}
                <div className="relative z-10 text-center select-none">
                    <h1 className="font-display font-extrabold text-[72px] text-primary tracking-tight leading-none mb-4">VibeTok</h1>
                    <p className="text-text-subtle text-[13px] tracking-[2.34px] mb-10 uppercase">FEEL THE VIBE</p>
                    <p className="text-text-faint text-sm leading-relaxed max-w-[280px] mx-auto">
                        Nền tảng chia sẻ video ngắn dành cho thế hệ sáng tạo Việt Nam
                    </p>
                </div>
            </div>

            {/* Right form */}
            <div className="w-[480px] bg-surface border-l border-border flex flex-col justify-center px-10 py-16 gap-5 overflow-auto">
                <div>
                    <h2 className="font-display font-bold text-[32px] text-white mb-1.5">Chào mừng trở lại 👋</h2>
                    <p className="text-text-faint text-sm">Đăng nhập để tiếp tục khám phá</p>
                </div>

                {apiError && (
                    <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 text-primary text-[13px]">
                        {apiError}
                    </div>
                )}

                <FormInput label="Email" type="email" value={form.email}
                    onChange={set('email')} onBlur={v => validateField('email', v)}
                    placeholder="nguyenvibe@email.com" error={errors.email}
                    icon={<EmailIcon />} required />

                <FormInput label="Mật khẩu" type="password" value={form.password}
                    onChange={set('password')} onBlur={v => validateField('password', v)}
                    placeholder="••••••••" error={errors.password}
                    icon={<LockIcon />} required />

                <div className="text-right -mt-1">
                    <button className="bg-transparent border-none text-primary text-sm cursor-pointer font-body hover:underline">
                        Quên mật khẩu?
                    </button>
                </div>

                <Button onClick={handleSubmit} loading={loading} fullWidth size="lg">
                    Đăng nhập
                </Button>

                <div className="flex items-center gap-3">
                    <div className="flex-1 h-px bg-border" />
                    <span className="text-text-dim text-[13px]">hoặc đăng nhập bằng</span>
                    <div className="flex-1 h-px bg-border" />
                </div>

                <div className="flex gap-2.5">
                    {['Facebook', 'Google'].map(p => (
                        <button key={p}
                            className="flex-1 bg-elevated border border-border2 rounded-lg py-2.5 text-text-secondary text-[13px] font-body cursor-pointer flex items-center justify-center gap-2 hover:border-primary/40 transition-colors">
                            {p === 'Facebook' ? '𝕗' : 'G'} {p}
                        </button>
                    ))}
                </div>

                <p className="text-center text-text-faint text-sm m-0">
                    Chưa có tài khoản?{' '}
                    <button onClick={() => navigate(ROUTES.REGISTER)}
                        className="bg-transparent border-none text-primary text-sm font-semibold cursor-pointer">
                        Đăng ký ngay
                    </button>
                </p>

                <p className="text-center text-[#2a2a3a] text-[11px] leading-relaxed m-0">
                    Bằng cách đăng nhập, bạn đồng ý với Điều khoản &amp; Chính sách của VibeTok
                </p>
            </div>
        </div>
    );
}

function EmailIcon() {
    return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#666" strokeWidth="1.2">
        <path d="M2 4h12v8a1 1 0 01-1 1H3a1 1 0 01-1-1V4z" />
        <path d="M2 4l6 5 6-5" />
    </svg>;
}
function LockIcon() {
    return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#666" strokeWidth="1.2">
        <rect x="3" y="7" width="10" height="8" rx="1" />
        <path d="M5 7V5a3 3 0 016 0v2" />
        <circle cx="8" cy="11" r="1" fill="#666" />
    </svg>;
}