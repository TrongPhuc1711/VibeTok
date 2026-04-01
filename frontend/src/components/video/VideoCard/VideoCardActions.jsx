import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCount } from '../../../utils/formatters';
import { followUser, unfollowUser } from '../../../services/userService';
import { likeVideo, unlikeVideo } from '../../../services/videoService';
import { isLoggedIn } from '../../../utils/helpers';
import {
  HeartIcon, CommentIcon, ShareIcon, BookmarkIcon, MusicIcon,
} from '../../../icons/ActionIcons';
import { PlusIcon } from '../../../icons/NavIcons';

/* ─── localStorage helpers ─── */
const LIKES_KEY     = 'vibetok_liked_videos';
const BOOKMARKS_KEY = 'vibetok_bookmarked_videos';

const getStorageSet = (key) => {
  try { return new Set(JSON.parse(localStorage.getItem(key) || '[]')); }
  catch { return new Set(); }
};
const toggleStorageItem = (key, id) => {
  const set = getStorageSet(key);
  const sid = String(id);
  if (set.has(sid)) set.delete(sid); else set.add(sid);
  localStorage.setItem(key, JSON.stringify([...set]));
  return set.has(sid);
};
const isInStorage = (key, id) => getStorageSet(key).has(String(id));

/* ─── Component ─── */
export default function VideoCardActions({
  video,
  onComment,
  onShare,
  onBookmark,
  inline = false,
}) {
  const navigate = useNavigate();
  const videoId = video?.id;

  /* Khởi tạo state từ localStorage */
  const [liked,         setLiked]         = useState(() => isInStorage(LIKES_KEY, videoId));
  const [bookmarked,    setBookmarked]     = useState(() => isInStorage(BOOKMARKS_KEY, videoId));
  const [following,     setFollowing]      = useState(video?.user?.isFollowing ?? false);
  const [localLikes,    setLocalLikes]     = useState(video?.likes ?? 0);
  const [likeLoading,   setLikeLoading]    = useState(false);
  const [followLoading, setFollowLoading]  = useState(false);

  /* Khi đổi video → đọc lại localStorage */
  useEffect(() => {
    setLiked(isInStorage(LIKES_KEY, videoId));
    setBookmarked(isInStorage(BOOKMARKS_KEY, videoId));
    setLocalLikes(video?.likes ?? 0);
    setFollowing(video?.user?.isFollowing ?? false);
  }, [videoId, video?.likes, video?.user?.isFollowing]);

  const handleLike = async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (likeLoading) return;

    const was = liked;
    const nowLiked = toggleStorageItem(LIKES_KEY, videoId);

    setLiked(nowLiked);
    setLocalLikes(n => was ? Math.max(0, n - 1) : n + 1);
    setLikeLoading(true);
    try {
      if (was) await unlikeVideo(videoId);
      else     await likeVideo(videoId);
    } catch {
      /* rollback localStorage nếu API lỗi */
      toggleStorageItem(LIKES_KEY, videoId);
      setLiked(was);
      setLocalLikes(n => was ? n + 1 : Math.max(0, n - 1));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleBookmark = () => {
    const now = toggleStorageItem(BOOKMARKS_KEY, videoId);
    setBookmarked(now);
    onBookmark?.(videoId, now);
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (followLoading) return;
    const was = following;
    setFollowing(!was);
    setFollowLoading(true);
    try {
      if (was) await unfollowUser(video?.user?.username);
      else     await followUser(video?.user?.username);
    } catch {
      setFollowing(was);
    } finally {
      setFollowLoading(false);
    }
  };

  const user = video?.user ?? {};

  const wrapperCls = inline
    ? 'flex flex-col gap-5 items-center'
    : 'absolute right-3 bottom-20 flex flex-col gap-4 items-center z-10';

  return (
    <div className={wrapperCls}>

      {/* Avatar + Follow */}
      <div className="relative mb-1">
        <div
          onClick={() => user.username && navigate(`/profile/${user.username}`)}
          className="w-[50px] h-[50px] rounded-full border-2 border-white/60 bg-brand-gradient flex items-center justify-center text-[14px] font-bold text-white cursor-pointer overflow-hidden"
        >
          {user.anh_dai_dien
            ? <img src={user.anh_dai_dien} alt={user.username} className="w-full h-full object-cover" />
            : (user.initials ?? 'U')
          }
        </div>
        {!following && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary border-2 border-base flex items-center justify-center cursor-pointer disabled:opacity-60 hover:scale-110 transition-transform"
          >
            <PlusIcon size={9} />
          </button>
        )}
      </div>

      {/* Like — hiệu ứng bounce khi click */}
      <ActionBtn
        icon={<HeartIcon filled={liked} />}
        count={formatCount(localLikes)}
        active={liked}
        onClick={handleLike}
        loading={likeLoading}
        inline={inline}
        animateOnClick
      />

      {/* Comment */}
      <ActionBtn
        icon={<CommentIcon />}
        count={formatCount(video?.comments)}
        onClick={() => onComment?.(video?.id)}
        inline={inline}
      />

      {/* Share */}
      <ActionBtn
        icon={<ShareIcon />}
        count={formatCount(video?.shares)}
        onClick={() => onShare?.(video?.id)}
        inline={inline}
      />

      {/* Bookmark */}
      <ActionBtn
        icon={<BookmarkIcon filled={bookmarked} />}
        count={formatCount(video?.bookmarks)}
        active={bookmarked}
        onClick={handleBookmark}
        inline={inline}
      />

      {/* Music disc */}
      <MusicDisc track={video?.music} />
    </div>
  );
}

/* ── ActionBtn ── */
function ActionBtn({ icon, count, active, onClick, loading, inline, animateOnClick }) {
  const [bounce, setBounce] = useState(false);

  const handleClick = () => {
    if (animateOnClick) {
      setBounce(true);
      setTimeout(() => setBounce(false), 300);
    }
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      className="flex flex-col items-center gap-[3px] bg-transparent border-none cursor-pointer disabled:opacity-50 transition-transform active:scale-90"
      style={{ transform: bounce ? 'scale(1.3)' : 'scale(1)', transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      <div className={`
        rounded-full flex items-center justify-center transition-colors
        ${inline
          ? 'w-[52px] h-[52px] bg-white/10 hover:bg-white/20'
          : 'w-[48px] h-[48px] bg-black/30 backdrop-blur-[2px] hover:bg-white/15'
        }
      `}>
        {icon}
      </div>
      <span className={`text-[12px] font-semibold font-body leading-none drop-shadow text-white ${active ? 'text-primary' : ''}`}>
        {count ?? '0'}
      </span>
    </button>
  );
}

/* ── MusicDisc ── */
function MusicDisc({ track }) {
  return (
    <div title={track ? `${track.title} – ${track.artist}` : 'Nhạc nền'} className="mt-1">
      <div
        className="w-[44px] h-[44px] rounded-full border-4 border-white/20 bg-gradient-to-br from-[#2a1a3e] to-[#0d0d1a] flex items-center justify-center relative overflow-hidden"
        style={{ animation: 'spin 4s linear infinite' }}
      >
        <div className="w-[10px] h-[10px] rounded-full bg-[#161823] border-2 border-white/30 z-10 absolute" />
        <div className="opacity-50"><MusicIcon /></div>
      </div>
    </div>
  );
}