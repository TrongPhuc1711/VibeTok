import React from 'react';
import { MusicDiskIcon } from '../../../icons/CommonIcons';

export default function MusicDisc({ track }) {
  const coverUrl = track?.cover || null;

  return (
    <div title={track ? `${track.title} – ${track.artist}` : 'Nhạc nền'} className="mt-1">
      <div
        // Đổi thành border-2 giống Âm thanh gốc để không bị ăn mất diện tích ảnh
        className="w-[50px] h-[50px] rounded-full relative shrink-0 overflow-hidden animate-[spin_5s_linear_infinite]"
        style={{
          background: !coverUrl ? 'linear-gradient(135deg, #2a1a3e, #0d0d1a)' : '#111',
        }}
      >
        {coverUrl && (
          <img
            src={coverUrl}
            alt="cover"
            className="absolute inset-0 w-full h-full object-cover scale-110" 
          />
        )}

        {/* Nốt nhạc khi không có ảnh */}
        {!coverUrl && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-0 flex items-center justify-center opacity-50">
            <MusicDiskIcon />
          </div>
        )}
      </div>
    </div>
  );
}