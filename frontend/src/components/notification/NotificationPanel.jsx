import React from 'react';
import NotificationItem from './NotificationItem';
import { SpinnerCenter } from '../../components/ui/Spinner';

export default function NotificationPanel({ notifications, loading, unreadCount, onMarkAllRead, onItemClick }) {
  if (loading) return <SpinnerCenter size="sm" />;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {unreadCount > 0 && (
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[#1a1a2a] shrink-0">
          <span className="text-[#555] text-[11px] font-body">
            {unreadCount} chưa đọc
          </span>
          <button
            onClick={onMarkAllRead}
            className="text-primary text-[11px] font-body bg-transparent border-none cursor-pointer hover:underline"
          >
            Đánh dấu tất cả đã đọc
          </button>
        </div>
      )}

      {/* List */}
      <div className="flex-1 overflow-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-2 text-[#444]">
            <p className="text-[12px] font-body">Chưa có thông báo nào</p>
          </div>
        ) : (
          notifications.map(n => (
            <NotificationItem
              key={n.id}
              notif={n}
              onClick={onItemClick}
            />
          ))
        )}
      </div>
    </div>
  );
}