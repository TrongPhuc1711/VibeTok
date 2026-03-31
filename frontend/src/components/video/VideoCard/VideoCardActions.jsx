import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCount } from '../../../utils/formatters';
import { followUser, unfollowUser } from '../../../services/userService';
import { likeVideo, unlikeVideo } from '../../../services/videoService';
import { isLoggedIn } from '../../../utils/helpers';
import {
  HeartIcon,
  CommentIcon,
  ShareIcon,
  BookmarkIcon,
  MusicIcon,
} from '../../../icons/ActionIcons';
import { PlusIcon } from '../../../icons/NavIcons';

/*
  VideoCardActions — cột action dọc bên phải video (style TikTok)

  Props:
    video      – video object
    onComment  – () => void
    onShare    – (id) => void
    onBookmark – (id, bookmarked) => void
*/
export default function VideoCardActions({ video, onComment, onShare, onBookmark }) {
  const navigate = useNavigate();

  const [liked, setLiked] = useState(video?.isLiked ?? false);
  const [bookmarked, setBookmarked] = useState(video?.isSaved ?? false);
  const [following, setFollowing] = useState(video?.user?.isFollowing ?? false);
  const [localLikes, setLocalLikes] = useState(video?.likes ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  /* ─── Like ─── */
  const handleLike = async () => {
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (likeLoading) return;
    const wasLiked = liked;
    setLiked(!wasLiked);
    setLocalLikes(n => wasLiked ? Math.max(0, n - 1) : n + 1);
    setLikeLoading(true);
    try {
      if (wasLiked) await unlikeVideo(video.id);
      else await likeVideo(video.id);
    } catch {
      setLiked(wasLiked);
      setLocalLikes(n => wasLiked ? n + 1 : Math.max(0, n - 1));
    } finally {
      setLikeLoading(false);
    }
  };

  /* ─── Bookmark ─── */
  const handleBookmark = () => {
    setBookmarked(b => !b);
    onBookmark?.(video?.id, !bookmarked);
  };

  /* ─── Follow ─── */
  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn()) { navigate('/login'); return; }
    if (followLoading) return;
    const wasFollowing = following;
    setFollowing(!wasFollowing);
    setFollowLoading(true);
    try {
      if (wasFollowing) await unfollowUser(video?.user?.username);
      else await followUser(video?.user?.username);
    } catch {
      setFollowing(wasFollowing);
    } finally {
      setFollowLoading(false);
    }
  };

  const user = video?.user ?? {};

  return (
    <div className="absolute right-3 bottom-20 flex flex-col gap-4 items-center z-10">

      {/* ── Avatar + Follow ── */}
      <div className="relative mb-2">
        <div
          className="w-[46px] h-[46px] rounded-full border-2 border-white/60 bg-brand-gradient
                     flex items-center justify-center text-[14px] font-bold text-white
                     cursor-pointer overflow-hidden"
          onClick={() => user.username && navigate(`/profile/${user.username}`)}
        >
          {user.anh_dai_dien
            ? <img src={user.anh_dai_dien} alt={user.username} className="w-full h-full object-cover" />
            : (user.initials ?? 'U')
          }
        </div>

        {/* Nút + follow — ẩn khi đã follow */}
        {!following && (
          <button
            onClick={handleFollow}
            disabled={followLoading}
            className="absolute -bottom-2 left-1/2 -translate-x-1/2
                       w-5 h-5 rounded-full bg-primary border-2 border-base
                       flex items-center justify-center cursor-pointer
                       disabled:opacity-60 transition-transform hover:scale-110"
            title="Follow"
          >
            <PlusIcon size={9} />
          </button>
        )}
      </div>

      {/* ── Like ── */}
      <ActionBtn
        icon={<HeartIcon filled={liked} />}
        count={formatCount(localLikes)}
        active={liked}
        onClick={handleLike}
        loading={likeLoading}
      />

      {/* ── Comment ── */}
      <ActionBtn
        icon={<CommentIcon />}
        count={formatCount(video?.comments)}
        onClick={() => onComment?.(video?.id)}
      />

      {/* ── Share ── */}
      <ActionBtn
        icon={<ShareIcon />}
        count={formatCount(video?.shares)}
        onClick={() => onShare?.(video?.id)}
      />

      {/* ── Bookmark ── */}
      <ActionBtn
        icon={<BookmarkIcon filled={bookmarked} />}
        count={formatCount(video?.bookmarks)}
        active={bookmarked}
        onClick={handleBookmark}
      />

      {/* ── Đĩa nhạc quay ── */}
      <MusicDisc track={video?.music} />
    </div>
  );
}

/* ─── ActionBtn ──────────────────────────────────────── */
function ActionBtn({ icon, count, active, onClick, loading }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="flex flex-col items-center gap-[3px] bg-transparent border-none cursor-pointer
                 disabled:opacity-50 group transition-transform active:scale-90"
    >
      <div className="w-[48px] h-[48px] rounded-full flex items-center justify-center
                      bg-black/30 backdrop-blur-[2px]
                      group-hover:bg-white/15 transition-colors">
        {icon}
      </div>
      <span className={`text-[12px] font-semibold font-body leading-none drop-shadow
        ${active ? 'text-primary' : 'text-white'}`}>
        {count ?? '0'}
      </span>
    </button>
  );
}

/* ─── MusicDisc ─────────────────────────────────────── */
function MusicDisc({ track }) {
  return (
    <div
      className="mt-1 flex flex-col items-center gap-1"
      title={track ? `${track.title} – ${track.artist}` : 'Nhạc nền'}
    >
      <div
        className="w-[40px] h-[40px] rounded-full border-4 border-white/20
                   bg-gradient-to-br from-[#2a1a3e] to-[#0d0d1a]
                   flex items-center justify-center relative overflow-hidden"
        style={{ animation: 'spin 4s linear infinite' }}
      >
        <div className="w-[10px] h-[10px] rounded-full bg-[#161823] border-2 border-white/30 z-10 absolute" />
        <div className="opacity-50">
          <MusicIcon />
        </div>
      </div>
    </div>
  );
}