
import React from 'react';

const VARIANTS = {
    primary: 'bg-primary hover:bg-primary/90 text-white border-transparent',
    ghost: 'bg-transparent border-border2 text-text-secondary hover:border-primary/40 hover:text-white',
    outline: 'bg-transparent border-primary/50 text-primary hover:bg-primary/10',
    danger: 'bg-red-600 hover:bg-red-700 text-white border-transparent',
};

const SIZES = {
    sm: 'text-xs px-3 py-1.5',
    md: 'text-sm px-4 py-2.5',
    lg: 'text-base px-6 py-3.5',
};

export default function Button({
    children,
    variant = 'primary',
    size = 'md',
    loading = false,
    disabled = false,
    fullWidth = false,
    type = 'button',
    className = '',
    onClick,
    ...rest
}) {
    const base = 'inline-flex items-center justify-center gap-2 font-semibold font-body rounded-lg border transition-all duration-150 active:scale-[0.98] disabled:opacity-60 disabled:cursor-not-allowed';

    return (
        <button
            type={type}
            disabled={disabled || loading}
            onClick={onClick}
            className={`${base} ${VARIANTS[variant] ?? VARIANTS.primary} ${SIZES[size] ?? SIZES.md} ${fullWidth ? 'w-full' : ''} ${className}`}
            {...rest}
        >
            {loading && <SpinIcon />}
            {children}
        </button>
    );
}

function SpinIcon() {
    return (
        <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
            <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10" strokeLinecap="round" />
        </svg>
    );
}