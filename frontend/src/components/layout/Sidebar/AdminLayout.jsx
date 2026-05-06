import React from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSidebar from './AdminSidebar';
import { BellAdminIcon, SearchAdminIcon } from '../../../icons/AdminIcons';
import { useAuthContext } from '../../../contexts/AuthContext';

export default function AdminLayout({ title, subtitle, actions, children }) {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const initials = user?.initials || user?.fullName?.charAt(0)?.toUpperCase() || 'A';

  return (
    <div className="flex h-screen overflow-hidden bg-[#0a0a12]">
      <AdminSidebar />

      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Topbar */}
        <header className="flex items-center justify-between px-6 py-3.5 border-b border-[#1a1a2a] bg-[#0a0a12] shrink-0">
          <div>
            <h1 className="font-display font-bold text-[18px] text-white m-0 leading-tight">{title}</h1>
            {subtitle && <p className="text-[#555] text-[11px] font-body mt-0.5">{subtitle}</p>}
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
            {/* Search */}
            <div className="flex items-center gap-2 bg-[#111120] border border-[#1e1e2e] rounded-lg px-3 py-1.5 w-[180px]">
              <SearchAdminIcon />
              <input type="text" placeholder="Tìm kiếm..."
                className="bg-transparent border-none outline-none text-white text-xs font-body w-full placeholder:text-[#444]" />
            </div>
            {/* Bell */}
            <button className="relative w-8 h-8 flex items-center justify-center bg-[#111120] border border-[#1e1e2e] rounded-lg cursor-pointer hover:border-primary/40 transition-colors">
              <BellAdminIcon />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary rounded-full text-[8px] text-white font-bold flex items-center justify-center">3</span>
            </button>
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-[10px] font-bold text-white cursor-pointer overflow-hidden">
              {user?.anh_dai_dien
                ? <img src={user.anh_dai_dien} alt="" className="w-full h-full object-cover" />
                : initials
              }
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}