import React from 'react';

/**
 * FollowButton
 *
 * Props:
 *  following – boolean  (true = đang follow)
 *  onClick   – handler
 *  size      – 'sm' | 'md'
 *  disabled  – boolean
 *  className – override
 */
export default function FollowButton({
  following = false,
  onClick,
  size = 'md',
  disabled = false,
  className = '',
}) {
  const sizeClass =
    size === 'sm'
      ? 'text-[11px] px-2.5 py-1'
      : 'text-xs px-4 py-1.5';

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`
        rounded border font-semibold font-body transition-all cursor-pointer
        disabled:opacity-50 disabled:cursor-not-allowed
        ${sizeClass}
        ${following
          ? 'border-border2 text-text-faint bg-transparent hover:border-red-500/40 hover:text-red-400'
          : 'border-primary/50 text-primary bg-transparent hover:bg-primary/10'
        }
        ${className}
      `}
    >
      {following ? 'Đang follow' : 'Follow'}
    </button>
  );
}