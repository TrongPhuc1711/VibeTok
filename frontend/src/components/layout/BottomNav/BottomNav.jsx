import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';
import { useNotifications } from '../../../hooks/useNotifications';
import { useUnreadMessageCount } from '../../../hooks/useMessages';

export default function BottomNav({ onNotifClick, notifActive = false }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { unreadCount: notifCount } = useNotifications();
  const { unreadCount: msgCount } = useUnreadMessageCount();

  const isActive = (path) => pathname === path;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around"
      style={{
        background: 'rgba(10,10,15,0.96)',
        backdropFilter: 'blur(20px)',
        borderTop: '1px solid rgba(255,255,255,0.07)',
        paddingBottom: 'env(safe-area-inset-bottom)',
        height: 'calc(56px + env(safe-area-inset-bottom))',
      }}
    >
      {/* Home */}
      <NavBtn
        active={isActive(ROUTES.HOME)}
        onClick={() => navigate(ROUTES.HOME)}
        label="Trang chủ"
        icon={<HomeIcon active={isActive(ROUTES.HOME)} />}
      />

      {/* Explore */}
      <NavBtn
        active={isActive(ROUTES.EXPLORE)}
        onClick={() => navigate(ROUTES.EXPLORE)}
        label="Khám phá"
        icon={<ExploreIcon active={isActive(ROUTES.EXPLORE)} />}
      />

      {/* Upload - Center button */}
      <button
        onClick={() => navigate(ROUTES.UPLOAD)}
        className="flex flex-col items-center gap-0.5 border-none bg-transparent cursor-pointer"
        style={{ WebkitTapHighlightColor: 'transparent' }}
      >
        <div
          className="flex items-center justify-center rounded-xl"
          style={{
            width: 42,
            height: 30,
            background: 'linear-gradient(135deg, #ff2d78, #ff6b35)',
            boxShadow: '0 0 14px rgba(255,45,120,0.4)',
          }}
        >
          <PlusIcon />
        </div>
        <span style={{ fontSize: 9, color: '#888', fontFamily: 'DM Sans, sans-serif' }}>Đăng</span>
      </button>

      {/* Messages */}
      <NavBtn
        active={isActive(ROUTES.MESSAGE)}
        onClick={() => navigate(ROUTES.MESSAGE)}
        label="Inbox"
        badge={msgCount}
        icon={<MsgIcon active={isActive(ROUTES.MESSAGE)} />}
      />

      {/* Notifications / Profile - tap to toggle notif panel */}
      <NavBtn
        active={notifActive || isActive(ROUTES.PROFILE)}
        onClick={() => {
          if (notifActive) {
            onNotifClick?.();
          } else {
            navigate(ROUTES.PROFILE);
          }
        }}
        onLongPress={onNotifClick}
        label="Hồ sơ"
        badge={notifCount}
        icon={<ProfileIcon active={isActive(ROUTES.PROFILE) || notifActive} />}
      />
    </nav>
  );
}

function NavBtn({ active, onClick, label, icon, badge, onLongPress }) {
  let pressTimer;
  const handlePressStart = () => {
    if (onLongPress) {
      pressTimer = setTimeout(() => onLongPress(), 500);
    }
  };
  const handlePressEnd = () => {
    clearTimeout(pressTimer);
  };

  return (
    <button
      onClick={onClick}
      onTouchStart={handlePressStart}
      onTouchEnd={handlePressEnd}
      onMouseDown={handlePressStart}
      onMouseUp={handlePressEnd}
      className="relative flex flex-col items-center gap-0.5 border-none bg-transparent cursor-pointer px-3 py-2"
      style={{ WebkitTapHighlightColor: 'transparent', minWidth: 48 }}
    >
      <div className="relative">
        {icon}
        {badge > 0 && (
          <span
            className="absolute flex items-center justify-center font-bold text-white"
            style={{
              top: -4,
              right: -6,
              minWidth: 14,
              height: 14,
              borderRadius: 7,
              background: '#ff2d78',
              fontSize: 8,
              padding: '0 3px',
              boxShadow: '0 0 0 1.5px #0a0a0f',
              fontFamily: 'DM Sans, sans-serif',
            }}
          >
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span
        style={{
          fontSize: 9,
          fontFamily: 'DM Sans, sans-serif',
          color: active ? '#ff2d78' : '#777',
          fontWeight: active ? 700 : 400,
          transition: 'color 0.15s',
        }}
      >
        {label}
      </span>
    </button>
  );
}

/* ── Icons ── */
function HomeIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill={active ? '#ff2d78' : 'none'}
      stroke={active ? '#ff2d78' : '#888'} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" />
      <path d="M9 21V12h6v9" />
    </svg>
  );
}
function ExploreIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#ff2d78' : '#888'} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="11" cy="11" r="8" />
      <path d="M21 21l-4.35-4.35" />
    </svg>
  );
}
function PlusIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none"
      stroke="white" strokeWidth="2.2" strokeLinecap="round">
      <path d="M9 1v16M1 9h16" />
    </svg>
  );
}
function MsgIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24"
      fill={active ? '#ff2d78' : 'none'}
      stroke={active ? '#ff2d78' : '#888'} strokeWidth="1.8" strokeLinecap="round">
      <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
    </svg>
  );
}
function ProfileIcon({ active }) {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
      stroke={active ? '#ff2d78' : '#888'} strokeWidth="1.8" strokeLinecap="round">
      <circle cx="12" cy="8" r="4" />
      <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
    </svg>
  );
}