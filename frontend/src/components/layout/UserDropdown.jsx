import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { logout } from '../../services/authService';
import { getStoredUser } from '../../utils/helpers';
import { ROUTES } from '../../utils/constants';

/*
  placement = "topbar"  → avatar nhỏ góc phải, dropdown xuống dưới bên phải
  placement = "sidebar" → hiển thị row user info, dropdown bật lên trên
 */
export default function UserDropdown({ placement = 'topbar' }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref  = useRef(null);
  const user = getStoredUser();

  // Đóng khi click ra ngoài
  useEffect(() => {
    const handler = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // Đóng khi nhấn Escape
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

  const initials = user?.initials
    || user?.fullName?.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    || 'U';

  //Dropdown panel (dùng chung cho cả hai placement)
  const dropdownPanel = open && (
    <div
      className={`absolute z-50 w-[220px] bg-surface border border-border rounded-xl shadow-2xl overflow-hidden animate-fade-in
        ${placement === 'sidebar'
          ? 'bottom-[calc(100%+8px)] left-0'   // bật LÊN, căn trái
          : 'top-[calc(100%+8px)] right-0'      // bật XUỐNG, căn phải
        }`}
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

      {/* Menu items */}
      <div className="py-1">
        <MenuItem
          icon={<ProfileIcon />}
          label="Trang cá nhân"
          onClick={() => handleNavigate(ROUTES.PROFILE)}
        />
        <MenuItem
          icon={<LockIcon />}
          label="Đổi mật khẩu"
          onClick={() => handleNavigate('/change-password')}
        />
      </div>

      {/* Divider */}
      <div className="h-px bg-border" />

      {/* Logout */}
      <div className="py-1">
        <MenuItem
          icon={<LogoutIcon />}
          label="Đăng xuất"
          onClick={handleLogout}
          danger
        />
      </div>
    </div>
  );

  //Sidebar placement: hiện row user info + chevron
  if (placement === 'sidebar') {
    return (
      <div ref={ref} className="relative w-full">
        <button
          onClick={() => setOpen(o => !o)}
          className={`w-full flex items-center gap-2.5 px-1 py-2 rounded-lg border-none bg-transparent cursor-pointer transition-colors
            ${open ? 'bg-white/5' : 'hover:bg-white/5'}`}
        >
          <div className={`w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-[10px] font-bold text-white shrink-0 border-2 transition-all
            ${open ? 'border-primary' : 'border-transparent'}`}>
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

  //chỉ hiện avatar tròn 
  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-[11px] font-bold text-white border-2 transition-all cursor-pointer
          ${open
            ? 'border-primary shadow-[0_0_0_3px_rgba(255,45,120,0.2)]'
            : 'border-transparent hover:border-primary/50'
          }`}
        title={user?.fullName || 'Tài khoản'}
      >
        {initials}
      </button>
      {dropdownPanel}
    </div>
  );
}

//Sub-components

function MenuItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-2.5 border-none bg-transparent cursor-pointer transition-colors text-left
        ${danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-text-secondary hover:bg-white/5 hover:text-white'
        }`}
    >
      <span className={`shrink-0 ${danger ? 'text-red-400' : 'text-text-faint'}`}>
        {icon}
      </span>
      <span className="text-[13px] font-body font-medium">{label}</span>
    </button>
  );
}

function ChevronIcon({ open }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 12 12" fill="none"
      stroke="#555" strokeWidth="1.3" strokeLinecap="round"
      className={`shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
    >
      <path d="M2 4.5L6 8L10 4.5" />
    </svg>
  );
}

// Icons
function ProfileIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <circle cx="7.5" cy="4.5" r="2.5" />
      <path d="M1.5 13.5C1.5 10.74 4.24 8.5 7.5 8.5C10.76 8.5 13.5 10.74 13.5 13.5" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round">
      <rect x="2.5" y="6.5" width="10" height="8" rx="1.5" />
      <path d="M4.5 6.5V4.5a3 3 0 016 0v2" />
      <circle cx="7.5" cy="10.5" r="1" fill="currentColor" />
    </svg>
  );
}

function LogoutIcon() {
  return (
    <svg width="15" height="15" viewBox="0 0 15 15" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5.5 13H3a1 1 0 01-1-1V3a1 1 0 011-1h2.5" />
      <path d="M10 10.5L13 7.5L10 4.5" />
      <path d="M13 7.5H5.5" />
    </svg>
  );
}