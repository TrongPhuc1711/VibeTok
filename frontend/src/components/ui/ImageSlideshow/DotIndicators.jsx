import React from 'react';

export default function DotIndicators({ total, currentIndex, onDotClick, maxVisible = 7 }) {
  if (total <= 1) return null;

  let startIdx = 0;
  let endIdx = total;
  if (total > maxVisible) {
    const half = Math.floor(maxVisible / 2);
    startIdx = Math.max(0, currentIndex - half);
    endIdx = Math.min(total, startIdx + maxVisible);
    if (endIdx - startIdx < maxVisible) startIdx = Math.max(0, endIdx - maxVisible);
  }

  return (
    <div className="absolute bottom-3.5 left-1/2 -translate-x-1/2 z-[25] flex gap-[5px] items-center md:bottom-4">
      {Array.from({ length: endIdx - startIdx }, (_, i) => {
        const idx = startIdx + i;
        const isActive = idx === currentIndex;
        return (
          <button
            key={idx}
            onClick={() => onDotClick?.(idx)}
            aria-label={`Ảnh ${idx + 1}`}
            className={`h-[6px] rounded-full border-none p-0 cursor-pointer transition-all duration-300
              ${isActive ? 'w-[18px] bg-white' : 'w-[6px] bg-white/35'}`}
            style={{ WebkitTapHighlightColor: 'transparent' }}
          />
        );
      })}
    </div>
  );
}
