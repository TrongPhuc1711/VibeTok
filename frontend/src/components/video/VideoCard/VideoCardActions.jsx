import React, { useState } from 'react';
import { formatCount } from '../../../utils/formatters';
import {
  HeartIcon,
  CommentIcon,
  ShareIcon,
  BookmarkIcon,
} from '../../../icons/ActionIcons';

/*
 VideoCardActions — cột action dọc bên phải video
 Props:
 video      – video object
 onComment  – () => void
 onLike     – (id, liked) => void
 onShare    – (id) => void
 onBookmark – (id, bookmarked) => void
 */
export default function VideoCardActions({ video, onComment, onLike, onShare, onBookmark }) {
  const [liked, setLiked] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [localLikes, setLocalLikes] = useState(video?.likes ?? 0);

  const handleLike = () => {
    const next = !liked;
    setLiked(next);
    setLocalLikes((p) => (next ? p + 1 : Math.max(0, p - 1)));
    onLike?.(video.id, next);
  };

  const handleBookmark = () => {
    setBookmarked((b) => !b);
    onBookmark?.(video.id, !bookmarked);
  };

  return (
    <div className="absolute right-3 bottom-20 flex flex-col gap-[18px] items-center z-10">
      {/* Avatar + follow */}
      <div className="relative mb-1">
        <div className="w-11 h-11 rounded-full border-2 border-white/30 bg-brand-gradient flex items-center justify-center text-[13px] font-bold text-white">
          {video?.user?.initials ?? 'U'}
        </div>
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary flex items-center justify-center text-white font-bold text-sm leading-none">
          +
        </div>
      </div>

      <ActionBtn
        icon={<HeartIcon filled={liked} />}
        count={formatCount(localLikes)}
        active={liked}
        onClick={handleLike}
      />
      <ActionBtn
        icon={<CommentIcon />}
        count={formatCount(video?.comments)}
        onClick={() => onComment?.(video.id)}
      />
      <ActionBtn
        icon={<ShareIcon />}
        count={formatCount(video?.shares)}
        onClick={() => onShare?.(video.id)}
      />
      <ActionBtn
        icon={<BookmarkIcon filled={bookmarked} />}
        count={formatCount(video?.bookmarks)}
        active={bookmarked}
        onClick={handleBookmark}
      />

      {/* Spinning disc */}
      <div
        className="w-[38px] h-[38px] rounded-full border-4 border-white/20 bg-gradient-to-br from-[#1a1a2e] to-[#2d2d44] flex items-center justify-center"
        style={{ animation: 'spin 4s linear infinite' }}
      >
        <div className="w-3 h-3 rounded-full bg-white/30" />
      </div>

      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

/* ActionBtn */
function ActionBtn({ icon, count, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className="bg-white/10 backdrop-blur-sm border-none rounded-full w-12 h-12 cursor-pointer flex flex-col items-center justify-center gap-0.5"
    >
      {icon}
      <span
        className={`text-[11px] font-semibold font-body leading-none ${active ? 'text-primary' : 'text-white/80'}`}
      >
        {count}
      </span>
    </button>
  );
}