import React from 'react';
import { SearchIcon } from '../../../icons/NavIcons';

export default function SidebarSearch({ onSearchClick }) {
  return (
    <div className="px-3 py-2.5">
      <button
        onClick={onSearchClick}
        className="flex items-center gap-2.5 rounded-lg px-3.5 py-2.5 w-full border-none cursor-pointer transition-colors bg-transparent"
        style={{ background: 'var(--vt-input)' }}
        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--vt-hover)'; }}
        onMouseLeave={(e) => { e.currentTarget.style.background = 'var(--vt-input)'; }}
      >
        <SearchIcon color="var(--vt-text-caption)" />
        <span className="text-sm font-body" style={{ color: 'var(--vt-text-caption)' }}>Tìm kiếm...</span>
      </button>
    </div>
  );
}