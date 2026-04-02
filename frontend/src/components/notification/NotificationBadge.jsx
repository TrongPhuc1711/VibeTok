import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { BellIcon } from '../../icons/NavIcons';
import { useNotifications } from '../../hooks/useNotifications';
import NotificationPanel from './NotificationPanel';

export default function NotificationBadge() {
  const navigate = useNavigate();
  const { notifications, unreadCount, loading, markAllRead, markRead } = useNotifications();
  const [showNotif, setShowNotif] = useState(false);
  const [panelPos, setPanelPos]   = useState({ top: 0, left: 0 });
  const wrapRef = useRef(null);
  const btnRef  = useRef(null);

  /* Đóng khi click ra ngoài */
  useEffect(() => {
    const handler = (e) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target)) {
        setShowNotif(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  /* Đóng khi nhấn Escape */
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') setShowNotif(false); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleToggle = () => {
    if (!showNotif && btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setPanelPos({ top: rect.top, left: rect.right + 8 });
    }
    setShowNotif(s => !s);
  };

  return (
    <div className="relative w-full" ref={wrapRef}>
      {/* ── Nút chuông ── */}
      <button
        ref={btnRef}
        onClick={handleToggle}
        className={`
          flex items-center gap-3.5 w-[calc(100%-16px)] mx-2 my-0.5 px-3 py-3
          rounded-lg border-none cursor-pointer transition-colors
          ${showNotif ? 'bg-primary/10' : 'bg-transparent hover:bg-white/5'}
        `}
      >
        <div
          className={`
            relative flex items-center justify-center w-7 h-7 rounded-lg transition-colors
            ${showNotif ? 'bg-primary/15' : ''}
          `}
        >
          <BellIcon active={showNotif} />

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

      {/* ── Panel — dùng fixed để thoát khỏi overflow của sidebar ── */}
      {showNotif && (
        <div
          className="fixed w-[350px] bg-[#111118] border border-border2 shadow-2xl rounded-xl z-[9999] flex flex-col animate-slide-right overflow-hidden"
          style={{
            top:       panelPos.top,
            left:      panelPos.left,
            height:    '75vh',
            maxHeight: 'calc(100vh - 32px)',
          }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-border2 shrink-0">
            <h3 className="text-white font-bold font-body m-0 text-base">Thông báo</h3>
            <button
              onClick={() => setShowNotif(false)}
              className="text-text-secondary bg-transparent border-none cursor-pointer hover:text-white transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            <NotificationPanel
              notifications={notifications}
              loading={loading}
              unreadCount={unreadCount}
              onMarkAllRead={markAllRead}
              onItemClick={(notif) => {
                markRead(notif.id);
                setShowNotif(false);
                if (notif.meta?.videoId) {
                  navigate('/');          // về feed (app chưa có route /video/:id)
                }
              }}
            />
          </div>
        </div>
      )}
    </div>
  );
}