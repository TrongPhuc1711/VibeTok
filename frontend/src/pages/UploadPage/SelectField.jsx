import React, { useState, useRef, useEffect } from 'react';
import { ChevDownIcon } from '../../icons/CommonIcons';

export default function SelectField({ label, value, options, onChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const selectedOption = options.find((o) => o.value === value);

  return (
    <div className="relative" ref={containerRef}>
      <label className="block text-xs font-medium mb-1.5 font-body" style={{ color: 'var(--color-text-secondary)' }}>
        {label}
      </label>

      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className="rounded-lg px-3.5 py-2.5 flex items-center justify-between cursor-pointer transition-all border"
        style={{
          background: 'var(--vt-input)',
          borderColor: isOpen ? 'var(--color-primary, #ff2d78)' : 'var(--color-border)',
        }}
      >
        <div>
          <p className="text-[10px] font-body m-0 uppercase tracking-tighter" style={{ color: 'var(--color-text-muted)' }}>
            {label}
          </p>
          <p className="text-[13px] font-body m-0 mt-0.5 font-medium" style={{ color: 'var(--color-text-primary)' }}>
            {selectedOption?.label || 'Chọn...'}
          </p>
        </div>
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} style={{ color: 'var(--color-text-secondary)' }}>
          <ChevDownIcon />
        </div>
      </div>

      {/* Options list */}
      {isOpen && (
        <ul
          className="absolute z-[100] w-full mt-1.5 border rounded-xl shadow-2xl overflow-hidden py-1 m-0 list-none"
          style={{
            background: 'var(--vt-card)',
            borderColor: 'var(--color-border)',
            boxShadow: '0 12px 32px rgba(0,0,0,0.15)',
          }}
        >
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="px-4 py-2.5 text-[13px] font-body cursor-pointer transition-colors"
              style={{
                background: option.value === value ? 'rgba(255, 45, 120, 0.1)' : 'transparent',
                color: option.value === value ? 'var(--color-primary, #ff2d78)' : 'var(--color-text-primary)',
                fontWeight: option.value === value ? '600' : '400',
              }}
              onMouseEnter={(e) => {
                if (option.value !== value) e.currentTarget.style.background = 'var(--vt-hover)';
              }}
              onMouseLeave={(e) => {
                if (option.value !== value) e.currentTarget.style.background = 'transparent';
              }}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}