import React from 'react';

/**
 * MenuItem — một dòng menu trong UserDropdown
 *
 * Props:
 *  icon    – ReactNode
 *  label   – string
 *  onClick – handler
 *  danger  – boolean (màu đỏ logout)
 */
export default function MenuItem({ icon, label, onClick, danger = false }) {
  return (
    <button
      onClick={onClick}
      className={`
        w-full flex items-center gap-3 px-4 py-2.5
        border-none bg-transparent cursor-pointer transition-colors text-left
        ${danger
          ? 'text-red-400 hover:bg-red-500/10'
          : 'text-text-secondary hover:bg-white/5 hover:text-white'
        }
      `}
    >
      <span className={`shrink-0 ${danger ? 'text-red-400' : 'text-text-faint'}`}>
        {icon}
      </span>
      <span className="text-[13px] font-body font-medium">{label}</span>
    </button>
  );
}