import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';
import { useNotifications } from '../../../hooks/useNotifications';
import { useUnreadMessageCount } from '../../../hooks/useMessages';
import {
  HomeIcon, ExploreIcon, PlusIcon, MsgIcon, ProfileIcon
} from '../../../icons/BottomNavIcons';

export default function BottomNav({ onNotifClick, notifActive, onSearchClick, searchActive }) {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { unreadCount: notifCount } = useNotifications();
  const { unreadCount: msgCount } = useUnreadMessageCount();

  const isActive = (path) => pathname === path;

  return (
    <nav
      className="md:hidden fixed bottom-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(10,10,15,0.97)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        paddingBottom: 'env(safe-area-inset-bottom)',
      }}
    >
      <div className="flex items-center justify-around" style={{ height: 56 }}>
        <NavBtn active={isActive(ROUTES.HOME)} onClick={() => navigate(ROUTES.HOME)}
          label="Trang chủ" icon={<HomeIcon active={isActive(ROUTES.HOME)} />} />

        <NavBtn active={isActive(ROUTES.EXPLORE) || searchActive} onClick={() => navigate(ROUTES.EXPLORE)}
          label="Khám phá" icon={<ExploreIcon active={isActive(ROUTES.EXPLORE) || searchActive} />} />

        {/* Center create button */}
        <CreateButton onClick={() => navigate(ROUTES.UPLOAD)} />

        <NavBtn active={isActive(ROUTES.MESSAGE)} onClick={() => navigate(ROUTES.MESSAGE)}
          label="Hộp thư" badge={msgCount} icon={<MsgIcon active={isActive(ROUTES.MESSAGE)} />} />

        <NavBtn active={isActive(ROUTES.PROFILE)} onClick={() => navigate(ROUTES.PROFILE)}
          label="Hồ sơ" badge={notifCount} icon={<ProfileIcon active={isActive(ROUTES.PROFILE)} />} />
      </div>
    </nav>
  );
}

/* ── Create button — TikTok style ── */
function CreateButton({ onClick }) {
  return (
    <button onClick={onClick}
      className="flex flex-col items-center justify-center border-none bg-transparent cursor-pointer -mt-1"
      style={{ WebkitTapHighlightColor: 'transparent' }}
      aria-label="Đăng video">
      <div className="flex items-center justify-center rounded-lg relative overflow-hidden" style={{ width: 44, height: 30 }}>
        <div className="absolute inset-0 rounded-lg" style={{ background: '#25f4ee', transform: 'translateX(-4px)' }} />
        <div className="absolute inset-0 rounded-lg" style={{ background: '#ff2d78', transform: 'translateX(4px)' }} />
        <div className="absolute inset-0 rounded-lg flex items-center justify-center" style={{ background: '#fff' }}>
          <PlusIcon />
        </div>
      </div>
    </button>
  );
}

/* ── Nav button ── */
function NavBtn({ active, onClick, label, icon, badge }) {
  return (
    <button onClick={onClick}
      className="relative flex flex-col items-center gap-0.5 border-none bg-transparent cursor-pointer px-3 py-1.5"
      style={{ WebkitTapHighlightColor: 'transparent', minWidth: 50 }}>
      <div className="relative">
        {icon}
        {badge > 0 && (
          <span className="absolute flex items-center justify-center font-bold text-white"
            style={{ top: -5, right: -8, minWidth: 16, height: 16, borderRadius: 8,
              background: '#ff2d78', fontSize: 9, padding: '0 4px',
              boxShadow: '0 0 0 2px rgba(10,10,15,0.97)', fontFamily: 'DM Sans, sans-serif' }}>
            {badge > 99 ? '99+' : badge}
          </span>
        )}
      </div>
      <span style={{ fontSize: 10, fontFamily: 'DM Sans, sans-serif',
        color: active ? '#fff' : '#8a8a8e', fontWeight: active ? 600 : 400,
        transition: 'color 0.15s', letterSpacing: '-0.01em' }}>
        {label}
      </span>
    </button>
  );
}