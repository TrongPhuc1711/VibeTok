import React from 'react';
import Sidebar from '../Sidebar/Sidebar';

/*
PageLayout — layout chung cho tất cả page có sidebar
 
Props:
children    – nội dung chính
rightPanel  – ReactNode (optional panel bên phải)
noPadding   – boolean
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