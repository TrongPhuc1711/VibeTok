import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormInput from '../../components/common/FormInput/FormInput';
import Button from '../../components/ui/Button';
import { login } from '../../services/authService';
import { useValidation } from '../../hooks/useValidation';
import { loginSchema } from '../../utils/validators';
import { ROUTES } from '../../utils/constants';
import { useToast } from '../../components/ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { useAuthContext } from '../../contexts/AuthContext';

export default function LoginPage() {
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const { errors, validate, validateField, clearField } = useValidation(loginSchema);
    const [form, setForm] = useState({ email: '', password: '' });
    const [loading, setLoading] = useState(false);
    const [apiError, setApiError] = useState('');
    const { isDark, toggleTheme } = useTheme();
    // ✅ FIX: Dùng AuthContext để update state reactive - sidebar tự reload
    const { login: contextLogin } = useAuthContext();

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
            // ✅ Cập nhật AuthContext ngay - sidebar sẽ re-render với nav items đầy đủ
            contextLogin(user);
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
        <div className={`min-h-screen flex font-body transition-colors duration-300
            ${isDark ? 'bg-base' : 'bg-[#f0f0f5]'}`}>

            {/* ── Theme toggle ── */}
            <button
                onClick={toggleTheme}
                title={isDark ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
                className={`
                    fixed top-4 left-4 z-50 flex items-center gap-2
                    px-3 py-2 rounded-xl border text-[12px] font-body font-medium
                    transition-all duration-200 cursor-pointer backdrop-blur-sm
                    ${isDark
                        ? 'bg-[#111118]/80 border-[#2a2a3e] text-[#888] hover:border-primary/50 hover:text-primary'
                        : 'bg-white/80 border-[#d0d0e0] text-[#555] hover:border-primary/50 hover:text-primary shadow-sm'
                    }
                `}
            >
                {isDark ? <SunIcon /> : <MoonIcon />}
                <span>{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>

            {/* ── Left branding ── */}
            <div className="flex-1 flex items-center justify-center relative overflow-hidden">
                {[960, 700, 500, 340, 200].map((s, i) => (
                    <div key={s} className="absolute rounded-full border border-primary/[0.1] pointer-events-none"
                        style={{ width: s, height: s, opacity: 1 - i * 0.12 }} />
                ))}
                <div className="relative z-10 text-center select-none">
                    <h1 className="font-display font-extrabold text-[72px] text-primary tracking-tight leading-none mb-4">VibeTok</h1>
                    <p className={`text-[13px] tracking-[2.34px] mb-10 uppercase
                        ${isDark ? 'text-text-subtle' : 'text-[#999]'}`}>
                        FEEL THE VIBE
                    </p>
                    <p className={`text-sm leading-relaxed max-w-[280px] mx-auto
                        ${isDark ? 'text-text-faint' : 'text-[#777]'}`}>
                        Nền tảng chia sẻ video ngắn dành cho thế hệ sáng tạo Việt Nam
                    </p>
                </div>
            </div>

            {/* ── Right form ── */}
            <div className={`w-[480px] border-l flex flex-col justify-center px-10 py-16 gap-5 overflow-auto transition-colors duration-300
                ${isDark
                    ? 'bg-surface border-border'
                    : 'bg-white border-[#e2e2ee] shadow-[-8px_0_32px_rgba(0,0,0,0.06)]'
                }`}>

                <div>
                    <h2 className={`font-display font-bold text-[32px] mb-1.5
                        ${isDark ? 'text-white' : 'text-[#0a0a0f]'}`}>
                        Chào mừng trở lại 👋
                    </h2>
                    <p className={isDark ? 'text-text-faint text-sm' : 'text-[#777] text-sm'}>
                        Đăng nhập để tiếp tục khám phá
                    </p>
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
                    <button type='button'
                        onClick={() => navigate('/forgot-password')}
                        className="bg-transparent border-none text-primary text-sm cursor-pointer font-body hover:underline">
                        Quên mật khẩu?
                    </button>
                </div>

                <Button onClick={handleSubmit} loading={loading} fullWidth size="lg">
                    Đăng nhập
                </Button>

                <div className="flex items-center gap-3">
                    <div className={`flex-1 h-px ${isDark ? 'bg-border' : 'bg-[#e2e2ee]'}`} />
                    <span className={`text-[13px] ${isDark ? 'text-text-dim' : 'text-[#aaa]'}`}>
                        hoặc đăng nhập bằng
                    </span>
                    <div className={`flex-1 h-px ${isDark ? 'bg-border' : 'bg-[#e2e2ee]'}`} />
                </div>

                <div className="flex gap-2.5">
                    {['Facebook', 'Google'].map(p => (
                        <button key={p}
                            className={`flex-1 rounded-lg py-2.5 text-[13px] font-body cursor-pointer flex items-center justify-center gap-2 transition-colors border
                                ${isDark
                                    ? 'bg-elevated border-border2 text-text-secondary hover:border-primary/40'
                                    : 'bg-[#f5f5fa] border-[#d0d0e0] text-[#555] hover:border-primary/40'
                                }`}>
                            {p === 'Facebook' ? '𝕗' : 'G'} {p}
                        </button>
                    ))}
                </div>

                <p className={`text-center text-sm m-0 ${isDark ? 'text-text-faint' : 'text-[#777]'}`}>
                    Chưa có tài khoản?{' '}
                    <button onClick={() => navigate(ROUTES.REGISTER)}
                        className="bg-transparent border-none text-primary text-sm font-semibold cursor-pointer">
                        Đăng ký ngay
                    </button>
                </p>

                <p className={`text-center text-[11px] leading-relaxed m-0 ${isDark ? 'text-[#2a2a3a]' : 'text-[#ccc]'}`}>
                    Bằng cách đăng nhập, bạn đồng ý với Điều khoản &amp; Chính sách của VibeTok
                </p>
            </div>
        </div>
    );
}

function SunIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <circle cx="12" cy="12" r="4" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
        </svg>
    );
}
function MoonIcon() {
    return (
        <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
        </svg>
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