import React from 'react';
import Sidebar from '../Sidebar';
/*
  PageLayout({ children, rightPanel?, noPadding? })
  rightPanel: nội dung hiển thị bên phải (optional)
 */
export default function PageLayout({ children, rightPanel, noPadding = false }) {
  return (
    <div className="flex h-screen overflow-hidden bg-base">
      <Sidebar />
      <main className={`flex-1 flex flex-col overflow-hidden ${noPadding ? '' : ''}`}>
        {children}
      </main>
      {rightPanel && (
        <aside className="w-[280px] border-l border-border overflow-auto shrink-0">
          {rightPanel}
        </aside>
      )}
    </div>
  );
}