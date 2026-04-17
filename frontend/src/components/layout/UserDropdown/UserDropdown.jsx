import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../services/authService';
import { ROUTES } from '../../../utils/constants';
import MenuItem from './MenuItem';
import {
  ProfileMenuIcon,
  LockMenuIcon,
  LogoutMenuIcon,
} from '../../../icons/CommonIcons';
import { ChevronIcon } from '../../../icons/NavIcons';
import { useToast } from '../../ui/Toast';
import { useTheme } from '../../../contexts/ThemeContext';
import { useAuthContext } from '../../../contexts/AuthContext';

export default function UserDropdown({ placement = 'topbar' }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const { showInfo } = useToast();
  const { isDark, toggleTheme } = useTheme();
  // ✅ FIX: Lấy user từ AuthContext thay vì getStoredUser() tĩnh
  const { user, logout: contextLogout } = useAuthContext();

  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    showInfo('Đang đăng xuất...', 'Hẹn gặp lại bạn sớm!');
    await logout();
    // ✅ FIX: Cập nhật AuthContext để sidebar re-render về trạng thái chưa login
    contextLogout();
    setTimeout(() => navigate(ROUTES.LOGIN), 600);
  };

  const handleNavigate = (path) => {
    setOpen(false);
    navigate(path);
  };

  const initials =
    user?.initials ||
    user?.fullName
      ?.split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ||
    'U';

  const imgSrc = user?.anh_dai_dien || user?.avatar || null;

  const AvatarCircle = ({ size = 'md', showBorder = false }) => {
    const sizeClass = size === 'sm'
      ? 'w-8 h-8 text-[10px]'
      : 'w-9 h-9 text-[11px]';

    return (
      <div
        className={`
          ${sizeClass} rounded-full bg-brand-gradient flex items-center justify-center
          font-bold text-white overflow-hidden shrink-0 transition-all
          ${showBorder ? (open ? 'border-2 border-primary shadow-[0_0_0_3px_rgba(255,45,120,0.2)]' : 'border-2 border-transparent hover:border-primary/50') : ''}
        `}
      >
        {imgSrc ? (
          <img src={imgSrc} alt={user?.fullName || 'avatar'} className="w-full h-full object-cover" />
        ) : (
          initials
        )}
      </div>
    );
  };

  const ThemeItem = () => (
    <button
      onClick={() => { toggleTheme(); }}
      className={`
        w-full flex items-center gap-3 px-4 py-2.5
        border-none cursor-pointer transition-colors text-left
        ${isDark
          ? 'bg-transparent text-text-secondary hover:bg-white/5 hover:text-white'
          : 'bg-transparent text-[#333] hover:bg-black/5 hover:text-black'
        }
      `}
    >
      <span className="shrink-0 text-text-faint">
        {isDark ? <SunMenuIcon /> : <MoonMenuIcon />}
      </span>
      <span className="text-[13px] font-body font-medium">
        {isDark ? 'Light Mode' : 'Dark Mode'}
      </span>
      <div className="ml-auto">
        <div
          className={`
            relative w-9 h-5 rounded-full transition-colors duration-200
            ${isDark ? 'bg-[#2a2a3e]' : 'bg-primary/20'}
          `}
        >
          <div
            className={`
              absolute top-0.5 w-4 h-4 rounded-full transition-all duration-200
              ${isDark
                ? 'left-0.5 bg-[#555]'
                : 'left-[18px] bg-primary'
              }
            `}
          />
        </div>
      </div>
    </button>
  );

  const dropdownPanel = open && (
    <div
      className={`
        absolute z-50 w-[220px] border rounded-xl
        shadow-2xl overflow-hidden animate-fade-in
        ${isDark
          ? 'bg-surface border-border'
          : 'bg-white border-[#e2e2ee] shadow-[0_8px_32px_rgba(0,0,0,0.12)]'
        }
        ${placement === 'sidebar'
          ? 'bottom-[calc(100%+8px)] left-0'
          : 'top-[calc(100%+8px)] right-0'
        }
      `}
    >
      <div className={`px-4 py-3 border-b ${isDark ? 'border-border' : 'border-[#e2e2ee]'}`}>
        <div className="flex items-center gap-2.5">
          <AvatarCircle size="sm" />
          <div className="min-w-0">
            <p className={`text-[13px] font-semibold font-body truncate m-0 leading-tight ${isDark ? 'text-white' : 'text-[#0a0a0f]'}`}>
              {user?.fullName || 'Người dùng'}
            </p>
            <p className="text-text-faint text-[11px] font-body truncate m-0 leading-tight">
              @{user?.username || 'user'}
            </p>
          </div>
        </div>
      </div>

      <div className="py-1">
        <MenuItem icon={<ProfileMenuIcon />} label="Trang cá nhân" onClick={() => handleNavigate(ROUTES.PROFILE)} />
        <MenuItem icon={<LockMenuIcon />} label="Đổi mật khẩu" onClick={() => handleNavigate('/change-password')} />
      </div>

      <div className={`h-px ${isDark ? 'bg-border' : 'bg-[#e2e2ee]'}`} />

      <div className="py-1">
        <ThemeItem />
      </div>

      <div className={`h-px ${isDark ? 'bg-border' : 'bg-[#e2e2ee]'}`} />

      <div className="py-1">
        <MenuItem icon={<LogoutMenuIcon />} label="Đăng xuất" onClick={handleLogout} danger />
      </div>
    </div>
  );

  if (placement === 'sidebar') {
    return (
      <div ref={ref} className="relative w-full">
        <button
          onClick={() => setOpen((o) => !o)}
          className={`
            w-full flex items-center gap-2.5 px-1 py-2 rounded-lg
            border-none bg-transparent cursor-pointer transition-colors
            ${open ? 'bg-white/5' : 'hover:bg-white/5'}
          `}
        >
          <div className={`w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-[10px] font-bold text-white shrink-0 border-2 transition-all overflow-hidden ${open ? 'border-primary' : 'border-transparent'}`}>
            {imgSrc
              ? <img src={imgSrc} alt={user?.fullName || 'avatar'} className="w-full h-full object-cover" />
              : initials
            }
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className={`text-[12px] font-semibold font-body truncate m-0 leading-tight ${isDark ? 'text-white' : 'text-[#0a0a0f]'}`}>
              {user?.fullName || 'Người dùng'}
            </p>
            <p className="text-text-faint text-[11px] font-body truncate m-0 leading-tight">
              @{user?.username || 'user'}
            </p>
          </div>
          <ChevronIcon open={open} />
        </button>
        {dropdownPanel}
      </div>
    );
  }

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="cursor-pointer border-none p-0 bg-transparent"
        title={user?.fullName || 'Tài khoản'}
      >
        <AvatarCircle size="lg" showBorder />
      </button>
      {dropdownPanel}
    </div>
  );
}

function SunMenuIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
    </svg>
  );
}

function MoonMenuIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="1.8" strokeLinecap="round">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
    </svg>
  );
}