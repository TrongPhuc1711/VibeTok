import React from 'react';
import { BellIcon } from '../../icons/NavIcons';
import { useNotifications } from '../../hooks/useNotifications';

/*
NotificationBadge — nav item trong Sidebar
Chỉ hiển thị icon + badge đếm chưa đọc, delegate click lên PageLayout
PageLayout sẽ thu sidebar + hiện NotificationPagePanel
 */
export default function NotificationBadge({ onNotifClick, notifActive = false }) {
  const { unreadCount } = useNotifications();

  return (
    <button
      onClick={onNotifClick}
      className={`
        flex items-center gap-3.5 w-[calc(100%-16px)] mx-2 my-0.5 px-3 py-3
        rounded-lg border-none cursor-pointer transition-colors
        ${notifActive ? 'bg-primary/10' : 'bg-transparent hover:bg-white/5'}
      `}
    >
      {/* Icon + unread badge */}
      <div
        className={`
          relative flex items-center justify-center w-7 h-7 rounded-lg transition-colors
          ${notifActive ? 'bg-primary/15' : ''}
        `}
      >
        <BellIcon active={notifActive} />

        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-[0_0_0_2px_#0a0a0f]">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </div>

      {/* Label */}
      <span
        className={`font-body text-sm ${
          notifActive ? 'text-primary font-semibold' : 'text-text-secondary'
        }`}
      >
        Thông báo
      </span>
    </button>
  );
}