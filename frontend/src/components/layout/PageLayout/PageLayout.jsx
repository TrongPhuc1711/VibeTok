import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from '../Sidebar/Sidebar';
import SearchPanel from '../Sidebar/SearchPanel';
import NotificationPagePanel from '../../notification/NotificationPagePanel';
import BottomNav from '../BottomNav/BottomNav';
import { useAuthContext } from '../../../contexts/AuthContext';

export default function PageLayout({ children, rightPanel, noPadding = false }) {
  const { user, isAuthenticated } = useAuthContext();
  const navigate = useNavigate();
  const isAdmin = isAuthenticated && user?.vai_tro === 'admin';
  const [notifOpen, setNotifOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const handleNotifClick = () => {
    setSearchOpen(false);
    setNotifOpen(o => !o);
  };

  const handleSearchClick = () => {
    setNotifOpen(false);
    setSearchOpen(o => !o);
  };

  const handleSearchClose = () => {
    setSearchOpen(false);
  };

  const isCollapsed = notifOpen || searchOpen;

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      {/* Desktop sidebar */}
      <div className="hidden md:block md:shrink-0">
        <Sidebar
          collapsed={isCollapsed}
          onNotifClick={handleNotifClick}
          notifActive={notifOpen}
          onSearchClick={handleSearchClick}
          searchActive={searchOpen}
        />
      </div>

      {/* Desktop search panel */}
      {searchOpen && (
        <div className="hidden md:flex">
          <SearchPanel onClose={handleSearchClose} />
        </div>
      )}

      {/* Desktop notification panel  */}
      {notifOpen && (
        <div className="hidden md:flex">
          <NotificationPagePanel onClose={() => setNotifOpen(false)} />
        </div>
      )}

      {/* ── Main area ── */}
      <main
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          (notifOpen || searchOpen) ? 'md:opacity-30 md:pointer-events-none md:select-none' : ''
        }`}
      >
        {/* Mobile notification full-screen overlay */}
        {notifOpen && (
          <div className="md:hidden fixed inset-0 z-[60] flex flex-col" style={{ background: '#0a0a0f' }}>
            <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a2a] shrink-0">
              <button onClick={() => setNotifOpen(false)}
                className="bg-transparent border-none text-white text-xl cursor-pointer w-8 h-8 flex items-center justify-center">
                ←
              </button>
              <span className="text-white font-semibold text-[17px] font-body">Thông báo</span>
            </div>
            <div className="flex-1 overflow-auto pb-16">
              <NotificationPagePanel onClose={() => setNotifOpen(false)} />
            </div>
          </div>
        )}

        {/* Mobile search full-screen overlay */}
        {searchOpen && (
          <div className="md:hidden fixed inset-0 z-[60] flex flex-col" style={{ background: '#0a0a0f' }}>
            <SearchPanel onClose={handleSearchClose} />
          </div>
        )}

        {/* Content with bottom padding on mobile for bottom nav (except video feed) */}
        <div className={`flex-1 flex flex-col overflow-hidden ${noPadding ? '' : 'pb-14 md:pb-0'}`}>
          {children}
        </div>
      </main>

      {/* ── Desktop right panel ── */}
      {!notifOpen && !searchOpen && rightPanel && (
        <aside className="hidden lg:block w-[280px] border-l border-border overflow-auto shrink-0">
          {rightPanel}
        </aside>
      )}

      {/* ── Mobile bottom nav ── */}
      <BottomNav
        onNotifClick={handleNotifClick}
        notifActive={notifOpen}
        onSearchClick={handleSearchClick}
        searchActive={searchOpen}
      />

      {/* ── Admin Dashboard Button (only for admin) ── */}
      {isAdmin && (
        <button
          id="admin-dashboard-btn"
          onClick={() => navigate('/admin')}
          title="Trang quản trị"
          style={{
            position: 'fixed',
            top: 16,
            right: 16,
            zIndex: 9999,
            width: 44,
            height: 44,
            borderRadius: 12,
            border: '1px solid rgba(255, 45, 120, 0.4)',
            background: 'linear-gradient(135deg, #ff2d78, #7c3aed)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            boxShadow: '0 4px 20px rgba(255, 45, 120, 0.35)',
            transition: 'all 0.25s ease',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'scale(1.1)';
            e.currentTarget.style.boxShadow = '0 6px 28px rgba(255, 45, 120, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 4px 20px rgba(255, 45, 120, 0.35)';
          }}
        >
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
            <path d="M9 12l2 2 4-4" />
          </svg>
        </button>
      )}
    </div>
  );
}