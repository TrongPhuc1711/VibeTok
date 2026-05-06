import React, { useRef } from 'react';
import EmojiPickerButton from '../../components/ui/EmojiPickerButton';
import { SendIcon } from '../../icons/MessageIcons';

export default function MessageInput({ value, onChange, onSend, onKeyDown, partnerUsername, disabled }) {
    const textareaRef = useRef(null);

    const handleInput = (e) => {
        // Auto-grow
        e.target.style.height = 'auto';
        e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
        onChange(e.target.value);
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            onSend();
        }
        onKeyDown?.(e);
    };

    const handleEmojiSelect = (emoji) => {
        onChange(value + emoji);
        textareaRef.current?.focus();
    };

    const active = value.trim().length > 0;

    return (
        <div className="px-4 py-3.5 border-t border-[#1a1a2a] shrink-0 bg-[#0d0d18]">
            <div className="flex items-end gap-3 bg-[#1a1a2e] border border-[#252535] rounded-2xl px-4 py-2.5 focus-within:border-[#ff2d78]/40 transition-colors">
                <textarea
                    ref={textareaRef}
                    value={value}
                    onChange={handleInput}
                    onKeyDown={handleKey}
                    placeholder={`Nhắn tin cho @${partnerUsername}...`}
                    rows={1}
                    disabled={disabled}
                    className="flex-1 bg-transparent border-none outline-none text-white text-[14px] font-body resize-none placeholder:text-[#444] leading-relaxed disabled:opacity-50"
                    style={{ maxHeight: 120, overflowY: 'auto' }}
                />
                <EmojiPickerButton
                    onSelect={handleEmojiSelect}
                    position="top"
                    size={18}
                />
                <button
                    onClick={onSend}
                    disabled={!active || disabled}
                    className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 mb-0.5"
                    style={{ background: active ? 'linear-gradient(135deg,#ff2d78,#ff6b35)' : '#252535' }}
                >
                    <SendIcon active={active} size={14} />
                </button>
            </div>
        </div>
    );
}
