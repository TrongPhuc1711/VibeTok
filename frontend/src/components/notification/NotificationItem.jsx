import React from 'react';
import { formatTimeAgo } from '../../utils/formatters';
import { HeartIcon, CommentIcon, MusicIcon } from '../../icons/ActionIcons';

/* Icon nhỏ hiển thị loại thông báo */
function TypeIcon({ type }) {
  if (type === 'like')    return <HeartIcon filled />;
  if (type === 'comment') return <CommentIcon />;
  if (type === 'duet')    return <MusicIcon />;
  if (type === 'follow')  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="rgba(255,255,255,.8)">
      <path d="M8 1a4 4 0 1 1 0 8A4 4 0 0 1 8 1zm0 10c-5.33 0-8 2.67-8 4v1h16v-1c0-1.33-2.67-4-8-4z"/>
    </svg>
  );
  if (type === 'mention') return <span style={{ color: 'rgba(255,255,255,.8)', fontSize: 10, fontWeight: 700 }}>@</span>;
  return <HeartIcon />;
}

const TYPE_TEXT = {
  like:    'đã thích video của bạn',
  follow:  'đã bắt đầu theo dõi bạn',
  comment: 'đã bình luận về video của bạn',
  mention: 'đã nhắc đến bạn trong bình luận',
  duet:    'đã tạo duet với video của bạn',
};

export default function NotificationItem({ notif, onClick }) {
  const name = notif.actor?.fullName || notif.actor?.username || 'Ai đó';
  const text = TYPE_TEXT[notif.type] ?? 'đã tương tác với bạn';

  return (
    <div
      onClick={() => onClick?.(notif)}
      className={`
        flex items-start gap-3 px-4 py-3 cursor-pointer transition-colors
        border-b border-[#1a1a2a] last:border-0
        ${notif.read
          ? 'hover:bg-white/[0.02]'
          : 'bg-[#ff2d78]/[0.04] hover:bg-[#ff2d78]/[0.07]'
        }
      `}
    >
      {/* Avatar actor */}
      <div className="relative shrink-0">
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center text-[11px] font-bold text-white overflow-hidden"
          style={{ background: notif.actor?.color || 'linear-gradient(135deg,#ff2d78,#ff6b35)' }}
        >
          {notif.actor?.anh_dai_dien
            ? <img src={notif.actor.anh_dai_dien} alt="" className="w-full h-full object-cover" />
            : notif.actor?.initials ?? 'U'
          }
        </div>

        {/* Type icon badge */}
        <div className="absolute -bottom-1 -right-1 w-[18px] h-[18px] rounded-full bg-[#111118] border border-[#1e1e2e] flex items-center justify-center">
          <TypeIcon type={notif.type} />
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[13px] font-body leading-relaxed m-0">
          <span className="text-white font-semibold">{name}</span>
          {' '}
          <span className="text-[#aaa]">{text}</span>
        </p>

        {notif.meta?.comment && (
          <p className="text-[#555] text-[11px] font-body mt-0.5 truncate">
            "{notif.meta.comment}"
          </p>
        )}

        <p className="text-[#444] text-[11px] font-body mt-0.5">
          {formatTimeAgo(notif.createdAt)}
        </p>
      </div>

      {/* Video thumbnail placeholder */}
      {notif.meta?.videoId && (
        <div className="w-8 h-10 rounded shrink-0 bg-gradient-to-br from-[#ff2d7815] to-[#ff6b3515] border border-[#2a2a3e] flex items-center justify-center text-[13px]">
          🎬
        </div>
      )}

      {/* Unread dot */}
      {!notif.read && (
        <div className="w-2 h-2 rounded-full bg-[#ff2d78] shrink-0 mt-1.5" />
      )}
    </div>
  );
}