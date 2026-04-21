import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCount } from '../../../utils/formatters';
import { followUser, unfollowUser } from '../../../services/userService';
import { likeVideo, unlikeVideo } from '../../../services/videoService';
import { isLoggedIn, getStoredUser } from '../../../utils/helpers';
import { HeartIcon, CommentIcon, ShareIcon, BookmarkIcon } from '../../../icons/ActionIcons';
import { PlusIcon } from '../../../icons/NavIcons';
import MusicDisc from './MusicDisc';
import { useToast } from '../../ui/Toast';
import LoginPromptModal from '../../ui/LoginPromptModal';
import { useBookmark } from '../../../hooks/useBookmark';

export default function VideoCardActions({ video, onComment, onShare, onBookmark, inline = false }) {
  const navigate = useNavigate();
  const me = getStoredUser();
  const { showSuccess, showInfo, showError } = useToast();
  const videoId = video?.id;

  const [loginPrompt, setLoginPrompt] = useState({ open: false, action: 'like' });

  const isOwnVideo = me && (
    String(me.id) === String(video?.user?.id) ||
    me.username === video?.user?.username
  );

  // Like state - from DB
  const [liked, setLiked] = useState(Boolean(video?.isLiked));
  const [localLikes, setLocalLikes] = useState(video?.likes ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);

  // Bookmark state - from DB
  const { bookmarked, toggle: toggleBookmarkDB, loading: bookmarkLoading } = useBookmark(
    videoId,
    Boolean(video?.isBookmarked)
  );

  // Follow state - from DB
  const [following, setFollowing] = useState(Boolean(video?.user?.isFollowing));
  const [followLoading, setFollowLoading] = useState(false);

  // Sync when video changes
  useEffect(() => {
    setLiked(Boolean(video?.isLiked));
    setLocalLikes(video?.likes ?? 0);
    setFollowing(Boolean(video?.user?.isFollowing));
  }, [videoId, video?.isLiked, video?.user?.isFollowing]);

  const promptLogin = (action) => setLoginPrompt({ open: true, action });

  const handleLike = async () => {
    if (!isLoggedIn()) { promptLogin('like'); return; }
    if (likeLoading) return;
    const was = liked;
    setLiked(!was);
    setLocalLikes(n => was ? Math.max(0, n - 1) : n + 1);
    setLikeLoading(true);
    try {
      if (was) await unlikeVideo(videoId);
      else { await likeVideo(videoId); showSuccess('Đã thích video ❤️', `@${video?.user?.username}`); }
    } catch {
      setLiked(was);
      setLocalLikes(n => was ? n + 1 : Math.max(0, n - 1));
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = () => {
    if (!isLoggedIn()) { promptLogin('comment'); return; }
    onComment?.(videoId);
  };

  const handleBookmark = async () => {
    if (!isLoggedIn()) { promptLogin('bookmark'); return; }
    const result = await toggleBookmarkDB();
    if (result === null) return;
    onBookmark?.(videoId, result);
    if (result) showSuccess('Đã lưu video', 'Thêm vào danh sách lưu');
    else showInfo('Đã bỏ lưu', 'Xóa khỏi danh sách lưu');
  };

  const handleShare = () => {
    const url = `${window.location.origin}/video/${videoId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url)
        .then(() => showSuccess('Đã sao chép link!', 'Chia sẻ với bạn bè'))
        .catch(() => showInfo('Link video', url));
    }
    onShare?.(videoId);
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn()) { promptLogin('follow'); return; }
    if (followLoading || !video?.user?.username) return;
    const was = following;
    setFollowing(!was);
    setFollowLoading(true);
    try {
      if (was) { await unfollowUser(video.user.username); showInfo('Đã bỏ follow', `@${video.user.username}`); }
      else { await followUser(video.user.username); showSuccess('Đã follow!', `@${video.user.username}`); }
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
    <>
      <div className={wrapperCls}>
        {/* Avatar + Follow */}
        <div className="relative mb-1">
          <div
            onClick={() => user.username && navigate(`/profile/${user.username}`)}
            className="w-[50px] h-[50px] rounded-full border-2 border-white/60 bg-brand-gradient flex items-center justify-center text-[14px] font-bold text-white cursor-pointer overflow-hidden"
          >
            {user.anh_dai_dien
              ? <img src={user.anh_dai_dien} alt={user.username} className="w-full h-full object-cover" onError={(e) => { e.target.style.display = 'none'; }} />
              : (user.initials ?? 'U')
            }
          </div>
          {!isOwnVideo && !following && (
            <button onClick={handleFollow} disabled={followLoading}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary border-2 border-base flex items-center justify-center cursor-pointer disabled:opacity-60 hover:scale-110 transition-transform"
              aria-label="Follow">
              <PlusIcon size={9} />
            </button>
          )}
        </div>

        {/* Like */}
        <ActionBtn icon={<HeartIcon filled={liked} />} count={formatCount(localLikes)} active={liked}
          onClick={handleLike} loading={likeLoading} inline={inline} animateOnClick ariaLabel={liked ? 'Bỏ thích' : 'Thích'} />

        {/* Comment */}
        <ActionBtn icon={<CommentIcon />} count={formatCount(video?.comments)}
          onClick={handleComment} inline={inline} ariaLabel="Bình luận" />

        {/* Share */}
        <ActionBtn icon={<ShareIcon />} count={formatCount(video?.shares)}
          onClick={handleShare} inline={inline} ariaLabel="Chia sẻ" />

        {/* Bookmark - DB */}
        <ActionBtn icon={<BookmarkIcon filled={bookmarked} />} count={null} active={bookmarked}
          onClick={handleBookmark} loading={bookmarkLoading} inline={inline} ariaLabel={bookmarked ? 'Bỏ lưu' : 'Lưu video'} />

        <MusicDisc track={video?.music} />
      </div>

      <LoginPromptModal
        open={loginPrompt.open}
        onClose={() => setLoginPrompt({ open: false, action: 'like' })}
        action={loginPrompt.action}
      />
    </>
  );
}

function ActionBtn({ icon, count, active, onClick, loading, inline, animateOnClick, ariaLabel }) {
  const [bounce, setBounce] = useState(false);

  const handleClick = () => {
    if (animateOnClick) { setBounce(true); setTimeout(() => setBounce(false), 300); }
    onClick?.();
  };

  return (
    <button
      onClick={handleClick}
      disabled={loading}
      aria-label={ariaLabel}
      className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer disabled:opacity-50 active:scale-90"
      style={{ transform: bounce ? 'scale(1.3)' : 'scale(1)', transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)' }}
    >
      <div className={`w-[52px] h-[52px] rounded-full flex items-center justify-center transition-colors ${inline ? 'bg-black/8 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/20' : 'hover:bg-white/10'}`}>
        {icon}
      </div>
      {count != null && (
        <span className="text-[13px] font-semibold font-body leading-none"
          style={{ color: active ? '#ff2d78' : 'var(--color-text-primary)' }}>
          {count}
        </span>
      )}
    </button>
  );
}