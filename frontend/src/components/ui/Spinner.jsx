import React from 'react';

/* Spinner loading */
export default function Spinner({ size = 'md', className = '' }) {
    const sizes = { sm: 'w-4 h-4', md: 'w-6 h-6', lg: 'w-10 h-10' };
    return (
        <svg
            className={`animate-spin text-primary ${sizes[size] ?? sizes.md} ${className}`}
            viewBox="0 0 24 24" fill="none"
        >
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="40" strokeDashoffset="20" strokeLinecap="round" opacity="0.25" />
            <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" strokeDasharray="14" strokeDashoffset="0" strokeLinecap="round" />
        </svg>
    );
}

/* Wrapper căn giữa */
export function SpinnerCenter({ size = 'lg', text = '' }) {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-3">
            <Spinner size={size} />
            {text && <p className="text-text-faint text-sm font-body">{text}</p>}
        </div>
    );
}

/* 3 chấm nhảy */
export function BounceDots() {
    return (
        <div className="flex gap-2 items-center justify-center">
            {[0, 1, 2].map(i => (
                <div
                    key={i}
                    className="w-2 h-2 rounded-full bg-primary "
                    style={{ animation: `bounceDot 1s ease-in-out ${i * 0.15}s infinite alternate` }}
                />
            ))}
            <style>{`@keyframes bounceDot{from{transform:translateY(0)}to{transform:translateY(-10px)}}`}</style>
        </div>
    );
}