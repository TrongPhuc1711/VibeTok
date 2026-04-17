import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { formatCount } from '../../../utils/formatters';
import { followUser, unfollowUser } from '../../../services/userService';
import { likeVideo, unlikeVideo } from '../../../services/videoService';
import { isLoggedIn, getStoredUser } from '../../../utils/helpers';
import {
  HeartIcon, CommentIcon, ShareIcon, BookmarkIcon, MusicIcon,
} from '../../../icons/ActionIcons';
import { PlusIcon } from '../../../icons/NavIcons';
import { useToast } from '../../ui/Toast';
import LoginPromptModal from '../../ui/LoginPromptModal';

/* Bookmark vẫn dùng localStorage vì chưa có API */
const BOOKMARKS_KEY = 'vibetok_bookmarked_videos';
const getBookmarkSet = () => {
  try { return new Set(JSON.parse(localStorage.getItem(BOOKMARKS_KEY) || '[]')); }
  catch { return new Set(); }
};
const toggleBookmarkLocal = (id) => {
  const set = getBookmarkSet();
  const sid = String(id);
  if (set.has(sid)) set.delete(sid); else set.add(sid);
  localStorage.setItem(BOOKMARKS_KEY, JSON.stringify([...set]));
  return set.has(sid);
};
const isBookmarked = (id) => getBookmarkSet().has(String(id));

export default function VideoCardActions({
  video,
  onComment,
  onShare,
  onBookmark,
  inline = false,
}) {
  const navigate = useNavigate();
  const me = getStoredUser();
  const { showSuccess, showInfo, showError } = useToast();
  const videoId = video?.id;

  // State cho LoginPromptModal
  const [loginPrompt, setLoginPrompt] = useState({ open: false, action: 'like' });

  const isOwnVideo =
    me &&
    (String(me.id) === String(video?.user?.id) ||
      me.username === video?.user?.username ||
      me.ten_dang_nhap === video?.user?.username);

  // ✅ FIX: Lấy isLiked trực tiếp từ DB (video.isLiked), không dùng localStorage
  const [liked, setLiked] = useState(Boolean(video?.isLiked));
  const [bookmarked, setBookmarked] = useState(() => isBookmarked(videoId));
  const [following, setFollowing] = useState(Boolean(video?.user?.isFollowing));
  const [localLikes, setLocalLikes] = useState(video?.likes ?? 0);
  const [likeLoading, setLikeLoading] = useState(false);
  const [followLoading, setFollowLoading] = useState(false);

  // ✅ FIX: Khi chuyển video mới, sync từ DB không qua localStorage
  useEffect(() => {
    setLiked(Boolean(video?.isLiked));
    setLocalLikes(video?.likes ?? 0);
    setFollowing(Boolean(video?.user?.isFollowing));
    setBookmarked(isBookmarked(videoId));
  }, [videoId, video?.isLiked, video?.user?.isFollowing]);

  /* Helper: mở login prompt với action tương ứng */
  const promptLogin = (action) => setLoginPrompt({ open: true, action });

  const handleLike = async () => {
    if (!isLoggedIn()) {
      promptLogin('like');
      return;
    }
    if (likeLoading) return;

    const was = liked;
    setLiked(!was);
    setLocalLikes(n => was ? Math.max(0, n - 1) : n + 1);

    setLikeLoading(true);
    try {
      if (was) {
        await unlikeVideo(videoId);
      } else {
        await likeVideo(videoId);
        showSuccess('Đã thích video ❤️', `Video của @${video?.user?.username}`);
      }
    } catch {
      setLiked(was);
      setLocalLikes(n => was ? n + 1 : Math.max(0, n - 1));
      showError('Thao tác thất bại', 'Không thể thực hiện, thử lại sau');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleComment = () => {
    if (!isLoggedIn()) {
      promptLogin('comment');
      return;
    }
    onComment?.(video?.id);
  };

  const handleBookmark = () => {
    if (!isLoggedIn()) {
      promptLogin('bookmark');
      return;
    }
    const now = toggleBookmarkLocal(videoId);
    setBookmarked(now);
    onBookmark?.(videoId, now);
    if (now) {
      showSuccess('Đã lưu video', 'Video đã được thêm vào danh sách lưu');
    } else {
      showInfo('Đã bỏ lưu', 'Video đã được xóa khỏi danh sách lưu');
    }
  };

  const handleShare = () => {
    const url = `${window.location.origin}/video/${videoId}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => {
        showSuccess('Đã sao chép link!', 'Chia sẻ link video với bạn bè của bạn');
      });
    } else {
      showInfo('Chia sẻ video', url);
    }
    onShare?.(videoId);
  };

  const handleFollow = async (e) => {
    e.stopPropagation();
    if (!isLoggedIn()) {
      promptLogin('follow');
      return;
    }
    if (followLoading) return;
    const was = following;
    setFollowing(!was);
    setFollowLoading(true);
    try {
      if (was) {
        await unfollowUser(video?.user?.username);
        showInfo('Đã bỏ follow', `@${video?.user?.username}`);
      } else {
        await followUser(video?.user?.username);
        showSuccess('Đã follow!', `Bạn đang theo dõi @${video?.user?.username}`);
      }
    } catch {
      setFollowing(was);
      showError('Thao tác thất bại', 'Không thể thực hiện, thử lại sau');
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
        {/* Avatar + Follow button */}
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

          {!isOwnVideo && !following && (
            <button
              onClick={handleFollow}
              disabled={followLoading}
              className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-5 h-5 rounded-full bg-primary border-2 border-base flex items-center justify-center cursor-pointer disabled:opacity-60 hover:scale-110 transition-transform"
            >
              <PlusIcon size={9} />
            </button>
          )}
        </div>

        {/* Like */}
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
          onClick={handleComment}
          inline={inline}
        />

        {/* Share — không cần đăng nhập */}
        <ActionBtn
          icon={<ShareIcon />}
          count={formatCount(video?.shares)}
          onClick={handleShare}
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

      {/* Login Prompt Modal */}
      <LoginPromptModal
        open={loginPrompt.open}
        onClose={() => setLoginPrompt({ open: false, action: 'like' })}
        action={loginPrompt.action}
      />
    </>
  );
}

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
      className="flex flex-col items-center gap-1 bg-transparent border-none cursor-pointer disabled:opacity-50 active:scale-90"
      style={{
        transform: bounce ? 'scale(1.3)' : 'scale(1)',
        transition: 'transform 0.15s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <div
        className={`
          w-[52px] h-[52px] rounded-full flex items-center justify-center transition-colors
          ${inline
            ? 'bg-black/8 hover:bg-black/15 dark:bg-white/10 dark:hover:bg-white/20'
            : 'hover:bg-white/10'
          }
        `}
      >
        {icon}
      </div>
      <span
        className="text-[13px] font-semibold font-body leading-none"
        style={{ color: active ? '#ff2d78' : 'var(--color-text-primary)' }}
      >
        {count ?? '0'}
      </span>
    </button>
  );
}

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