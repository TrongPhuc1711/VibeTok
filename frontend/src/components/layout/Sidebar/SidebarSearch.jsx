import React from 'react';
import { SearchIcon } from '../../../icons/NavIcons';

export default function SidebarSearch({ onSearchClick }) {
  return (
    <div className="px-3 py-2.5">
      <button
        onClick={onSearchClick}
        className="flex items-center gap-2.5 bg-elevated rounded-lg px-3.5 py-2.5 w-full border-none cursor-pointer transition-colors hover:bg-white/10"
      >
        <SearchIcon />
        <span className="text-text-faint text-sm font-body">Tìm kiếm...</span>
      </button>
    </div>
  );
}