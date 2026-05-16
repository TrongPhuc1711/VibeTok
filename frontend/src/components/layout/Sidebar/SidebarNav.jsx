import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';
import { NotificationBadge } from '../../notification';
import { useUnreadMessageCount } from '../../../hooks/useMessages';
import { useAuth } from '../../../hooks/useAuth';
import {
  HomeIcon, CompassIcon, UsersIcon, UploadIcon, UserIcon, MessageIcon
} from '../../../icons/NavIcons';

export default function SidebarNav({ onNotifClick, notifActive = false }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { unreadCount } = useUnreadMessageCount();
  const { isAuthenticated } = useAuth();

  const NAV = [
    { path: ROUTES.HOME, label: 'Đề xuất', Icon: HomeIcon },
    { path: ROUTES.EXPLORE, label: 'Khám phá', Icon: CompassIcon },
    { path: ROUTES.FOLLOWING, label: 'Đã follow', Icon: UsersIcon },
    { path: ROUTES.UPLOAD, label: 'Tải lên', Icon: UploadIcon },
    { path: ROUTES.PROFILE, label: 'Hồ sơ', Icon: UserIcon },
    { path: ROUTES.MESSAGE, label: 'Tin nhắn', Icon: MessageIcon },

  ];

  return (
    <nav className="py-1.5">
      {NAV.map(({ path, label, Icon }) => {
        const active = pathname === path;
        const isMessageItem = path === ROUTES.MESSAGE;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`
              flex items-center gap-3.5 w-[calc(100%-16px)] mx-2 my-0.5 px-3 py-3
              rounded-lg border-none cursor-pointer transition-colors
              ${active ? 'bg-primary/10' : 'bg-transparent'}
            `}
            style={{ ':hover': { background: active ? undefined : 'var(--vt-hover)' } }}
            onMouseEnter={(e) => { if (!active) e.currentTarget.style.background = 'var(--vt-hover)'; }}
            onMouseLeave={(e) => { if (!active) e.currentTarget.style.background = 'transparent'; }}
          >
            <div
              className={`relative flex items-center justify-center w-7 h-7 rounded-lg transition-colors
                ${active ? 'bg-primary/15' : ''}`}
            >
              <Icon active={active} />
              {isMessageItem && unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold"
                  style={{ boxShadow: 'var(--vt-badge-shadow)' }}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </div>
            <span
              className={`font-body text-sm ${active ? 'text-primary font-semibold' : ''}`}
              style={!active ? { color: 'var(--vt-text-bright)' } : {}}
            >
              {label}
            </span>
          </button>
        );
      })}

      {/* Notification item - chỉ hiện khi đã đăng nhập */}
      {isAuthenticated && (
        <NotificationBadge onNotifClick={onNotifClick} notifActive={notifActive} />
      )}
    </nav>
  );
}