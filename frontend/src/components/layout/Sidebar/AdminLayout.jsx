import React from 'react';
import AdminSidebar from './AdminSidebar';
import { BellAdminIcon, SearchAdminIcon } from '../../../icons/AdminIcons';

/*
AdminLayout — wrapper layout cho tất cả admin pages
Props: title, subtitle, actions, children
 */
export default function AdminLayout({ title, subtitle, actions, children }) {
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
            <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-[10px] font-bold text-white cursor-pointer">SA</div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}