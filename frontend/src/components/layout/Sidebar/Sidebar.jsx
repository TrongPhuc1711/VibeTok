import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';
import SidebarSearch from './SidebarSearch';
import SidebarNav from './SidebarNav';
import SidebarFollowing from './SidebarFollowing';
import SidebarFooter from './SidebarFooter';

export default function Sidebar({ className = '' }) {
  const navigate = useNavigate();

  return (
    <aside
      className={`flex flex-col h-screen w-60 min-w-60 bg-base border-r border-border sticky top-0 shrink-0 ${className}`}
    >
      {/* Logo */}
      <div
        className="px-5 py-[18px] border-b border-border cursor-pointer"
        onClick={() => navigate(ROUTES.HOME)}
      >
        <span className="font-display font-extrabold text-[28px] text-primary tracking-tight leading-none">
          VibeTok
        </span>
      </div>

      {/* Search */}
      <SidebarSearch />

      {/* Nav + Following */}
      <div className="flex-1 overflow-auto">
        <SidebarNav />
        <SidebarFollowing />
      </div>

      {/* Footer CTA */}
      <SidebarFooter />
    </aside>
  );
}