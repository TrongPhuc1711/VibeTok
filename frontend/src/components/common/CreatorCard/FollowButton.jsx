import React from 'react';

/**
 * FollowButton
 *
 * Props:
 *  following – boolean
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
          ? 'border-border2 text-text-faint bg-transparent'
          : 'border-primary/50 text-primary bg-transparent hover:bg-primary/10'
        }
        ${className}
      `}
    >
      {following ? 'Following' : 'Follow'}
    </button>
  );
}