import React, { useEffect } from 'react';

export default function Modal({ open, onClose, title, children, size = 'md' }) {
    useEffect(() => {
        if (!open) return;
        const handler = (e) => { if (e.key === 'Escape') onClose?.(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [open, onClose]);

    if (!open) return null;

    const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl' };

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose?.(); }}
        >
            <div className={`w-full ${widths[size] ?? widths.md} bg-surface border border-border rounded-xl shadow-2xl flex flex-col max-h-[90vh]`}>
                {/* Header */}
                {title && (
                    <div className="flex items-center justify-between px-5 py-4 border-b border-border shrink-0">
                        <h3 className="text-white text-base font-semibold font-display">{title}</h3>
                        <button
                            onClick={onClose}
                            className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border-none text-text-secondary cursor-pointer flex items-center justify-center transition-colors text-lg"
                        >
                            ×
                        </button>
                    </div>
                )}
                {/* Body */}
                <div className="flex-1 overflow-auto p-5">{children}</div>
            </div>
        </div>
    );
}