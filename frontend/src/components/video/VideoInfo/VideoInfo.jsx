import React from 'react';
import { formatCount, formatTimeAgo, parseHashtags, stripHashtags } from '../../../utils/formatters';
import { MusicIcon } from '../../../icons/ActionIcons';

/*
 VideoInfo — thông tin chi tiết video bên dưới player
 (dùng trong layout dạng list / detail, khác với VideoCardInfo trong feed)
 
 Props:
 video – video object
 */
export default function VideoInfo({ video }) {
  if (!video) return null;

  const user = video.user ?? {};
  const hashtags = parseHashtags(video.caption ?? '');
  const caption = stripHashtags(video.caption ?? '');

  return (
    <div className="px-4 py-3">
      {/* User row */}
      <div className="flex items-center gap-2 mb-2">
        <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-xs font-bold text-white shrink-0">
          {user.initials ?? 'U'}
        </div>
        <div>
          <p className="text-white text-sm font-semibold font-body m-0">
            @{user.username}
          </p>
          <p className="text-text-faint text-xs font-body m-0">
            {formatTimeAgo(video.createdAt)}
          </p>
        </div>
      </div>

      {/* Caption */}
      <p className="text-white/90 text-sm font-body leading-relaxed m-0 mb-1">
        {caption}{' '}
        {hashtags.map((h) => (
          <span key={h} className="text-primary cursor-pointer hover:underline">
            {h}{' '}
          </span>
        ))}
      </p>

      {/* Music */}
      {video.music && (
        <div className="flex items-center gap-2 mt-1.5">
          <MusicIcon />
          <span className="text-text-secondary text-xs font-body">
            {video.music.title} — {video.music.artist}
          </span>
        </div>
      )}

      {/* Stats */}
      <div className="flex items-center gap-4 mt-2.5 text-text-faint text-xs font-body">
        <span>{formatCount(video.likes)} lượt thích</span>
        <span>{formatCount(video.comments)} bình luận</span>
        <span>{formatCount(video.views)} lượt xem</span>
      </div>
    </div>
  );
}