import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../../services/authService';
import { getStoredUser } from '../../../utils/helpers';
import { ROUTES } from '../../../utils/constants';
import MenuItem from './MenuItem';
import {
  ProfileMenuIcon,
  LockMenuIcon,
  LogoutMenuIcon,
} from '../../../icons/CommonIcons';
import { ChevronIcon } from '../../../icons/NavIcons';

/**
 * UserDropdown
 *
 * placement = "topbar"  → avatar nhỏ, dropdown xuống dưới bên phải
 * placement = "sidebar" → row user info, dropdown bật lên trên
 */
export default function UserDropdown({ placement = 'topbar' }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const user = getStoredUser();

  /* Đóng khi click ra ngoài */
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Đóng khi nhấn Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleLogout = async () => {
    setOpen(false);
    await logout();
    navigate(ROUTES.LOGIN);
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

  /* ── Dropdown panel ─────────────────────────────────────── */
  const dropdownPanel = open && (
    <div
      className={`
        absolute z-50 w-[220px] bg-surface border border-border rounded-xl
        shadow-2xl overflow-hidden animate-fade-in
        ${placement === 'sidebar'
          ? 'bottom-[calc(100%+8px)] left-0'
          : 'top-[calc(100%+8px)] right-0'
        }
      `}
    >
      {/* User info header */}
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-[10px] font-bold text-white shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-white text-[13px] font-semibold font-body truncate m-0 leading-tight">
              {user?.fullName || 'Người dùng'}
            </p>
            <p className="text-text-faint text-[11px] font-body truncate m-0 leading-tight">
              @{user?.username || 'user'}
            </p>
          </div>
        </div>
      </div>

      {/* Menu */}
      <div className="py-1">
        <MenuItem
          icon={<ProfileMenuIcon />}
          label="Trang cá nhân"
          onClick={() => handleNavigate(ROUTES.PROFILE)}
        />
        <MenuItem
          icon={<LockMenuIcon />}
          label="Đổi mật khẩu"
          onClick={() => handleNavigate('/change-password')}
        />
      </div>

      <div className="h-px bg-border" />

      <div className="py-1">
        <MenuItem
          icon={<LogoutMenuIcon />}
          label="Đăng xuất"
          onClick={handleLogout}
          danger
        />
      </div>
    </div>
  );

  /* ── Sidebar placement ──────────────────────────────────── */
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
          <div
            className={`
              w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center
              text-[10px] font-bold text-white shrink-0 border-2 transition-all
              ${open ? 'border-primary' : 'border-transparent'}
            `}
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0 text-left">
            <p className="text-white text-[12px] font-semibold font-body truncate m-0 leading-tight">
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

  /* ── Topbar placement: chỉ hiện avatar tròn ────────────── */
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className={`
          w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center
          text-[11px] font-bold text-white border-2 transition-all cursor-pointer
          ${open
            ? 'border-primary shadow-[0_0_0_3px_rgba(255,45,120,0.2)]'
            : 'border-transparent hover:border-primary/50'
          }
        `}
        title={user?.fullName || 'Tài khoản'}
      >
        {initials}
      </button>
      {dropdownPanel}
    </div>
  );
}