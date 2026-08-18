import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVideoById, getComments, postComment, likeVideo, unlikeVideo, shareVideo as shareVideoApi, repostVideo as repostVideoApi } from '../../../services/videoService';
import { followUser, unfollowUser } from '../../../services/userService';
import { formatCount, formatTimeAgo, parseHashtags, stripHashtags } from '../../../utils/formatters';
import { isLoggedIn, getStoredUser } from '../../../utils/helpers';
import Avatar from '../../common/Avatar/avatar';
import { ImageSlideshow } from '../../ui/ImageSlideshow';
import { useToast } from '../../ui/Toast';
import LoginPromptModal from '../../ui/LoginPromptModal';
import { useBookmark } from '../../../hooks/useBookmark';
import ShareSheet from '../ShareSheet/ShareSheet';
import { HeartIcon, CommentIcon, ShareIcon, BookmarkIcon } from '../../../icons/ActionIcons';

export default function VideoDetailOverlay({ videoId, highlightComment = false, onClose }) {
  const navigate = useNavigate();
  const me = getStoredUser();
  const { showSuccess, showInfo, showError } = useToast();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [visible, setVisible] = useState(false);

  const [comments, setComments] = useState([]);
  const [cmtLoading, setCmtLoading] = useState(true);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Bookmark, Share & Login states
  const { bookmarked, toggle: toggleBookmarkDB, loading: bookmarkLoading } = useBookmark(
    videoId,
    Boolean(video?.isBookmarked)
  );
  const [bookmarkCount, setBookmarkCount] = useState(0);
  const [shareCount, setShareCount] = useState(0);
  const [reposted, setReposted] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState({ open: false, action: 'like' });

  const videoRef = useRef(null);
  const inputRef = useRef(null);
  const commentRef = useRef(null);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  useEffect(() => {
    const h = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', h);
    return () => document.removeEventListener('keydown', h);
  }, []);

  useEffect(() => {
    if (!videoId) return;
    setLoading(true);
    getVideoById(videoId)
      .then(r => {
        const v = r.data.video;
        setVideo(v);
        setLikeCount(v.likes || 0);
        setLiked(Boolean(v.isLiked));
        setFollowing(Boolean(v.user?.isFollowing));
        setBookmarkCount(v.bookmarks || 0);
        setShareCount(v.shares || 0);
        setReposted(Boolean(v.isReposted));
      })
      .catch(() => setVideo(null))
      .finally(() => setLoading(false));
  }, [videoId]);

  useEffect(() => {
    if (!videoId) return;
    setCmtLoading(true);
    getComments(videoId)
      .then(r => setComments(r.data.comments || []))
      .catch(() => setComments([]))
      .finally(() => setCmtLoading(false));
  }, [videoId]);

  useEffect(() => {
    if (highlightComment && commentRef.current && !cmtLoading) {
      setTimeout(() => {
        commentRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        inputRef.current?.focus();
      }, 400);
    }
  }, [highlightComment, cmtLoading]);

  useEffect(() => {
    const v = videoRef.current;
    if (!v || loading || !video) return;
    v.play().then(() => setPlaying(true)).catch(() => { });
  }, [loading, video]);

  const handleClose = () => {
    setVisible(false);
    videoRef.current?.pause();
    setTimeout(onClose, 280);
  };

  const handleTogglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else { v.pause(); setPlaying(false); }
  };

  const promptLogin = (action) => setLoginPrompt({ open: true, action });

  const handleLike = async () => {
    if (!isLoggedIn()) { promptLogin('like'); return; }
    const was = liked;
    const nextState = !was;
    const nextCount = was ? Math.max(0, likeCount - 1) : likeCount + 1;

    setLiked(nextState);
    setLikeCount(nextCount);
    if (video) {
      video.isLiked = nextState;
      video.likes = nextCount;
    }
    try {
      if (was) await unlikeVideo(videoId);
      else {
        await likeVideo(videoId);
        showSuccess('Đã thích video ❤️', `@${video?.user?.username}`);
      }
    } catch {
      setLiked(was);
      setLikeCount(likeCount);
      if (video) {
        video.isLiked = was;
        video.likes = likeCount;
      }
    }
  };

  const handleBookmark = async () => {
    if (!isLoggedIn()) { promptLogin('bookmark'); return; }
    if (bookmarkLoading) return;
    const wasBk = Boolean(bookmarked);
    const nextBk = !wasBk;
    const nextCount = wasBk ? Math.max(0, bookmarkCount - 1) : bookmarkCount + 1;

    setBookmarkCount(nextCount);
    if (video) {
      video.isBookmarked = nextBk;
      video.bookmarks = nextCount;
    }

    const result = await toggleBookmarkDB();
    if (result === null) {
      setBookmarkCount(bookmarkCount);
      if (video) {
        video.isBookmarked = wasBk;
        video.bookmarks = bookmarkCount;
      }
      return;
    }

    if (video) {
      video.isBookmarked = result;
    }
    if (result) showSuccess('Đã lưu video', 'Thêm vào danh sách lưu');
    else showInfo('Đã bỏ lưu', 'Xóa khỏi danh sách lưu');
  };

  const handleShare = () => {
    setShareOpen(true);
  };

  const handleShareDone = () => {
    setShareCount(n => n + 1);
    if (video) video.shares = (video.shares || 0) + 1;
    shareVideoApi(videoId).catch(() => {
      setShareCount(n => Math.max(0, n - 1));
    });
  };

  const handleRepost = async () => {
    if (!isLoggedIn()) { promptLogin('repost'); return; }
    const was = reposted;
    setReposted(!was);
    try {
      const res = await repostVideoApi(videoId);
      setReposted(res.data.reposted);
      if (res.data.reposted) {
        showSuccess('Đã đăng lại!', `Video của @${video?.user?.username}`);
      } else {
        showInfo('Đã bỏ đăng lại', 'Xóa khỏi danh sách đăng lại');
      }
    } catch {
      setReposted(was);
      showError('Lỗi', 'Không thể đăng lại video này');
    }
  };

  const handleFollow = async () => {
    if (!video?.user?.username) return;
    const was = following;
    setFollowing(!was);
    try {
      if (was) await unfollowUser(video.user.username);
      else await followUser(video.user.username);
    } catch { setFollowing(was); }
  };

  const handleComment = async () => {
    if (!input.trim() || submitting) return;
    setSubmitting(true);
    try {
      const r = await postComment(videoId, { content: input.trim() });
      setComments(p => [r.data.comment, ...p]);
      setInput('');
    } catch {/* ignore */ }
    finally { setSubmitting(false); }
  };

  const hashtags = parseHashtags(video?.caption ?? '');
  const captionTxt = stripHashtags(video?.caption ?? '');
  const isSlideshow = video?.videoUrl?.startsWith('["') && video?.videoUrl?.endsWith('"]');
  const imagesArray = isSlideshow ? JSON.parse(video.videoUrl).map((url, i) => ({ id: String(i), url })) : [];

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{
        background: 'rgba(0,0,0,0.92)',
        backdropFilter: 'blur(12px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'scale(1)' : 'scale(0.97)',
        transition: 'opacity 0.28s ease, transform 0.28s ease',
      }}
      onClick={(e) => { if (e.target === e.currentTarget) handleClose(); }}
    >
      <button
        onClick={handleClose}
        className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 border-none text-white text-xl cursor-pointer flex items-center justify-center transition-colors z-10"
      >
        ✕
      </button>

      {loading ? (
        <div className="flex items-center justify-center w-full h-full">
          <div className="w-8 h-8 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        </div>
      ) : !video ? (
        <div className="text-white/40 text-center font-body">
          <span className="text-4xl block mb-3">🎬</span>
          <p>Không tìm thấy video</p>
        </div>
      ) : (
        <div
          className="flex h-[92vh] max-h-[860px] w-[96vw] max-w-[1100px] rounded-2xl overflow-hidden shadow-2xl border"
          style={{
            background: 'var(--vt-card)',
            borderColor: 'var(--color-border)',
          }}
        >
          {/* LEFT: Video */}
          <div
            className="relative flex-shrink-0 bg-black flex items-center justify-center"
            style={{ width: 400 }}
          >
            {isSlideshow ? (
              <div className="absolute inset-0 w-full h-full z-[1]">
                <ImageSlideshow
                  images={imagesArray}
                  autoPlay={true}
                  duration={3000}
                />
              </div>
            ) : video.videoUrl ? (
              <video
                ref={videoRef}
                src={video.videoUrl}
                loop playsInline
                onClick={handleTogglePlay}
                className="w-full h-full object-cover cursor-pointer"
                style={{ maxHeight: '92vh' }}
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#1a0a2e,#0a0a1a)' }}
              >
              </div>
            )}

            {video.videoUrl && !isSlideshow && !playing && (
              <div
                onClick={handleTogglePlay}
                className="absolute inset-0 flex items-center justify-center cursor-pointer bg-black/20"
              >
                <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                    <path d="M5 3l14 9-14 9V3z" />
                  </svg>
                </div>
              </div>
            )}

            <div
              className="absolute bottom-0 left-0 right-0 p-5 pt-16 pointer-events-none"
              style={{ background: 'linear-gradient(to top, rgba(0,0,0,.8), transparent)' }}
            >
              <p
                className="font-bold text-[15px] font-body mb-1 cursor-pointer pointer-events-auto hover:underline w-fit"
                style={{ color: '#ffffff', textShadow: '0 1px 4px rgba(0,0,0,0.8)' }}
                onClick={() => { handleClose(); navigate(`/profile/${video.user?.username}`); }}
              >
                @{video.user?.username}
              </p>
              <p className="text-[13px] font-body leading-snug" style={{ color: '#f1f1f2', textShadow: '0 1px 3px rgba(0,0,0,0.7)' }}>
                {captionTxt}{' '}
                {hashtags.map(h => (
                  <span key={h} className="font-bold" style={{ color: '#ffffff' }}>{h} </span>
                ))}
              </p>
              {video.music && (
                <div className="flex items-center gap-1.5 mt-2 pointer-events-auto">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(255,255,255,.9)">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                  <span className="text-[11px] font-body" style={{ color: 'rgba(255,255,255,0.85)', textShadow: '0 1px 3px rgba(0,0,0,0.8)' }}>
                    {video.music.title} – {video.music.artist}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Info + Comments */}
          <div
            className="flex-1 flex flex-col overflow-hidden"
            style={{
              background: 'var(--vt-card)',
              borderLeft: '1px solid var(--color-border)',
            }}
          >

            {/* User header */}
            <div className="flex items-center gap-3 px-5 py-4 shrink-0 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <Avatar
                user={video.user}
                className="!w-11 !h-11 !text-sm cursor-pointer"
                onClick={() => { handleClose(); navigate(`/profile/${video.user?.username}`); }}
              />
              <div className="flex-1 min-w-0">
                <p
                  className="text-[14px] font-semibold font-body leading-tight cursor-pointer hover:underline m-0"
                  style={{ color: 'var(--color-text-primary)' }}
                  onClick={() => { handleClose(); navigate(`/profile/${video.user?.username}`); }}
                >
                  {video.user?.fullName || video.user?.username}
                </p>
                <p className="text-[12px] font-body m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                  {formatTimeAgo(video.createdAt)}
                </p>
              </div>
              {me && me.username !== video.user?.username && (
                <button
                  onClick={handleFollow}
                  className={`text-[12px] font-semibold font-body px-4 py-1.5 rounded-lg border transition-all cursor-pointer ${
                    following
                      ? 'bg-transparent text-text-secondary border-border hover:border-red-400 hover:text-red-400'
                      : 'bg-primary border-primary text-white hover:opacity-90'
                  }`}
                >
                  {following ? 'Đang follow' : 'Follow'}
                </button>
              )}
            </div>

            {/* Caption */}
            {captionTxt && (
              <div className="px-5 py-3 shrink-0 border-b" style={{ borderColor: 'var(--color-border)' }}>
                <p className="text-[13px] font-body leading-relaxed m-0" style={{ color: 'var(--color-text-primary)' }}>
                  {captionTxt}
                  {hashtags.map(h => (
                    <span key={h} className="text-primary font-bold ml-1">{h}</span>
                  ))}
                </p>
              </div>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-4 px-5 py-3 shrink-0 border-b" style={{ borderColor: 'var(--color-border)' }}>
              {/* Like */}
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer transition-all active:scale-90 p-0"
                title={liked ? 'Bỏ thích' : 'Thích'}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ background: liked ? 'rgba(255,45,120,0.15)' : 'var(--vt-input)' }}>
                  <HeartIcon filled={liked} size={18} />
                </div>
                <span className="text-[13px] font-body" style={{ color: liked ? '#ff2d78' : 'var(--color-text-secondary)' }}>
                  {formatCount(likeCount)}
                </span>
              </button>

              {/* Comments */}
              <div className="flex items-center gap-1.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--vt-input)' }}>
                  <CommentIcon />
                </div>
                <span className="text-[13px] font-body" style={{ color: 'var(--color-text-secondary)' }}>
                  {formatCount(video.comments)}
                </span>
              </div>

              {/* Share */}
              <button
                onClick={handleShare}
                className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer transition-all active:scale-90 p-0"
                title="Chia sẻ"
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ background: 'var(--vt-input)' }}>
                  <ShareIcon />
                </div>
                <span className="text-[13px] font-body" style={{ color: 'var(--color-text-secondary)' }}>
                  {formatCount(shareCount)}
                </span>
              </button>

              {/* Bookmark */}
              <button
                onClick={handleBookmark}
                className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer transition-all active:scale-90 p-0"
                title={bookmarked ? 'Bỏ lưu' : 'Lưu video'}
              >
                <div className="w-8 h-8 rounded-full flex items-center justify-center transition-colors" style={{ background: bookmarked ? 'rgba(255,248,45,0.15)' : 'var(--vt-input)' }}>
                  <BookmarkIcon filled={bookmarked} />
                </div>
                <span className="text-[13px] font-body" style={{ color: bookmarked ? '#fff82d' : 'var(--color-text-secondary)' }}>
                  {formatCount(bookmarkCount)}
                </span>
              </button>

              {/* Views */}
              <div className="flex items-center gap-1.5 ml-auto">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-text-muted)" strokeWidth="1.5">
                  <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="text-[12px] font-body" style={{ color: 'var(--color-text-muted)' }}>
                  {formatCount(video.views)}
                </span>
              </div>
            </div>

            {/* Comments list */}
            <div ref={commentRef} className="flex-1 overflow-auto px-5 py-3 custom-modal-scrollbar">
              <p className="text-[11px] font-body uppercase tracking-[0.5px] mb-3 m-0" style={{ color: 'var(--color-text-muted)' }}>
                Bình luận ({formatCount(comments.length)})
              </p>

              {cmtLoading ? (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-black/10 dark:bg-white/5 shrink-0" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="h-2.5 rounded bg-black/10 dark:bg-white/5 w-1/3" />
                        <div className="h-2.5 rounded bg-black/5 dark:bg-white/5 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2" style={{ color: 'var(--color-text-muted)' }}>
                  <span className="text-3xl">💬</span>
                  <p className="text-[13px] font-body m-0">Chưa có bình luận nào</p>
                </div>
              ) : (
                <div className="flex flex-col gap-1">
                  {comments.map((c, i) => (
                    <CommentRow
                      key={c.id || i}
                      comment={c}
                      highlight={highlightComment && i === 0}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Comment input */}
            <div
              className="px-4 py-3 shrink-0 border-t"
              style={{ borderColor: 'var(--color-border)' }}
            >
              {isLoggedIn() ? (
                <div
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl border"
                  style={{
                    background: 'var(--vt-input)',
                    borderColor: 'var(--color-border)',
                  }}
                >
                  <Avatar
                    user={me}
                    className="!w-7 !h-7 !text-[10px]"
                  />
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleComment(); }}
                    placeholder="Thêm bình luận..."
                    className="flex-1 bg-transparent border-none outline-none text-[13px] font-body"
                    style={{ color: 'var(--color-text-primary)' }}
                  />
                  <button
                    onClick={handleComment}
                    disabled={!input.trim() || submitting}
                    className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: input.trim() ? 'linear-gradient(135deg,#ff2d78,#ff6b35)' : 'var(--vt-card)' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" style={{ color: input.trim() ? '#ffffff' : 'var(--color-text-muted)' }}>
                      <path d="M12 1L5.5 7.5M12 1L8.5 12L5.5 7.5L1 4.5L12 1Z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <p className="text-center text-[12px] font-body m-0" style={{ color: 'var(--color-text-muted)' }}>
                  <span
                    className="text-primary cursor-pointer hover:underline"
                    onClick={() => { handleClose(); navigate('/login'); }}
                  >Đăng nhập</span> để bình luận
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      <LoginPromptModal
        open={loginPrompt.open}
        onClose={() => setLoginPrompt({ open: false, action: 'like' })}
        action={loginPrompt.action}
      />

      <ShareSheet
        open={shareOpen}
        onClose={() => setShareOpen(false)}
        videoId={videoId}
        onShareDone={handleShareDone}
        onRepost={handleRepost}
        isReposted={reposted}
      />
    </div>
  );
}

function CommentRow({ comment, highlight = false }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(comment.likes ?? 0);

  return (
    <div
      className={`flex gap-3 py-3 rounded-xl transition-colors border-b ${highlight ? 'bg-primary/10 px-2' : ''
        }`}
      style={{ borderColor: 'var(--color-border)' }}
    >
      <Avatar
        user={{
          anh_dai_dien: comment.anh_dai_dien,
          initials: comment.initials || comment.username?.[0]?.toUpperCase(),
          fullName: comment.username
        }}
        className="!w-8 !h-8 !text-[11px]"
      />

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-[13px] font-semibold font-body" style={{ color: 'var(--color-text-primary)' }}>
            {comment.username}
          </span>
          <span className="text-[11px] font-body" style={{ color: 'var(--color-text-muted)' }}>
            {formatTimeAgo(comment.createdAt)}
          </span>
        </div>
        <p className="text-[13px] font-body leading-relaxed m-0 break-words" style={{ color: 'var(--color-text-secondary)' }}>
          {comment.content}
        </p>
        <button
          className="text-[11px] font-body mt-1 bg-transparent border-none cursor-pointer p-0 hover:underline"
          style={{ color: 'var(--color-text-muted)' }}
        >
          Trả lời
        </button>
      </div>

      <button
        onClick={() => { setLiked(l => !l); setLikes(n => liked ? n - 1 : n + 1); }}
        className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer shrink-0 self-start mt-1 transition-transform active:scale-90"
      >
        <svg width="14" height="14" viewBox="0 0 24 24"
          fill={liked ? '#ff2d78' : 'none'}
          stroke={liked ? '#ff2d78' : 'var(--color-text-muted)'}
          strokeWidth="1.5"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        {likes > 0 && (
          <span className="text-[10px] font-body" style={{ color: liked ? '#ff2d78' : 'var(--color-text-muted)' }}>{likes}</span>
        )}
      </button>
    </div>
  );
}