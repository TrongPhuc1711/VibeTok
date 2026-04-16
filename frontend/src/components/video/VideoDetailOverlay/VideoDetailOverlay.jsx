import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { getVideoById, getComments, postComment, likeVideo, unlikeVideo } from '../../../services/videoService';
import { followUser, unfollowUser } from '../../../services/userService';
import { formatCount, formatTimeAgo, parseHashtags, stripHashtags } from '../../../utils/formatters';
import { isLoggedIn, getStoredUser } from '../../../utils/helpers';

/**
 * VideoDetailOverlay
 * Props:
 *  videoId          – string
 *  highlightComment – boolean
 *  onClose          – () => void
 */
export default function VideoDetailOverlay({ videoId, highlightComment = false, onClose }) {
  const navigate = useNavigate();
  const me = getStoredUser();

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [playing, setPlaying] = useState(false);
  // ✅ FIX: liked lấy từ DB (video.isLiked), không dùng localStorage
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [following, setFollowing] = useState(false);
  const [visible, setVisible] = useState(false);

  const [comments, setComments] = useState([]);
  const [cmtLoading, setCmtLoading] = useState(true);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);

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
        // ✅ FIX: Lấy isLiked từ server response
        setLiked(Boolean(v.isLiked));
        setFollowing(Boolean(v.user?.isFollowing));
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

  const handleLike = async () => {
    if (!isLoggedIn()) return;
    const was = liked;
    // Optimistic UI
    setLiked(!was);
    setLikeCount(n => was ? Math.max(0, n - 1) : n + 1);
    try {
      if (was) await unlikeVideo(videoId);
      else await likeVideo(videoId);
    } catch {
      // Rollback
      setLiked(was);
      setLikeCount(n => was ? n + 1 : Math.max(0, n - 1));
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
          className="flex h-[92vh] max-h-[860px] w-[96vw] max-w-[1100px] rounded-2xl overflow-hidden shadow-2xl"
          style={{ background: '#0d0d14' }}
        >
          {/* LEFT: Video */}
          <div
            className="relative flex-shrink-0 bg-black flex items-center justify-center"
            style={{ width: 400 }}
          >
            {video.videoUrl ? (
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
                <span className="text-white/20 text-5xl">🎬</span>
              </div>
            )}

            {video.videoUrl && !playing && (
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
                className="text-white font-bold text-[15px] font-body mb-1 cursor-pointer pointer-events-auto hover:underline w-fit"
                onClick={() => { handleClose(); navigate(`/profile/${video.user?.username}`); }}
              >
                @{video.user?.username}
              </p>
              <p className="text-white/80 text-[13px] font-body leading-snug">
                {captionTxt}{' '}
                {hashtags.map(h => (
                  <span key={h} className="text-white font-bold">{h} </span>
                ))}
              </p>
              {video.music && (
                <div className="flex items-center gap-1.5 mt-2 pointer-events-auto">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="rgba(255,255,255,.7)">
                    <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                  </svg>
                  <span className="text-white/70 text-[11px] font-body">{video.music.title} – {video.music.artist}</span>
                </div>
              )}
            </div>
          </div>

          {/* RIGHT: Info + Comments */}
          <div className="flex-1 flex flex-col overflow-hidden" style={{ borderLeft: '1px solid rgba(255,255,255,0.06)' }}>

            {/* User header */}
            <div className="flex items-center gap-3 px-5 py-4 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <div
                className="w-11 h-11 rounded-full flex-shrink-0 overflow-hidden cursor-pointer"
                style={{ background: 'linear-gradient(135deg,#ff2d78,#ff6b35)' }}
                onClick={() => { handleClose(); navigate(`/profile/${video.user?.username}`); }}
              >
                {video.user?.anh_dai_dien
                  ? <img src={video.user.anh_dai_dien} alt="" className="w-full h-full object-cover" />
                  : <span className="w-full h-full flex items-center justify-center text-sm font-bold text-white">{video.user?.initials || 'U'}</span>
                }
              </div>
              <div className="flex-1 min-w-0">
                <p
                  className="text-white text-[14px] font-semibold font-body leading-tight cursor-pointer hover:underline"
                  onClick={() => { handleClose(); navigate(`/profile/${video.user?.username}`); }}
                >
                  {video.user?.fullName || video.user?.username}
                </p>
                <p className="text-white/40 text-[12px] font-body">{formatTimeAgo(video.createdAt)}</p>
              </div>
              {me && me.username !== video.user?.username && (
                <button
                  onClick={handleFollow}
                  className={`text-[12px] font-semibold font-body px-4 py-1.5 rounded-lg border transition-all cursor-pointer
                    ${following
                      ? 'bg-transparent border-white/20 text-white/50 hover:border-red-400/40 hover:text-red-400'
                      : 'bg-[#ff2d78] border-[#ff2d78] text-white hover:bg-[#e0266b]'
                    }`}
                >
                  {following ? 'Đang follow' : 'Follow'}
                </button>
              )}
            </div>

            {/* Caption */}
            {captionTxt && (
              <div className="px-5 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                <p className="text-white/80 text-[13px] font-body leading-relaxed">
                  {captionTxt}
                  {hashtags.map(h => (
                    <span key={h} className="text-[#ff2d78] font-bold ml-1">{h}</span>
                  ))}
                </p>
              </div>
            )}

            {/* Stats row */}
            <div className="flex items-center gap-5 px-5 py-3 shrink-0" style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              {/* Like */}
              <button
                onClick={handleLike}
                className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer transition-all active:scale-90"
              >
                <svg width="20" height="20" viewBox="0 0 24 24"
                  fill={liked ? '#ff2d78' : 'none'}
                  stroke={liked ? '#ff2d78' : 'rgba(255,255,255,.5)'}
                  strokeWidth="1.5"
                >
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <span className={`text-[13px] font-body ${liked ? 'text-[#ff2d78]' : 'text-white/50'}`}>
                  {formatCount(likeCount)}
                </span>
              </button>
              {/* Comments */}
              <div className="flex items-center gap-1.5">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.5)" strokeWidth="1.5">
                  <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
                <span className="text-[13px] font-body text-white/50">{formatCount(video.comments)}</span>
              </div>
              {/* Views */}
              <div className="flex items-center gap-1.5 ml-auto">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,.3)" strokeWidth="1.5">
                  <path d="M1 12S5 4 12 4s11 8 11 8-4 8-11 8S1 12 1 12z" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
                <span className="text-[12px] font-body text-white/30">{formatCount(video.views)}</span>
              </div>
            </div>

            {/* Comments list */}
            <div ref={commentRef} className="flex-1 overflow-auto px-5 py-3">
              <p className="text-white/40 text-[11px] font-body uppercase tracking-[0.5px] mb-3">
                Bình luận ({formatCount(comments.length)})
              </p>

              {cmtLoading ? (
                <div className="flex flex-col gap-4">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="flex gap-3 animate-pulse">
                      <div className="w-8 h-8 rounded-full bg-white/5 shrink-0" />
                      <div className="flex-1 flex flex-col gap-2">
                        <div className="h-2.5 rounded bg-white/5 w-1/3" />
                        <div className="h-2.5 rounded bg-white/5 w-3/4" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : comments.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2 text-white/20">
                  <span className="text-3xl">💬</span>
                  <p className="text-[13px] font-body">Chưa có bình luận nào</p>
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
              className="px-4 py-3 shrink-0"
              style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
            >
              {isLoggedIn() ? (
                <div
                  className="flex items-center gap-3 px-4 py-2.5 rounded-2xl"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                >
                  <div
                    className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
                    style={{ background: 'linear-gradient(135deg,#ff2d78,#ff6b35)' }}
                  >
                    {me?.anh_dai_dien
                      ? <img src={me.anh_dai_dien} alt="" className="w-full h-full object-cover" />
                      : (me?.initials || 'U')
                    }
                  </div>
                  <input
                    ref={inputRef}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleComment(); }}
                    placeholder="Thêm bình luận..."
                    className="flex-1 bg-transparent border-none outline-none text-white text-[13px] font-body placeholder:text-white/25"
                  />
                  <button
                    onClick={handleComment}
                    disabled={!input.trim() || submitting}
                    className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
                    style={{ background: input.trim() ? 'linear-gradient(135deg,#ff2d78,#ff6b35)' : 'rgba(255,255,255,.06)' }}
                  >
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 1L5.5 7.5M12 1L8.5 12L5.5 7.5L1 4.5L12 1Z" />
                    </svg>
                  </button>
                </div>
              ) : (
                <p className="text-center text-white/30 text-[12px] font-body">
                  <span
                    className="text-[#ff2d78] cursor-pointer hover:underline"
                    onClick={() => { handleClose(); navigate('/login'); }}
                  >Đăng nhập</span> để bình luận
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function CommentRow({ comment, highlight = false }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(comment.likes ?? 0);

  return (
    <div
      className={`flex gap-3 py-3 rounded-xl transition-colors ${highlight ? 'bg-[#ff2d78]/8 px-2' : ''
        }`}
      style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}
    >
      <div
        className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white overflow-hidden"
        style={{
          background: comment.anh_dai_dien
            ? undefined
            : `hsl(${(comment.username?.charCodeAt(0) || 0) * 37 % 360},55%,38%)`,
        }}
      >
        {comment.anh_dai_dien
          ? <img src={comment.anh_dai_dien} alt="" className="w-full h-full object-cover" />
          : (comment.initials || comment.username?.[0]?.toUpperCase() || 'U')
        }
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-white text-[13px] font-semibold font-body">{comment.username}</span>
          <span className="text-white/25 text-[11px] font-body">{formatTimeAgo(comment.createdAt)}</span>
        </div>
        <p className="text-white/75 text-[13px] font-body leading-relaxed m-0 break-words">
          {comment.content}
        </p>
        <button className="text-white/30 text-[11px] font-body mt-1 bg-transparent border-none cursor-pointer hover:text-white/60 p-0">
          Trả lời
        </button>
      </div>

      <button
        onClick={() => { setLiked(l => !l); setLikes(n => liked ? n - 1 : n + 1); }}
        className="flex flex-col items-center gap-0.5 bg-transparent border-none cursor-pointer shrink-0 self-start mt-1"
      >
        <svg width="14" height="14" viewBox="0 0 24 24"
          fill={liked ? '#ff2d78' : 'none'}
          stroke={liked ? '#ff2d78' : 'rgba(255,255,255,.25)'}
          strokeWidth="1.5"
        >
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
        {likes > 0 && (
          <span className={`text-[10px] font-body ${liked ? 'text-[#ff2d78]' : 'text-white/25'}`}>{likes}</span>
        )}
      </button>
    </div>
  );
}