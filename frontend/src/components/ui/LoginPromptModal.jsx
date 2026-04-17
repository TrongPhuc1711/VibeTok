import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FacebookIcon, GoogleIcon } from '../../icons/CommonIcons'; 

export default function LoginPromptModal({ open, onClose, action = 'like' }) {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (open) {
      requestAnimationFrame(() => setVisible(true));
    } else {
      setVisible(false);
    }
  }, [open]);

  if (!open) return null;

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 250);
  };

  const handleLogin = () => {
    handleClose();
    setTimeout(() => navigate('/login'), 250);
  };

  const handleRegister = () => {
    handleClose();
    setTimeout(() => navigate('/register'), 250);
  };

  const ACTION_TEXT = {
    like:     'Đăng nhập để thích video này',
    comment:  'Đăng nhập để bình luận',
    follow:   'Đăng nhập để theo dõi creator',
    bookmark: 'Đăng nhập để lưu video',
    share:    'Đăng nhập để chia sẻ',
    default:  'Đăng nhập để tương tác',
  };

  const ACTION_ICON = {
    like:     <HeartIllustration />,
    comment:  <CommentIllustration />,
    follow:   <FollowIllustration />,
    bookmark: <BookmarkIllustration />,
    default:  <HeartIllustration />,
  };

  const text = ACTION_TEXT[action] ?? ACTION_TEXT.default;
  const icon = ACTION_ICON[action] ?? ACTION_ICON.default;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-[500]"
        style={{
          background: 'rgba(0,0,0,0.65)',
          backdropFilter: 'blur(4px)',
          opacity: visible ? 1 : 0,
          transition: 'opacity 0.25s ease',
        }}
        onClick={handleClose}
      />

      {/* Modal — slide up từ dưới */}
      <div
        className="fixed z-[501] left-1/2 -translate-x-1/2 flex flex-col items-center"
        style={{
          bottom: visible ? 0 : '-100%',
          transition: 'bottom 0.3s cubic-bezier(0.32, 0.72, 0, 1)',
          width: '100%',
          maxWidth: 480,
        }}
      >
        <div
          className="w-full rounded-t-3xl overflow-hidden"
          style={{
            background: '#111118',
            border: '1px solid rgba(255,255,255,0.08)',
            borderBottom: 'none',
            boxShadow: '0 -20px 60px rgba(0,0,0,0.7)',
          }}
        >
          {/* Handle bar */}
          <div className="flex justify-center pt-3 pb-2">
            <div className="w-10 h-1 rounded-full bg-white/20" />
          </div>

          {/* Close */}
          <button
            onClick={handleClose}
            className="absolute top-4 right-4 w-8 h-8 rounded-full bg-white/8 border-none cursor-pointer flex items-center justify-center text-white/50 hover:bg-white/15 hover:text-white transition-all"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M2 2l10 10M12 2L2 12" />
            </svg>
          </button>

          <div className="px-6 pb-8 pt-2 flex flex-col items-center gap-5">
            {/* Illustration */}
            <div className="flex flex-col items-center gap-3">
              <div
                className="w-20 h-20 rounded-2xl flex items-center justify-center"
                style={{ background: 'rgba(255,45,120,0.1)', border: '1px solid rgba(255,45,120,0.2)' }}
              >
                {icon}
              </div>

              <div className="text-center">
                <h3 className="text-white text-[18px] font-bold font-display mb-1">
                  {text}
                </h3>
                <p className="text-[#777] text-[13px] font-body leading-relaxed">
                  Tham gia VibeTok để xem thêm nội dung thú vị<br />
                  và kết nối với các creator yêu thích
                </p>
              </div>
            </div>

            {/* Divider */}
            <div className="w-full h-px bg-white/6" />

            {/* Auth options */}
            <div className="w-full flex flex-col gap-3">
              {/* Facebook */}
              <button
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <FacebookIcon />
                </div>
                <span className="text-white/80 text-[14px] font-body">Tiếp tục với Facebook</span>
              </button>

              {/* Google */}
              <button
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <GoogleIcon />
                </div>
                <span className="text-white/80 text-[14px] font-body">Tiếp tục với Google</span>
              </button>

              {/* Email */}
              <button
                onClick={handleLogin}
                className="w-full flex items-center gap-3 px-5 py-3.5 rounded-xl border border-white/8 bg-white/4 hover:bg-white/8 transition-colors cursor-pointer"
              >
                <div className="w-6 h-6 flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="rgba(255,255,255,0.7)" strokeWidth="1.3">
                    <path d="M1.5 4.5h15v10.5a.75.75 0 01-.75.75H2.25A.75.75 0 011.5 15V4.5z" />
                    <path d="M1.5 4.5L9 10.5l7.5-6" />
                  </svg>
                </div>
                <span className="text-white/80 text-[14px] font-body">Đăng nhập với Email</span>
              </button>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 w-full">
              <div className="flex-1 h-px bg-white/8" />
              <span className="text-[#555] text-[11px] font-body">hoặc</span>
              <div className="flex-1 h-px bg-white/8" />
            </div>

            {/* Register CTA */}
            <div className="text-center">
              <span className="text-[#888] text-[13px] font-body">Chưa có tài khoản? </span>
              <button
                onClick={handleRegister}
                className="text-primary text-[13px] font-semibold font-body bg-transparent border-none cursor-pointer hover:underline"
              >
                Đăng ký ngay
              </button>
            </div>

            {/* Terms */}
            <p className="text-center text-[#333] text-[11px] font-body leading-relaxed">
              Bằng cách tiếp tục, bạn đồng ý với{' '}
              <span className="text-[#555] hover:underline cursor-pointer">Điều khoản dịch vụ</span>
              {' '}và{' '}
              <span className="text-[#555] hover:underline cursor-pointer">Chính sách quyền riêng tư</span>
              {' '}của VibeTok
            </p>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Illustrations ── */
