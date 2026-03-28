import React from 'react';

/**
 * Avatar — hiển thị ảnh đại diện hoặc initials
 *
 * Props:
 *  user      – object có trường initials / fullName
 *  size      – 'xs' | 'sm' | 'md' | 'lg' | 'xl'
 *  live      – boolean, hiển thị badge LIVE
 *  border    – boolean, thêm viền primary khi active
 *  onClick   – handler khi click
 *  className – override thêm class
 */
const SIZE_MAP = {
  xs: 'w-6 h-6 text-[8px]',
  sm: 'w-9 h-9 text-xs',
  md: 'w-11 h-11 text-sm',
  lg: 'w-[60px] h-[60px] text-base',
  xl: 'w-[90px] h-[90px] text-[28px]',
};

export default function Avatar({
  user = {},
  size = 'md',
  live = false,
  border = false,
  onClick,
  className = '',
}) {
  const initials =
    user.initials ||
    user.fullName
      ?.split(' ')
      .map((w) => w[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) ||
    'U';

  return (
    <div className="relative shrink-0 inline-block">
      <div
        onClick={onClick}
        className={`
          ${SIZE_MAP[size] ?? SIZE_MAP.md}
          rounded-full bg-brand-gradient flex items-center justify-center
          font-bold text-white select-none
          ${border ? 'border-2 border-primary' : ''}
          ${onClick ? 'cursor-pointer' : ''}
          ${className}
        `}
      >
        {initials}
      </div>

      {live && (
        <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 bg-primary text-white text-[7px] font-bold px-1 py-px rounded tracking-[0.3px] leading-none">
          LIVE
        </span>
      )}
    </div>
  );
}