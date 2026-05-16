import React from 'react';
import { FILTERS, STICKERS } from '../../hooks/useFaceFilter';

export default function FilterPanel({
    activeFilter,
    setActiveFilter,
    activeSticker,
    setActiveSticker,
    onClose,
}) {
    return (
        <div className="absolute inset-x-0 bottom-28 z-40 animate-fade-in">
            <div className="mx-auto max-w-md bg-black/85 backdrop-blur-2xl rounded-t-3xl border-t border-x border-white/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-4 pt-3 pb-1">
                    <span className="text-white text-sm font-semibold font-body">✨ Bộ lọc & Sticker</span>
                    <button
                        onClick={onClose}
                        className="text-[#666] hover:text-white text-xs font-body bg-transparent border-none cursor-pointer transition-colors"
                    >
                        Đóng ✕
                    </button>
                </div>

                {/* Filters row */}
                <div className="px-3 pb-2">
                    <p className="text-[10px] text-[#666] font-body mb-1.5 uppercase tracking-widest">Bộ lọc màu</p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {FILTERS.map(f => {
                            const isActive = activeFilter === f.id;
                            return (
                                <button
                                    key={f.id}
                                    onClick={() => setActiveFilter(f.id)}
                                    className="shrink-0 flex flex-col items-center gap-1 cursor-pointer bg-transparent border-none transition-all group"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all
                                        ${isActive
                                            ? 'bg-[#ff2d78]/20 ring-2 ring-[#ff2d78] shadow-[0_0_12px_rgba(255,45,120,0.4)]'
                                            : 'bg-white/8 hover:bg-white/15 ring-1 ring-white/10'
                                        }`}
                                    >
                                        {f.icon}
                                    </div>
                                    <span className={`text-[9px] font-body transition-colors
                                        ${isActive ? 'text-[#ff2d78]' : 'text-[#666] group-hover:text-[#aaa]'}`}>
                                        {f.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Stickers row */}
                <div className="px-3 pb-3">
                    <p className="text-[10px] text-[#666] font-body mb-1.5 uppercase tracking-widest">Sticker hiệu ứng</p>
                    <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                        {STICKERS.map(s => {
                            const isActive = activeSticker === s.id;
                            return (
                                <button
                                    key={s.id}
                                    onClick={() => setActiveSticker(s.id)}
                                    className="shrink-0 flex flex-col items-center gap-1 cursor-pointer bg-transparent border-none transition-all group"
                                >
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-xl transition-all
                                        ${isActive
                                            ? 'bg-[#ff6b35]/20 ring-2 ring-[#ff6b35] shadow-[0_0_12px_rgba(255,107,53,0.4)]'
                                            : 'bg-white/8 hover:bg-white/15 ring-1 ring-white/10'
                                        }`}
                                    >
                                        {s.icon}
                                    </div>
                                    <span className={`text-[9px] font-body transition-colors
                                        ${isActive ? 'text-[#ff6b35]' : 'text-[#666] group-hover:text-[#aaa]'}`}>
                                        {s.label}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}