function HeartIllustration() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path
        d="M18 31.5l-1.8-1.638C9 23.13 3.5 18.27 3.5 12.3 3.5 7.44 7.44 3.5 12.3 3.5c2.64 0 5.169 1.23 6.3 3.15C21.18 4.73 23.709 3.5 26.37 3.5c4.86 0 8.13 3.94 8.13 8.8 0 5.97-5.5 10.83-12.7 17.562L18 31.5z"
        fill="url(#heartGrad)"
      />
      <defs>
        <linearGradient id="heartGrad" x1="3.5" y1="3.5" x2="34.5" y2="31.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff2d78" />
          <stop offset="1" stopColor="#ff6b35" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function CommentIllustration() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path
        d="M31.5 22.5a3 3 0 01-3 3H10.5L4.5 31.5V7.5a3 3 0 013-3h21a3 3 0 013 3v15z"
        fill="url(#commentGrad)"
      />
      <defs>
        <linearGradient id="commentGrad" x1="4.5" y1="4.5" x2="31.5" y2="31.5" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff2d78" />
          <stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function FollowIllustration() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <circle cx="14" cy="12" r="6" fill="url(#followGrad)" />
      <path d="M1.5 30c0-6.627 5.596-12 12.5-12 2.394 0 4.63.669 6.5 1.824" stroke="url(#followGrad2)" strokeWidth="2.5" strokeLinecap="round" />
      <circle cx="27" cy="27" r="7" fill="url(#followGrad3)" />
      <path d="M24 27h6M27 24v6" stroke="white" strokeWidth="2" strokeLinecap="round" />
      <defs>
        <linearGradient id="followGrad" x1="8" y1="6" x2="20" y2="18" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff2d78" /><stop offset="1" stopColor="#ff6b35" />
        </linearGradient>
        <linearGradient id="followGrad2" x1="1.5" y1="18" x2="20.5" y2="30" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff2d78" /><stop offset="1" stopColor="#ff6b35" />
        </linearGradient>
        <linearGradient id="followGrad3" x1="20" y1="20" x2="34" y2="34" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff2d78" /><stop offset="1" stopColor="#ff6b35" />
        </linearGradient>
      </defs>
    </svg>
  );
}

function BookmarkIllustration() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
      <path d="M7.5 4.5h21v28.5L18 27l-10.5 6V4.5z" fill="url(#bookmarkGrad)" />
      <defs>
        <linearGradient id="bookmarkGrad" x1="7.5" y1="4.5" x2="28.5" y2="33" gradientUnits="userSpaceOnUse">
          <stop stopColor="#ff2d78" /><stop offset="1" stopColor="#7c3aed" />
        </linearGradient>
      </defs>
    </svg>
  );
}