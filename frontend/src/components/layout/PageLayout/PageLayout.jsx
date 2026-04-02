import React, { useState } from 'react';
import Sidebar from '../Sidebar/Sidebar';
import NotificationPagePanel from '../../notification/NotificationPagePanel';

export default function PageLayout({ children, rightPanel, noPadding = false }) {
  const [notifOpen, setNotifOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <Sidebar
        collapsed={notifOpen}
        onNotifClick={() => setNotifOpen(o => !o)}
        notifActive={notifOpen}
      />

      {notifOpen && (
        <NotificationPagePanel onClose={() => setNotifOpen(false)} />
      )}

      <main
        className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${
          notifOpen ? 'opacity-30 pointer-events-none select-none' : ''
        }`}
      >
        {children}
      </main>

      {!notifOpen && rightPanel && (
        <aside className="w-[280px] border-l border-border overflow-auto shrink-0">
          {rightPanel}
        </aside>
      )}
    </div>
  );
}