import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  DashIcon, ChartLineIcon, UsersAdminIcon, VideoAdminIcon,
  FlagAdminIcon, ShieldAdminIcon, SettingsAdminIcon,
} from '../../../icons/AdminIcons';

const NAV = [
  { path:'/admin',              label:'Dashboard',  Icon:DashIcon,          badge:null },
  { path:'/admin/analytics',    label:'Analytics',  Icon:ChartLineIcon,     badge:null },
  { path:'/admin/users',        label:'Người dùng', Icon:UsersAdminIcon,    badge:'5.1K' },
  { path:'/admin/videos',       label:'Video',      Icon:VideoAdminIcon,    badge:'174' },
  { path:'/admin/reports',      label:'Báo cáo',    Icon:FlagAdminIcon,     badge:'180', danger:true },
  { path:'/admin/moderation',   label:'Kiểm duyệt', Icon:ShieldAdminIcon,   badge:'89',  danger:true },
  { path:'/admin/settings',     label:'Cài đặt',    Icon:SettingsAdminIcon, badge:null },
];

export default function AdminSidebar() {
  const navigate     = useNavigate();
  const { pathname } = useLocation();

  return (
    <aside className="flex flex-col h-screen w-[120px] min-w-[120px] bg-[#08080f] border-r border-[#1a1a2a] sticky top-0 shrink-0">
      {/* Logo */}
      <div className="flex flex-col items-center py-4 border-b border-[#1a1a2a] gap-0.5 cursor-pointer"
        onClick={() => navigate('/admin')}>
        <span className="font-display font-extrabold text-[17px] text-primary tracking-tight leading-none">VibeTok</span>
        <span className="text-[9px] font-body text-primary/50 tracking-[1.5px] uppercase">Admin</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-auto py-2">
        {NAV.map(({ path, label, Icon, badge, danger }) => {
          const active = pathname === path || (path !== '/admin' && pathname.startsWith(path));
          return (
            <button key={path} onClick={() => navigate(path)}
              className={`relative flex flex-col items-center gap-1.5 w-full px-2 py-3 border-none cursor-pointer transition-all
                ${active ? 'bg-primary/10 text-primary' : 'bg-transparent text-[#555] hover:text-[#888] hover:bg-white/[0.03]'}`}>
              {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-primary rounded-r-full" />}
              <div className="relative">
                <Icon active={active} />
                {badge && (
                  <span className={`absolute -top-1.5 -right-2.5 text-[8px] font-bold px-1 py-px rounded-full leading-none
                    ${danger ? 'bg-red-500/90 text-white' : 'bg-[#1e1e2e] text-[#888]'}`}>
                    {badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-body font-medium ${active ? 'text-primary' : ''}`}>{label}</span>
            </button>
          );
        })}
      </nav>

      {/* Footer user */}
      <div className="border-t border-[#1a1a2a] p-3 flex flex-col items-center gap-1">
        <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-[10px] font-bold text-white">SA</div>
        <p className="text-[10px] font-body text-[#555] leading-tight text-center">Super Admin</p>
        <p className="text-[9px] font-body text-[#333] leading-tight truncate max-w-full">admin@vibetok.vn</p>
      </div>
    </aside>
  );
}