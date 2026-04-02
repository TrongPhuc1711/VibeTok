import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';
import {
  HomeIcon,
  CompassIcon,
  UsersIcon,
  UploadIcon,
  UserIcon,
  BellIcon,
  PlusIcon,
} from '../../../icons/NavIcons';
import SidebarSearch from './SidebarSearch';
import SidebarNav from './SidebarNav';
import SidebarFollowing from './SidebarFollowing';
import SidebarFooter from './SidebarFooter';

/* ─── Collapsed (icon-only) sidebar ─── */
function CollapsedSidebar({ onNotifClick, notifActive }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  const NAV_ITEMS = [
    { path: ROUTES.HOME, Icon: HomeIcon },
    { path: ROUTES.EXPLORE, Icon: CompassIcon },
    { path: ROUTES.FOLLOWING, Icon: UsersIcon },
    { path: ROUTES.UPLOAD, Icon: UploadIcon },
    { path: ROUTES.PROFILE, Icon: UserIcon },
  ];

  return (
    <aside className="flex flex-col h-screen bg-base border-r border-border sticky top-0 shrink-0 transition-all duration-300"
      style={{ width: 72 }}>

      {/* Logo */}
      <div
        className="flex items-center justify-center py-[18px] border-b border-border cursor-pointer"
        onClick={() => navigate(ROUTES.HOME)}
      >
        <span className="font-display font-extrabold text-[22px] text-primary leading-none">V</span>
      </div>

      {/* Icon nav */}
      <nav className="flex-1 py-2 flex flex-col items-center">
        {NAV_ITEMS.map(({ path, Icon }) => {
          const active = pathname === path;
          return (
            <button
              key={path}
              onClick={() => navigate(path)}
              className={`flex items-center justify-center w-11 h-11 mx-auto my-1 rounded-xl border-none cursor-pointer transition-colors
                ${active ? 'bg-primary/10' : 'bg-transparent hover:bg-white/5'}`}
            >
              <Icon active={active} />
            </button>
          );
        })}

        {/* Bell */}
        <button
          onClick={onNotifClick}
          className={`relative flex items-center justify-center w-11 h-11 mx-auto my-1 rounded-xl border-none cursor-pointer transition-colors
            ${notifActive ? 'bg-primary/10' : 'bg-transparent hover:bg-white/5'}`}
        >
          <BellIcon active={notifActive} />
        </button>
      </nav>

      {/* Upload shortcut */}
      <div className="p-3 border-t border-border flex justify-center">
        <button
          onClick={() => navigate(ROUTES.UPLOAD)}
          className="w-11 h-11 flex items-center justify-center bg-primary/10 border border-primary/30 rounded-lg text-primary cursor-pointer hover:bg-primary/20 transition-colors"
        >
          <PlusIcon size={14} />
        </button>
      </div>
    </aside>
  );
}

/* ─── Full sidebar ─── */
export default function Sidebar({ className = '', collapsed = false, onNotifClick, notifActive = false }) {
  const navigate = useNavigate();

  if (collapsed) {
    return (
      <CollapsedSidebar onNotifClick={onNotifClick} notifActive={notifActive} />
    );
  }

  return (
    <aside
      className={`flex flex-col h-screen w-60 min-w-60 bg-base border-r border-border sticky top-0 shrink-0 transition-all duration-300 ${className}`}
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
        <SidebarNav onNotifClick={onNotifClick} notifActive={notifActive} />
        <SidebarFollowing />
      </div>

      {/* Footer */}
      <SidebarFooter />
    </aside>
  );
}