//input + label + error + icon
import React, { useState } from 'react';

export default function FormInput({
    label,
    type = 'text',
    value,
    onChange,
    onBlur,
    placeholder,
    error,
    icon,
    required = false,
    disabled = false,
    hint,
    className = '',
}) {
    const [focused, setFocused] = useState(false);
    const [showPwd, setShowPwd] = useState(false);

    const inputType = type === 'password' ? (showPwd ? 'text' : 'password') : type;
    const hasError = !!error;

    return (
        <div className={`w-full ${className}`}>
            {label && (
                <label className="block font-body text-sm text-text-secondary mb-1.5 font-medium">
                    {label}
                    {required && <span className="text-primary ml-1">*</span>}
                </label>
            )}

            <div className={`flex items-center bg-elevated rounded-lg border transition-colors overflow-hidden
        ${hasError ? 'border-primary' : focused ? 'border-primary/40' : 'border-border2'}
        ${disabled ? 'opacity-60' : ''}`}
            >
                {icon && <div className="pl-3.5 opacity-50 shrink-0">{icon}</div>}

                <input
                    type={inputType}
                    value={value}
                    disabled={disabled}
                    placeholder={placeholder}
                    onChange={e => onChange?.(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onBlur={e => { setFocused(false); onBlur?.(e.target.value); }}
                    className={`flex-1 bg-transparent border-none outline-none text-white text-sm font-body
            placeholder:text-text-faint disabled:cursor-not-allowed
            ${icon ? 'py-4 pr-4 pl-2' : 'px-4 py-4'}`}
                />

                {type === 'password' && (
                    <button
                        type="button"
                        onClick={() => setShowPwd(s => !s)}
                        className="px-3.5 bg-transparent border-none cursor-pointer text-text-faint hover:text-text-secondary transition-colors"
                    >
                        {showPwd ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                )}
            </div>

            {hasError && (
                <div className="flex items-center gap-1.5 mt-1.5">
                    <div className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                    <span className="text-primary text-xs font-body">{error}</span>
                </div>
            )}

            {hint && !hasError && (
                <p className="text-text-subtle text-xs font-body mt-1.5">{hint}</p>
            )}
        </div>
    );
}

function EyeIcon() {
    return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2">
        <path d="M1 8C1 8 3.5 3 8 3s7 5 7 5-2.5 5-7 5S1 8 1 8z" />
        <circle cx="8" cy="8" r="2" />
    </svg>;
}
function EyeOffIcon() {
    return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round">
        <path d="M2 2l12 12M6.5 6.7C6.2 7 6 7.5 6 8c0 1.1.9 2 2 2 .5 0 1-.2 1.3-.5" />
        <path d="M4.3 4.3C2.7 5.3 1 8 1 8s2.5 5 7 5c1.4 0 2.7-.4 3.7-1.1M7 3.1C7.3 3 7.7 3 8 3c4.5 0 7 5 7 5s-.7 1.3-2 2.5" />
    </svg>;
}