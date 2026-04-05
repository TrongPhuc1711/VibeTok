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

/* localStorage helpers */
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

// ✅ FIX: Sync localStorage — chỉ thêm nếu isLiked=true, không xóa nếu đã có trong localStorage
// Điều này tránh ghi đè tương tác của user bởi giá trị server cũ
const syncLikeStorageSafe = (videoId, serverIsLiked) => {
  const set = getStorageSet(LIKES_KEY);
  const sid = String(videoId);
  // Chỉ ghi đè nếu server nói đã liked (thêm vào set)
  // Không xóa khỏi set nếu server nói chưa liked (vì user có thể đã like sau khi server trả về)
  if (serverIsLiked) {
    set.add(sid);
    localStorage.setItem(LIKES_KEY, JSON.stringify([...set]));
  }
  // Nếu server nói chưa liked, không làm gì — giữ nguyên localStorage
};

export default function VideoCardActions({
  video,
  onComment,
  onShare,
  onBookmark,
  inline = false,
}) {
  const navigate = useNavigate();
  const me = getStoredUser();
  const { showSuccess, showInfo, showWarning, showError } = useToast();
  const videoId = video?.id;

  const isOwnVideo =
    me &&
    (String(me.id) === String(video?.user?.id) ||
      me.username === video?.user?.username ||
      me.ten_dang_nhap === video?.user?.username);

  // ✅ FIX: Ưu tiên localStorage (tương tác mới nhất của user)
  // Chỉ fallback sang server value nếu localStorage không có gì
  const getInitialLiked = () => {
    // localStorage là nguồn tin cậy nhất (cập nhật ngay khi user tương tác)
    if (isInStorage(LIKES_KEY, videoId)) return true;
    // Nếu localStorage không có, dùng giá trị server
    return video?.isLiked ?? false;
  };

  const [liked,         setLiked]         = useState(getInitialLiked);
  const [bookmarked,    setBookmarked]     = useState(() => isInStorage(BOOKMARKS_KEY, videoId));
  const [following,     setFollowing]      = useState(video?.user?.isFollowing ?? false);
  const [localLikes,    setLocalLikes]     = useState(video?.likes ?? 0);
  const [likeLoading,   setLikeLoading]    = useState(false);
  const [followLoading, setFollowLoading]  = useState(false);

  // ✅ FIX: Khi chuyển sang video mới, sync đúng — không ghi đè localStorage bằng server value cũ
  useEffect(() => {
    // Kiểm tra localStorage trước
    const localLiked = isInStorage(LIKES_KEY, videoId);
    if (localLiked) {
      // User đã like (localStorage có) → tin tưởng localStorage
      setLiked(true);
    } else if (video?.isLiked) {
      // Server nói liked → đồng bộ vào localStorage rồi set state
      syncLikeStorageSafe(videoId, true);
      setLiked(true);
    } else {
      // Cả 2 đều chưa liked
      setLiked(false);
    }

    setBookmarked(isInStorage(BOOKMARKS_KEY, videoId));
    setLocalLikes(video?.likes ?? 0);
    setFollowing(video?.user?.isFollowing ?? false);
  }, [videoId]); // ✅ Chỉ phụ thuộc videoId, không phụ thuộc video?.isLiked

  const handleLike = async () => {
    if (!isLoggedIn()) {
      showWarning('Cần đăng nhập', 'Đăng nhập để thích video này');
      navigate('/login');
      return;
    }
    if (likeLoading) return;

    const was = liked;
    // Optimistic update
    setLiked(!was);
    setLocalLikes(n => was ? Math.max(0, n - 1) : n + 1);

    // Cập nhật localStorage ngay lập tức
    if (was) {
      const set = getStorageSet(LIKES_KEY);
      set.delete(String(videoId));
      localStorage.setItem(LIKES_KEY, JSON.stringify([...set]));
    } else {
      const set = getStorageSet(LIKES_KEY);
      set.add(String(videoId));
      localStorage.setItem(LIKES_KEY, JSON.stringify([...set]));
    }

    setLikeLoading(true);
    try {
      if (was) {
        await unlikeVideo(videoId);
      } else {
        await likeVideo(videoId);
        showSuccess('Đã thích video ❤️', `Video của @${video?.user?.username}`);
      }
    } catch {
      // Rollback nếu lỗi
      setLiked(was);
      setLocalLikes(n => was ? n + 1 : Math.max(0, n - 1));
      if (was) {
        const set = getStorageSet(LIKES_KEY);
        set.add(String(videoId));
        localStorage.setItem(LIKES_KEY, JSON.stringify([...set]));
      } else {
        const set = getStorageSet(LIKES_KEY);
        set.delete(String(videoId));
        localStorage.setItem(LIKES_KEY, JSON.stringify([...set]));
      }
      showError('Thao tác thất bại', 'Không thể thực hiện, thử lại sau');
    } finally {
      setLikeLoading(false);
    }
  };

  const handleBookmark = () => {
    if (!isLoggedIn()) {
      showWarning('Cần đăng nhập', 'Đăng nhập để lưu video');
      navigate('/login');
      return;
    }
    const now = toggleStorageItem(BOOKMARKS_KEY, videoId);
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
      showWarning('Cần đăng nhập', 'Đăng nhập để theo dõi creator này');
      navigate('/login');
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
        onClick={() => onComment?.(video?.id)}
        inline={inline}
      />

      {/* Share */}
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