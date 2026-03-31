import React, { useState } from 'react';
import { formatCount } from '../../utils/formatters';

/**
 * VideoThumb — thumbnail video trong grid profile
 *
 * Props:
 *  video   – video object
 *  isOwner – boolean (có phải chủ video không)
 *  onClick – () => void
 *  onDelete – (videoId) => void
 */
export default function VideoThumb({ video, isOwner, onClick, onDelete }) {
  const [hovered,       setHovered]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);

  const hue = (parseInt(video.id?.slice(-2) ?? '0', 16) || 0) % 360;

  const handleDeleteClick = async (e) => {
    e.stopPropagation();
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    setDeleting(true);
    await onDelete(video.id);
    setDeleting(false);
  };

  return (
    <div
      className="relative rounded cursor-pointer overflow-hidden transition-transform duration-200"
      style={{
        aspectRatio: '9/16',
        background: `linear-gradient(135deg,hsl(${hue},25%,10%),hsl(${(hue + 60) % 360},15%,6%))`,
        transform: hovered ? 'scale(1.03)' : 'scale(1)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); }}
      onClick={onClick}
    >
      {video.thumbnail && (
        <img
          src={video.thumbnail}
          alt={video.caption}
          className="absolute inset-0 w-full h-full object-cover"
          onError={e => { e.target.style.display = 'none'; }}
        />
      )}

      {/* Hover overlay */}
      {hovered && (
        <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
          <span className="text-white text-2xl">▶</span>
        </div>
      )}

      {/* Nút xóa — chỉ chủ video + hover */}
      {isOwner && hovered && (
        <button
          onClick={handleDeleteClick}
          disabled={deleting}
          className={`
            absolute top-1.5 right-1.5 z-10 text-[10px] font-bold font-body
            px-2 py-1 rounded border-none cursor-pointer transition-all
            disabled:opacity-50
            ${confirmDelete
              ? 'bg-red-500 text-white animate-pulse'
              : 'bg-black/60 text-white/80 hover:bg-red-500 hover:text-white'
            }
          `}
        >
          {deleting ? '...' : confirmDelete ? 'Xác nhận?' : '🗑'}
        </button>
      )}

      <p className="absolute bottom-1.5 left-1.5 text-white text-[11px] font-semibold font-body m-0 drop-shadow">
        ▶ {formatCount(video.views || video.likes || 0)}
      </p>
    </div>
  );
}