import React, { useState, useEffect } from 'react';
import { formatCount } from '../../utils/formatters';

/**
 * VideoModal — xem chi tiết video trên profile
 *
 * Props:
 *  video   – video object
 *  isOwner – boolean
 *  onClose  – () => void
 *  onDelete – (videoId) => void
 */
export default function VideoModal({ video, isOwner, onClose, onDelete }) {
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleDelete = async () => {
    if (!window.confirm('Bạn có chắc muốn xóa video này không?')) return;
    setDeleting(true);
    await onDelete(video.id);
    setDeleting(false);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative flex gap-0 bg-surface border border-border rounded-2xl overflow-hidden max-h-[90vh] shadow-2xl">

        {/* Video */}
        <div className="relative bg-black" style={{ width: 340, height: 620 }}>
          {video.videoUrl ? (
            <video
              src={video.videoUrl}
              autoPlay
              loop
              controls
              playsInline
              className="w-full h-full object-contain"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-text-faint flex-col gap-2">
              <span className="text-4xl">🎬</span>
              <p className="text-sm font-body">Không có video</p>
            </div>
          )}
        </div>

        {/* Info */}
        <div className="w-[260px] flex flex-col p-5 overflow-auto border-l border-border">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-brand-gradient flex items-center justify-center text-sm font-bold text-white shrink-0">
              {video.user?.initials || 'U'}
            </div>
            <div>
              <p className="text-white text-sm font-semibold font-body m-0">@{video.user?.username}</p>
              <p className="text-text-faint text-xs font-body m-0">{video.user?.fullName}</p>
            </div>
          </div>

          <p className="text-white/90 text-sm font-body leading-relaxed mb-4 flex-1">
            {video.caption}
          </p>

          <div className="grid grid-cols-3 gap-2 border-t border-border pt-4 mb-4">
            {[
              { icon: '❤️', value: formatCount(video.likes),    label: 'Thích'    },
              { icon: '💬', value: formatCount(video.comments), label: 'Bình luận' },
              { icon: '👁️', value: formatCount(video.views),    label: 'Xem'       },
            ].map(s => (
              <div key={s.label} className="flex flex-col items-center gap-1">
                <span className="text-xl">{s.icon}</span>
                <span className="text-white text-sm font-bold font-body">{s.value}</span>
                <span className="text-text-faint text-[10px] font-body">{s.label}</span>
              </div>
            ))}
          </div>

          {isOwner && (
            <button
              onClick={handleDelete}
              disabled={deleting}
              className="w-full py-2 rounded-lg border border-red-500/40 text-red-400 bg-transparent text-[13px] font-semibold font-body cursor-pointer hover:bg-red-500/10 transition-colors disabled:opacity-50"
            >
              {deleting ? 'Đang xóa...' : '🗑 Xóa video'}
            </button>
          )}
        </div>

        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-black/50 border-none text-white text-lg cursor-pointer flex items-center justify-center hover:bg-black/70 transition-colors z-10"
        >
          ×
        </button>
      </div>
    </div>
  );
}