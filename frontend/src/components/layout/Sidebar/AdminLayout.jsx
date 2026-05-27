import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { BellAdminIcon, SearchAdminIcon } from '../../../icons/AdminIcons';
import { useAuthContext } from '../../../contexts/AuthContext';
import ThemeToggle from '../../ui/ThemeToggle';
import Avatar from '../../common/Avatar/avatar';

export default function AdminLayout({ title, subtitle, actions, children }) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const initials = user?.initials || user?.fullName?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--color-base)' }}>
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3.5 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border)', background: 'var(--color-base)' }}>
          <div>
            <h1 className="font-display font-bold text-[18px] m-0 leading-tight" style={{ color: 'var(--color-text-primary)' }}>{title}</h1>
            {subtitle && <p className="text-[11px] font-body mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{subtitle}</p>}
          </div>
          <div className="flex items-center gap-3">
            {actions}
            {/* Home button */}
            <button
              id="admin-home-btn"
              onClick={() => navigate('/')}
              title="Về trang chủ"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-body font-medium cursor-pointer transition-all duration-200 border"
              style={{
                background: 'rgba(255, 45, 120, 0.08)',
                borderColor: 'rgba(255, 45, 120, 0.25)',
                color: '#ff2d78',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255, 45, 120, 0.15)';
                e.currentTarget.style.borderColor = 'rgba(255, 45, 120, 0.5)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255, 45, 120, 0.08)';
                e.currentTarget.style.borderColor = 'rgba(255, 45, 120, 0.25)';
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                <polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Trang chủ
            </button>

            {/* Theme Toggle */}
            <ThemeToggle size="sm" />

            {/* Search */}
            <div className="flex items-center gap-2 rounded-lg px-3 py-1.5 w-[180px]"
              style={{ background: 'var(--vt-input)', border: '1px solid var(--color-border)' }}>
              <SearchAdminIcon />
              <input type="text" placeholder="Tìm kiếm..."
                className="bg-transparent border-none outline-none text-xs font-body w-full"
                style={{ color: 'var(--color-text-primary)' }} />
            </div>

            {/* Bell */}
            <button className="relative w-8 h-8 flex items-center justify-center rounded-lg cursor-pointer transition-colors"
              style={{ background: 'var(--vt-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }}>
              <BellAdminIcon />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[8px] text-white font-bold flex items-center justify-center">3</span>
            </button>

            {/* Avatar */}
            <Avatar
              user={user}
              className="!w-8 !h-8 !text-[10px]"
            />
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}