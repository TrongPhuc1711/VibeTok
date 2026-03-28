import React from 'react';

/*
 AudioWaves — 4 thanh nhảy động minh họa đang phát nhạc
 */
export default function AudioWaves() {
  return (
    <div className="flex gap-0.5 items-center h-3.5">
      {[0, 1, 2, 3].map((i) => (
        <div
          key={i}
          className="w-[3px] bg-primary rounded-sm"
          style={{ animation: `audioWave 0.8s ease-in-out ${i * 0.15}s infinite alternate` }}
        />
      ))}
      <style>{`@keyframes audioWave{from{height:4px}to{height:14px}}`}</style>
    </div>
  );
}