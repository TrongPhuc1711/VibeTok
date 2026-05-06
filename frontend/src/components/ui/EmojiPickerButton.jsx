import React, { useState, useRef, useEffect } from 'react';
import Picker from '@emoji-mart/react';
import data from '@emoji-mart/data';

export default function EmojiPickerButton({ onSelect, position = 'top', size = 20 }) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef(null);

  // Đóng picker khi click bên ngoài
  useEffect(() => {
    if (!open) return;
    const handler = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const handleSelect = (emojiData) => {
    onSelect?.(emojiData.native);
  };

  return (
    <div ref={containerRef} className="relative">
      {/* Trigger button */}
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center justify-center rounded-full border-none cursor-pointer transition-all
          ${open
            ? 'bg-primary/20 text-primary'
            : 'bg-transparent text-[#555] hover:text-[#aaa] hover:bg-white/5'
          }`}
        style={{ width: size + 12, height: size + 12 }}
        title="Chọn emoji"
      >
        <EmojiIcon size={size} active={open} />
      </button>

      {/* Picker popup */}
      {open && (
        <div
          className="absolute z-[100] animate-[fadeIn_0.15s_ease-out]"
          style={{
            [position === 'top' ? 'bottom' : 'top']: '100%',
            right: 0,
            marginBottom: position === 'top' ? 8 : undefined,
            marginTop: position === 'bottom' ? 8 : undefined,
          }}
        >
          <Picker
            data={data}
            onEmojiSelect={handleSelect}
            theme="dark"
            locale="vi"
            previewPosition="none"
            skinTonePosition="none"
            perLine={8}
            maxFrequentRows={2}
            navPosition="bottom"
            searchPosition="sticky"
            set="native"
            icons="outline"
          />
        </div>
      )}
    </div>
  );
}

/* ── Emoji icon (smiley face) ── */
function EmojiIcon({ size = 20, active = false }) {
  return (
    <svg
      width={size} height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={active ? '#ff2d78' : 'currentColor'}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2.5" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2.5" />
    </svg>
  );
}
