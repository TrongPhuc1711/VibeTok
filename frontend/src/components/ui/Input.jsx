//input nguyên tử, không có label/error
import React, { forwardRef } from 'react';

const Input = forwardRef(function Input({
    type = 'text',
    placeholder,
    value,
    onChange,
    onBlur,
    onFocus,
    disabled = false,
    hasError = false,
    className = '',
    ...rest
}, ref) {
    return (
        <input
            ref={ref}
            type={type}
            placeholder={placeholder}
            value={value}
            onChange={e => onChange?.(e.target.value)}
            onBlur={e => onBlur?.(e.target.value)}
            onFocus={onFocus}
            disabled={disabled}
            className={`
        w-full bg-elevated border rounded-lg px-3.5 py-3.5 text-sm font-body text-white
        placeholder:text-text-faint outline-none transition-colors
        focus:border-primary/40
        disabled:opacity-60 disabled:cursor-not-allowed
        ${hasError ? 'border-primary' : 'border-border2'}
        ${className}
      `}
            {...rest}
        />
    );
});

export default Input;