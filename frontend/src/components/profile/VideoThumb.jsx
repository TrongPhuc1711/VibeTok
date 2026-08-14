import React, { useState } from 'react';
import { formatCount } from '../../utils/formatters';
import { VIDEO_PRIVACY_LABELS } from '../../utils/constants';

/**
 * VideoThumb — thumbnail video trong grid profile
 *
 * Props:
 *  video   – video object
 *  isOwner – boolean (có phải chủ video không)
 *  onClick – () => void
 *  onDelete – (videoId) => void
 *  onPrivacyChange – (videoId, newPrivacy) => void
 */
export default function VideoThumb({ video, isOwner, onClick, onDelete, onPrivacyChange }) {
  const [hovered,       setHovered]       = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting,      setDeleting]      = useState(false);
  const [showPrivacyMenu, setShowPrivacyMenu] = useState(false);
  const [updatingPrivacy, setUpdatingPrivacy] = useState(false);

  const currentPrivacy = video.privacy || 'public';
  const hue = (parseInt(String(video.id ?? '0').slice(-2), 16) || 0) % 360;

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

  const handleSelectPrivacy = async (e, newPrivacy) => {
    e.stopPropagation();
    setShowPrivacyMenu(false);
    if (newPrivacy === currentPrivacy || updatingPrivacy) return;
    setUpdatingPrivacy(true);
    if (onPrivacyChange) {
      await onPrivacyChange(video.id, newPrivacy);
    }
    setUpdatingPrivacy(false);
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
      onMouseLeave={() => { setHovered(false); setConfirmDelete(false); setShowPrivacyMenu(false); }}
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

      {/* Privacy Badge & Control (Owner only) */}
      {isOwner && (
        <div className="absolute top-1.5 left-1.5 z-20">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowPrivacyMenu(prev => !prev);
            }}
            disabled={updatingPrivacy}
            className="flex items-center gap-1 bg-black/60 backdrop-blur text-white text-[10px] font-semibold px-2 py-0.5 rounded-full border border-white/10 hover:bg-black/80 transition-all cursor-pointer"
            title="Chỉnh sửa quyền riêng tư"
          >
            <span>{VIDEO_PRIVACY_LABELS[currentPrivacy] || 'Công khai'}</span>
          </button>

          {/* Privacy Dropdown Menu */}
          {showPrivacyMenu && (
            <div
              className="absolute top-7 left-0 bg-[#161622] border border-[#2a2a3e] rounded-lg shadow-xl overflow-hidden min-w-[110px] py-1 text-[11px] font-body text-white z-30"
              onClick={e => e.stopPropagation()}
            >
              {[
                { key: 'public', label: 'Công khai' },
                { key: 'friends', label: 'Bạn bè' },
                { key: 'private', label: 'Chỉ mình tôi' },
              ].map(opt => (
                <button
                  key={opt.key}
                  onClick={(e) => handleSelectPrivacy(e, opt.key)}
                  className={`w-full text-left px-2.5 py-1.5 bg-transparent border-none cursor-pointer flex items-center justify-between transition-colors ${
                    currentPrivacy === opt.key ? 'text-[#ff2d78] font-bold bg-[#ff2d78]/10' : 'text-white/80 hover:bg-white/10'
                  }`}
                >
                  <span>{opt.label}</span>
                  {currentPrivacy === opt.key && <span>✓</span>}
                </button>
              ))}
            </div>
          )}
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