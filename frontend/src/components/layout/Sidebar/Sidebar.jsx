import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';
import {
  HomeIcon,
  CompassIcon,
  UsersIcon,
  UploadIcon,
  UserIcon,
  BellIcon,
  PlusIcon,
  MessageIcon,
} from '../../../icons/NavIcons';
import SidebarSearch from './SidebarSearch';
import SidebarNav from './SidebarNav';
import SidebarFollowing from './SidebarFollowing';
import SidebarFooter from './SidebarFooter';
import { useNotifications } from '../../../hooks/useNotifications';
// ✅ FIX: useAuth -> AuthContext -> reactive
import { useAuth } from '../../../hooks/useAuth';

/* Collapsed (icon-only) sidebar */
function CollapsedSidebar({ onNotifClick, notifActive }) {
  const navigate = useNavigate();
  const { unreadCount } = useNotifications();
  // ✅ Reactive auth state
  const { isAuthenticated } = useAuth();

  const NAV_ITEMS = [
    { path: ROUTES.HOME, Icon: HomeIcon },
    { path: ROUTES.EXPLORE, Icon: CompassIcon },
    { path: ROUTES.FOLLOWING, Icon: UsersIcon },
    ...(isAuthenticated ? [
      { path: ROUTES.UPLOAD, Icon: UploadIcon },
      { path: ROUTES.PROFILE, Icon: UserIcon },
      { path: ROUTES.MESSAGE, Icon: MessageIcon }
    ] : [])
  ];

  return (
    <aside
      className="flex flex-col h-screen bg-base border-r border-border sticky top-0 shrink-0 transition-all duration-300"
      style={{ width: 72 }}
    >
      <div
        className="flex items-center justify-center py-[18px] border-b border-border cursor-pointer"
        onClick={() => navigate(ROUTES.HOME)}
      >
        <span className="font-display font-extrabold text-[22px] text-primary leading-none">V</span>
      </div>

      <nav className="flex-1 py-2 flex flex-col items-center">
        {NAV_ITEMS.map(({ path, Icon }) => {
          const active = !notifActive && window.location.pathname === path;
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

        {isAuthenticated && (
          <button
            onClick={onNotifClick}
            className={`relative flex items-center justify-center w-11 h-11 mx-auto my-1 rounded-xl border-none cursor-pointer transition-colors
              ${notifActive ? 'bg-primary/10' : 'bg-transparent hover:bg-white/5'}`}
          >
            <BellIcon active={notifActive} />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 bg-primary text-white text-[8px] w-3.5 h-3.5 rounded-full flex items-center justify-center font-bold shadow-[0_0_0_1.5px_#0a0a0f]">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </button>
        )}
      </nav>

      {isAuthenticated && (
        <div className="p-3 border-t border-border flex justify-center">
          <button
            onClick={() => navigate(ROUTES.UPLOAD)}
            className="w-11 h-11 flex items-center justify-center bg-primary/10 border border-primary/30 rounded-lg text-primary cursor-pointer hover:bg-primary/20 transition-colors"
          >
            <PlusIcon size={14} />
          </button>
        </div>
      )}
    </aside>
  );
}

/* Full sidebar */
export default function Sidebar({ className = '', collapsed = false, onNotifClick, notifActive = false }) {
  const navigate = useNavigate();
  // ✅ Reactive auth state từ AuthContext
  const { isAuthenticated } = useAuth();

  if (collapsed) {
    return (
      <CollapsedSidebar onNotifClick={onNotifClick} notifActive={notifActive} />
    );
  }

  return (
    <aside
      className={`flex flex-col h-screen w-60 min-w-60 bg-base border-r border-border sticky top-0 shrink-0 transition-all duration-300 ${className}`}
    >
      <div
        className="px-5 py-[18px] border-b border-border cursor-pointer"
        onClick={() => navigate(ROUTES.HOME)}
      >
        <span className="font-display font-extrabold text-[28px] text-primary tracking-tight leading-none">
          VibeTok
        </span>
      </div>

      <SidebarSearch />

      <div className="flex-1 overflow-auto flex flex-col">
        <SidebarNav onNotifClick={onNotifClick} notifActive={notifActive} />

        {/* Hiển thị nút login khi chưa đăng nhập */}
        {!isAuthenticated && (
          <div className="px-5 py-4 border-t border-border mt-1">
            <p className="text-[14px] text-text-secondary leading-relaxed mb-4 font-body">
              Đăng nhập để follow các tác giả, thích video và xem bình luận.
            </p>
            <button
              onClick={() => navigate(ROUTES.LOGIN)}
              className="w-full h-12 bg-transparent border border-primary text-primary font-bold rounded-lg hover:bg-primary/5 transition-colors text-[15px]"
            >
              Đăng nhập
            </button>
          </div>
        )}

        {/* Hiển thị following list khi đã đăng nhập */}
        {isAuthenticated && <SidebarFollowing />}
      </div>

      {/* Footer chỉ hiện khi đã đăng nhập */}
      {isAuthenticated && <SidebarFooter />}
    </aside>
  );
}