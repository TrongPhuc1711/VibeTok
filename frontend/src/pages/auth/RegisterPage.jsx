import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import FormInput from '../../components/common/FormInput/FormInput';
import Button from '../../components/ui/Button';
import { register } from '../../services/authService';
import { useValidation } from '../../hooks/useValidation';
import { registerSchema, calculateAge } from '../../utils/validators';
import { ROUTES, MIN_AGE } from '../../utils/constants';
import { useToast } from '../../components/ui/Toast';

export default function RegisterPage() {
  const navigate = useNavigate();
  const { showSuccess, showError, showInfo, showWarning} = useToast();
  const { errors, validate, validateField, clearField } = useValidation(registerSchema);
  const [form, setForm] = useState({ fullName: '', email: '', password: '', birthDate: '' });
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const set = (field) => (value) => {
    setForm((p) => ({ ...p, [field]: value }));
    clearField(field);
    setApiError('');
  };

  const handleSubmit = async () => {
    if (!validate(form)) {
      showWarning('Vui lòng kiểm tra lại', 'Một số thông tin chưa hợp lệ');
      return;
    }
    setLoading(true);
    showInfo('Đang xử lý...', 'Đang tạo tài khoản của bạn');
    try {
      await register(form);
      showSuccess('Đăng ký thành công!', `Chào mừng ${form.fullName} đến với VibeTok! Hãy đăng nhập để tiếp tục.`);
      setTimeout(() => navigate(ROUTES.LOGIN), 800);
    } catch (e) {
      const msg = e.message || 'Đăng ký thất bại';
      setApiError(msg);
      showError('Đăng ký thất bại', msg);
    } finally {
      setLoading(false);
    }
  };

  const age = form.birthDate ? calculateAge(form.birthDate) : null;


  return (
    <div className="min-h-screen bg-base flex font-body">
      {/* Left branding */}
      <div className="flex-1 flex items-center justify-center relative overflow-hidden">
        {[960, 700, 500, 340, 200].map((s, i) => (
          <div
            key={s}
            className="absolute rounded-full border border-primary/[0.1] pointer-events-none"
            style={{ width: s, height: s, opacity: 1 - i * 0.12 }}
          />
        ))}
        <div className="relative z-10 text-center select-none">
          <h1 className="font-display font-extrabold text-[72px] text-primary tracking-tight leading-none mb-4">
            VibeTok
          </h1>
          <p className="text-text-subtle text-[13px] tracking-[2.34px] mb-6 uppercase">
            FEEL THE VIBE
          </p>
          <p className="text-text-faint text-sm leading-relaxed max-w-[260px] mx-auto">
            Tham gia cộng đồng sáng tạo video ngắn lớn nhất Việt Nam
          </p>
        </div>
      </div>

      {/* Right form */}
      <div className="w-[480px] bg-surface border-l border-border flex flex-col justify-center px-10 py-12 gap-4 overflow-auto">
        <div>
          <h2 className="font-display font-bold text-[28px] text-white mb-1.5">
            Tạo tài khoản
          </h2>
          <p className="text-text-faint text-sm">Bắt đầu hành trình sáng tạo của bạn</p>
        </div>

        {apiError && (
          <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-3 text-primary text-[13px]">
            {apiError}
          </div>
        )}

        <FormInput
          label="Họ và tên"
          value={form.fullName}
          onChange={set('fullName')}
          onBlur={(v) => validateField('fullName', v)}
          placeholder="Nguyễn Vibe"
          error={errors.fullName}
          required
        />

        <FormInput
          label="Email"
          type="email"
          value={form.email}
          onChange={set('email')}
          onBlur={(v) => validateField('email', v)}
          placeholder="email@example.com"
          error={errors.email}
          required
        />

        <FormInput
          label="Mật khẩu"
          type="password"
          value={form.password}
          onChange={set('password')}
          onBlur={(v) => validateField('password', v)}
          placeholder="Tối thiểu 8 ký tự"
          error={errors.password}
          hint="Cần có chữ hoa, chữ thường và số"
          required
        />

        {/* Ngày sinh */}
        <div>
          <label className="block font-body text-sm text-text-secondary mb-1.5 font-medium">
            Ngày sinh <span className="text-primary">*</span>
          </label>
          <input
            type="date"
            value={form.birthDate}
            onChange={(e) => set('birthDate')(e.target.value)}
            onBlur={(e) => validateField('birthDate', e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            className={`
              w-full bg-elevated border rounded-lg px-4 py-4 text-sm font-body outline-none
              transition-colors [color-scheme:dark]
              ${errors.birthDate ? 'border-primary text-white' : 'border-border2 text-white'}
            `}
          />
          {errors.birthDate ? (
            <p className="text-primary text-xs mt-1.5">{errors.birthDate}</p>
          ) : age !== null && (
            <p className="text-text-faint text-xs mt-1.5">
              Tuổi:{' '}
              <span className={age >= MIN_AGE ? 'text-emerald-400' : 'text-primary'}>
                {age} tuổi
              </span>
              {age < MIN_AGE && ` — Bạn phải từ ${MIN_AGE} tuổi trở lên`}
            </p>
          )}
        </div>

        <Button onClick={handleSubmit} loading={loading} fullWidth size="lg" className="mt-1">
          Đăng ký
        </Button>

        <p className="text-center text-text-faint text-sm m-0">
          Đã có tài khoản?{' '}
          <button
            onClick={() => navigate(ROUTES.LOGIN)}
            className="bg-transparent border-none text-primary text-sm font-semibold cursor-pointer"
          >
            Đăng nhập
          </button>
        </p>

        <p className="text-center text-[#2a2a3a] text-[11px] leading-relaxed m-0">
          Bằng cách đăng ký, bạn đồng ý với Điều khoản &amp; Chính sách của VibeTok
        </p>
      </div>
    </div>
  );
}