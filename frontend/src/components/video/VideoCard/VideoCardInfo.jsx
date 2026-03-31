import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { parseHashtags, stripHashtags } from '../../../utils/formatters';
import { followUser, unfollowUser } from '../../../services/userService';
import { isLoggedIn } from '../../../utils/helpers';

/*
  VideoCardInfo — vùng thông tin phía dưới trái video
  user, caption, music
 */
export default function VideoCardInfo({ video }) {
  const navigate = useNavigate();
  const [following, setFollowing] = useState(video?.user?.isFollowing ?? false);
  const [loading, setLoading] = useState(false);

  const user = video?.user ?? {};
  const hashtags = parseHashtags(video?.caption ?? '');
  const captionText = stripHashtags(video?.caption ?? '');

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (loading) return;

    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setLoading(true);
    try {
      if (wasFollowing) {
        await unfollowUser(user.username);
      } else {
        await followUser(user.username);
      }
    } catch {
      // rollback nếu lỗi
      setFollowing(wasFollowing);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="absolute bottom-0 left-0 right-[60px] px-5 pt-20 pb-5 z-10"
      style={{ background: 'linear-gradient(to top,rgba(0,0,0,.8),transparent)' }}
    >
      {/* User row */}
      <div className="flex items-center gap-2.5 mb-2.5">
        <div
          className="w-11 h-11 rounded-full bg-brand-gradient flex items-center justify-center text-sm font-bold text-white border-2 border-white/30 cursor-pointer"
          onClick={() => user.username && navigate(`/profile/${user.username}`)}
        >
          {user.initials ?? 'U'}
        </div>

        <span
          className="text-white text-sm font-semibold font-body cursor-pointer hover:underline"
          onClick={() => user.username && navigate(`/profile/${user.username}`)}
        >
          @{user.username ?? 'user'}
        </span>

        {user.isCreator && (
          <span className="bg-brand-gradient text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full">
            Creator
          </span>
        )}

        {/* Follow / Đang follow button */}
        <button
          onClick={handleFollow}
          disabled={loading}
          className={`
            ml-1 border text-white text-xs px-3 py-0.5 rounded-sm cursor-pointer bg-transparent transition-colors
            disabled:opacity-50 disabled:cursor-not-allowed
            ${following
              ? 'border-border2 text-text-faint hover:border-red-500/40 hover:text-red-400'
              : 'border-white/50 hover:border-primary hover:text-primary'
            }
          `}
        >
          {following ? 'Đang follow' : '+ Follow'}
        </button>
      </div>

      {/* Caption + hashtags */}
      <p className="text-white/90 text-sm font-body leading-relaxed m-0 mb-2">
        {captionText}{' '}
        {hashtags.map((h) => (
          <span key={h} className="text-primary font-medium">
            {h}{' '}
          </span>
        ))}
      </p>

      {/* Music */}
      {video?.music && (
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-white/60 shrink-0" />
          <span className="text-white/70 text-xs font-body">
            {video.music.title} – {video.music.artist} · Trending
          </span>
        </div>
      )}
    </div>
  );
}