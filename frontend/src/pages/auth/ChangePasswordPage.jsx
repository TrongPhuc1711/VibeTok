import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import PageLayout from '../../components/layout/PageLayout/PageLayout';
import Button from '../../components/ui/Button';
import FormInput from '../../components/common/FormInput/FormInput';
import { useToast } from '../../components/ui/Toast';
import api from '../../api/api';
import { BackIcon } from '../../icons/CommonIcons';
import { ROUTES } from '../../utils/constants';

export default function ChangePasswordPage() {
    const navigate = useNavigate();
    const { showSuccess, showError, showWarning } = useToast();

    const [form, setForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [errors, setErrors] = useState({});
    const [loading, setLoading] = useState(false);

    const set = (field) => (value) => {
        setForm(p => ({ ...p, [field]: value }));
        setErrors(p => ({ ...p, [field]: '' }));
    };

    const validate = () => {
        const e = {};
        if (!form.currentPassword) e.currentPassword = 'Vui lòng nhập mật khẩu hiện tại';
        if (!form.newPassword) {
            e.newPassword = 'Vui lòng nhập mật khẩu mới';
        } else if (form.newPassword.length < 8) {
            e.newPassword = 'Mật khẩu mới tối thiểu 8 ký tự';
        } else if (!/[A-Z]/.test(form.newPassword) || !/[a-z]/.test(form.newPassword) || !/\d/.test(form.newPassword)) {
            e.newPassword = 'Cần có chữ hoa, chữ thường và số';
        }
        if (!form.confirmPassword) {
            e.confirmPassword = 'Vui lòng xác nhận mật khẩu mới';
        } else if (form.newPassword !== form.confirmPassword) {
            e.confirmPassword = 'Mật khẩu xác nhận không khớp';
        }
        if (form.currentPassword && form.newPassword && form.currentPassword === form.newPassword) {
            e.newPassword = 'Mật khẩu mới phải khác mật khẩu hiện tại';
        }
        setErrors(e);
        return Object.keys(e).length === 0;
    };

    const handleSubmit = async () => {
        if (!validate()) {
            showWarning('Thông tin chưa hợp lệ', 'Vui lòng kiểm tra lại các trường');
            return;
        }
        setLoading(true);
        try {
            await api.patch('/auth/change-password', {
                mat_khau_cu: form.currentPassword,
                mat_khau_moi: form.newPassword,
            });
            showSuccess('Đổi mật khẩu thành công!', 'Mật khẩu của bạn đã được cập nhật');
            setTimeout(() => navigate(ROUTES.PROFILE), 1000);
        } catch (err) {
            const msg = err.response?.data?.message || 'Đổi mật khẩu thất bại';
            showError('Thất bại', msg);
            if (msg.toLowerCase().includes('cũ') || msg.toLowerCase().includes('current') || msg.toLowerCase().includes('incorrect')) {
                setErrors(p => ({ ...p, currentPassword: 'Mật khẩu hiện tại không chính xác' }));
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <PageLayout>
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-border shrink-0">
                <button
                    onClick={() => navigate(-1)}
                    className="bg-transparent border-none text-text-secondary cursor-pointer flex items-center gap-2 text-sm font-body hover:text-white transition-colors"
                >
                    <BackIcon /> Quay lại
                </button>
                <span className="text-white text-[15px] font-semibold font-body flex-1 text-center">
                    Đổi mật khẩu
                </span>
                <div className="w-16" />
            </div>

            {/* Form */}
            <div className="flex-1 overflow-auto flex items-start justify-center pt-12 px-4">
                <div className="w-full max-w-[440px] bg-surface border border-border rounded-2xl p-8 flex flex-col gap-5">
                    <div className="flex flex-col items-center gap-2 mb-2">
                        <h2 className="font-display font-bold text-[22px] text-white text-center">
                            Đổi mật khẩu
                        </h2>
                        <p className="text-text-faint text-sm font-body text-center">
                            Nhập mật khẩu hiện tại và mật khẩu mới của bạn
                        </p>
                    </div>

                    <FormInput
                        label="Mật khẩu hiện tại"
                        type="password"
                        value={form.currentPassword}
                        onChange={set('currentPassword')}
                        placeholder="••••••••"
                        error={errors.currentPassword}
                        required
                    />

                    <div className="h-px bg-border" />

                    <FormInput
                        label="Mật khẩu mới"
                        type="password"
                        value={form.newPassword}
                        onChange={set('newPassword')}
                        placeholder="Tối thiểu 8 ký tự"
                        error={errors.newPassword}
                        hint="Phải có chữ hoa, chữ thường và số"
                        required
                    />

                    <FormInput
                        label="Xác nhận mật khẩu mới"
                        type="password"
                        value={form.confirmPassword}
                        onChange={set('confirmPassword')}
                        placeholder="Nhập lại mật khẩu mới"
                        error={errors.confirmPassword}
                        required
                    />

                    {/* Password strength indicator */}
                    {form.newPassword && (
                        <PasswordStrength password={form.newPassword} />
                    )}

                    <div className="flex gap-3 pt-2">
                        <Button
                            variant="ghost"
                            onClick={() => navigate(-1)}
                            disabled={loading}
                            className="flex-1"
                        >
                            Hủy
                        </Button>
                        <Button
                            onClick={handleSubmit}
                            loading={loading}
                            className="flex-[2]"
                        >
                            Cập nhật mật khẩu
                        </Button>
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}

function PasswordStrength({ password }) {
    const checks = [
        { label: 'Tối thiểu 8 ký tự', ok: password.length >= 8 },
        { label: 'Có chữ hoa (A-Z)', ok: /[A-Z]/.test(password) },
        { label: 'Có chữ thường (a-z)', ok: /[a-z]/.test(password) },
        { label: 'Có số (0-9)', ok: /\d/.test(password) },
    ];
    const passed = checks.filter(c => c.ok).length;
    const strength = passed <= 1 ? 'Yếu' : passed <= 2 ? 'Trung bình' : passed <= 3 ? 'Khá' : 'Mạnh';
    const color = passed <= 1 ? '#ef4444' : passed <= 2 ? '#f59e0b' : passed <= 3 ? '#3b82f6' : '#10b981';

    return (
        <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
                <span className="text-[11px] font-body text-text-faint">Độ mạnh mật khẩu</span>
                <span className="text-[11px] font-bold font-body" style={{ color }}>{strength}</span>
            </div>
            <div className="flex gap-1">
                {[0, 1, 2, 3].map(i => (
                    <div
                        key={i}
                        className="flex-1 h-1 rounded-full transition-all"
                        style={{ background: i < passed ? color : '#2a2a3e' }}
                    />
                ))}
            </div>
            <div className="flex flex-col gap-1 mt-1">
                {checks.map(c => (
                    <div key={c.label} className="flex items-center gap-1.5">
                        <span style={{ color: c.ok ? '#10b981' : '#444', fontSize: 11 }}>
                            {c.ok ? '✓' : '○'}
                        </span>
                        <span
                            className="text-[11px] font-body"
                            style={{ color: c.ok ? '#10b981' : '#555' }}
                        >
                            {c.label}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}