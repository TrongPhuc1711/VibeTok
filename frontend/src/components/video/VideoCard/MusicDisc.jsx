import React from 'react';

export default function MusicDisc({ track }) {
  return (
    <div title={track ? `${track.title} – ${track.artist}` : 'Nhạc nền'} className="mt-1">
      <div
        className="w-[44px] h-[44px] rounded-full border-4 border-white/20 bg-gradient-to-br from-[#2a1a3e] to-[#0d0d1a] flex items-center justify-center relative overflow-hidden"
        style={{ animation: 'spin 4s linear infinite' }}
      >
        <div className="w-[10px] h-[10px] rounded-full bg-[#161823] border-2 border-white/30 z-10 absolute" />
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#888" strokeWidth="1.2" className="opacity-50">
          <path d="M5 10V3l7-1.5V8.5" />
          <circle cx="3" cy="10" r="2" />
          <circle cx="10" cy="8.5" r="2" />
        </svg>
      </div>
    </div>
  );
}