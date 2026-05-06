import React from 'react';

export default function ProgressBars({ total, currentIndex, progress }) {
  if (total <= 1) return null;

  return (
    <div className="absolute top-0 inset-x-0 z-20 flex gap-[3px] px-2.5 pt-2.5 md:px-3 md:pt-3">
      {Array.from({ length: total }, (_, i) => {
        let fillWidth;
        if (i < currentIndex) fillWidth = 100;
        else if (i === currentIndex) fillWidth = progress * 100;
        else fillWidth = 0;

        return (
          <div key={i} className="flex-1 h-[2.5px] md:h-[2.5px] rounded-sm bg-white/25 overflow-hidden relative">
            <div
              className="absolute top-0 left-0 h-full rounded-sm bg-white"
              style={{ width: `${fillWidth}%`, transition: 'width 60ms linear' }}
            />
          </div>
        );
      })}
    </div>
  );
}
