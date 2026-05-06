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
      <label className="block text-text-secondary text-xs font-medium mb-1.5 font-body">
        {label}
      </label>

      {/* Trigger */}
      <div
        onClick={() => setIsOpen(!isOpen)}
        className={`
          bg-elevated border rounded-lg px-3.5 py-2.5
          flex items-center justify-between cursor-pointer transition-all hover:bg-[#2a2a2a]
          ${isOpen ? 'border-primary' : 'border-border2'}
        `}
      >
        <div>
          <p className="text-text-faint text-[10px] font-body m-0 uppercase tracking-tighter">
            {label}
          </p>
          <p className="text-[#eee] text-[13px] font-body m-0 mt-0.5 font-medium">
            {selectedOption?.label || 'Chọn...'}
          </p>
        </div>
        <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
          <ChevDownIcon />
        </div>
      </div>

      {/* Options list */}
      {isOpen && (
        <ul className="absolute z-[100] w-full mt-1.5 bg-[#2a2a2a] border border-border2 rounded-xl shadow-2xl overflow-hidden py-1">
          {options.map((option) => (
            <li
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`
                px-4 py-2.5 text-[13px] font-body cursor-pointer transition-colors
                ${option.value === value
                  ? 'bg-primary/10 text-primary font-semibold'
                  : 'text-[#ccc] hover:bg-[#383838] hover:text-white'
                }
              `}
            >
              {option.label}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}