import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon } from '../../icons/NavIcons';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

export default function NotificationBadge() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAllRead, markRead } = useNotifications();
  const [showNotif, setShowNotif] = useState(false);
  const badgeRef = useRef(null);

  // Đóng bảng thông báo khi click ra ngoài
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (badgeRef.current && !badgeRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative w-full" ref={badgeRef}>
      {/* Nút Chuông & Chấm đỏ (Badge) */}
      <button
        onClick={() => setShowNotif(!showNotif)}
        className={`
          flex items-center gap-3.5 w-[calc(100%-16px)] mx-2 my-0.5 px-3 py-3
          rounded-lg border-none cursor-pointer transition-colors
          ${showNotif ? 'bg-primary/10' : 'bg-transparent hover:bg-white/5'}
        `}
      >
        <div className={`relative flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${showNotif ? 'bg-primary/15' : ''}`}>
          <BellIcon active={showNotif} />
          
          {/* Badge đếm số lượng thông báo */}
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-white text-[9px] w-4 h-4 rounded-full flex items-center justify-center font-bold shadow-[0_0_0_2px_#0a0a0f]">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </div>
        <span className={`font-body text-sm ${showNotif ? 'text-primary font-semibold' : 'text-text-secondary'}`}>
          Thông báo
        </span>
      </button>

      {/* Popup Bảng thông báo */}
      {showNotif && (
        <div className="absolute top-0 left-[calc(100%+8px)] w-[350px] h-[75vh] bg-[#111118] border border-border2 shadow-2xl rounded-xl z-50 overflow-hidden flex flex-col animate-slide-right">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border2 shrink-0">
             <h3 className="text-white font-bold font-body m-0 text-base">Thông báo</h3>
             <button 
                onClick={() => setShowNotif(false)} 
                className="text-text-secondary bg-transparent border-none cursor-pointer hover:text-white transition-colors"
             >
                ✕
             </button>
          </div>
          <div className="flex-1 overflow-y-auto">
             <NotificationPanel 
                notifications={notifications}
                loading={loading}
                unreadCount={unreadCount}
                onMarkAllRead={markAllRead}
                onItemClick={(notif) => {
                    markRead(notif.id);
                    // Đóng panel & Chuyển hướng khi click vào 1 thông báo
                    if (notif.meta?.videoId) {
                        setShowNotif(false);
                        navigate(`/video/${notif.meta.videoId}`); 
                    }
                }}
             />
          </div>
        </div>
      )}
    </div>
  );
}