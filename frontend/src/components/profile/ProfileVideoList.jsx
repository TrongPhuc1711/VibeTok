import React, { useState, useRef, useEffect } from 'react';
import { formatCount, formatTimeAgo, parseHashtags, stripHashtags } from '../../utils/formatters';
import { likeVideo, unlikeVideo, getComments, postComment } from '../../services/videoService';
import { isLoggedIn } from '../../utils/helpers';

/* ── Comment Panel (inline) ── */
function InlineCommentPanel({ videoId, onClose }) {
  const [comments, setComments]     = useState([]);
  const [loading,  setLoading]      = useState(true);
  const [input,    setInput]        = useState('');
  const [sending,  setSending]      = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    getComments(videoId)
      .then(r => setComments(r.data.comments || []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
    setTimeout(() => inputRef.current?.focus(), 100);
  }, [videoId]);

  const handleSend = async () => {
    if (!input.trim() || sending) return;
    setSending(true);
    try {
      const r = await postComment(videoId, { content: input.trim() });
      setComments(p => [r.data.comment, ...p]);
      setInput('');
    } catch { /* ignore */ }
    finally { setSending(false); }
  };

  return (
    <div className="border-t border-[#1e1e2e] bg-[#0d0d18] rounded-b-xl overflow-hidden"
      style={{ animation: 'slideDown .22s ease-out' }}>
      <style>{`@keyframes slideDown{from{opacity:0;transform:translateY(-8px)}to{opacity:1;transform:translateY(0)}}`}</style>

      {/* Comment input */}
      <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1a1a2a]">
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter') handleSend(); }}
          placeholder="Viết bình luận..."
          className="flex-1 bg-[#1a1a2e] border border-[#2a2a3e] rounded-xl px-3.5 py-2 text-white text-[13px] font-body outline-none placeholder:text-[#444] focus:border-[#ff2d78]/40 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || sending}
          className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-all disabled:opacity-30 shrink-0"
          style={{ background: input.trim() ? 'linear-gradient(135deg,#ff2d78,#ff6b35)' : '#1a1a2e' }}
        >
          <svg width="13" height="13" viewBox="0 0 13 13" fill="none"
            stroke="white" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 1L5.5 7.5M12 1L8.5 12L5.5 7.5L1 4.5L12 1Z" />
          </svg>
        </button>
        <button onClick={onClose}
          className="w-7 h-7 rounded-full bg-[#1a1a2e] border-none text-[#555] cursor-pointer text-base hover:text-white flex items-center justify-center transition-colors">
          ×
        </button>
      </div>

      {/* List */}
      <div className="overflow-auto" style={{ maxHeight: 220 }}>
        {loading ? (
          <div className="flex justify-center py-6">
            <div className="w-5 h-5 border-2 border-[#ff2d78]/30 border-t-[#ff2d78] rounded-full animate-spin" />
          </div>
        ) : comments.length === 0 ? (
          <p className="text-center text-[#444] text-[13px] font-body py-6">Chưa có bình luận nào</p>
        ) : (
          <div className="px-4 py-2 flex flex-col gap-3">
            {comments.map(c => (
              <div key={c.id} className="flex gap-3">
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#ff2d78] to-[#ff6b35] flex items-center justify-center text-[10px] font-bold text-white shrink-0 overflow-hidden">
                  {c.anh_dai_dien
                    ? <img src={c.anh_dai_dien} alt="" className="w-full h-full object-cover" />
                    : (c.initials || 'U')}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2">
                    <span className="text-white text-[12px] font-semibold font-body">{c.username}</span>
                    <span className="text-[#333] text-[10px] font-body">{formatTimeAgo(c.createdAt)}</span>
                  </div>
                  <p className="text-[#ccc] text-[13px] font-body leading-snug m-0 break-words">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/* ── Single Video Row ── */
function VideoRow({ video, isOwner, onDelete }) {
  const [liked,        setLiked]        = useState(Boolean(video.isLiked));
  const [likeCount,    setLikeCount]    = useState(video.likes ?? 0);
  const [likeLoading,  setLikeLoading]  = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [playing,      setPlaying]      = useState(false);
  const [deleting,     setDeleting]     = useState(false);
  const [confirmDel,   setConfirmDel]   = useState(false);
  const videoRef = useRef(null);

  // Đồng bộ state khi dữ liệu video từ props thay đổi
  useEffect(() => {
    setLiked(Boolean(video.isLiked));
    setLikeCount(video.likes ?? 0);
  }, [video.isLiked, video.likes]);

  const hashtags   = parseHashtags(video.caption ?? '');
  const captionTxt = stripHashtags(video.caption ?? '');
  const hue        = (parseInt(String(video.id).slice(-3), 16) || 0) % 360;

  const handleLike = async () => {
    if (!isLoggedIn() || likeLoading) return;
    const was = liked;
    
    // Cập nhật giao diện ngay lập tức (Optimistic UI)
    setLiked(!was);
    setLikeCount(n => was ? Math.max(0, n - 1) : n + 1);
    setLikeLoading(true);
    
    try {
      if (was) await unlikeVideo(video.id);
      else     await likeVideo(video.id);
    } catch {
      // Hoàn tác nếu gọi API thất bại
      setLiked(was);
      setLikeCount(n => was ? n + 1 : Math.max(0, n - 1));
    } finally { 
      setLikeLoading(false); 
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play(); setPlaying(true); }
    else          { v.pause(); setPlaying(false); }
  };

  const handleDeleteClick = async () => {
    if (!confirmDel) {
      setConfirmDel(true);
      setTimeout(() => setConfirmDel(false), 3000);
      return;
    }
    setDeleting(true);
    await onDelete(video.id);
    setDeleting(false);
  };

  return (
    <div className="group rounded-xl overflow-hidden border border-[#1e1e2e] bg-[#0d0d18] hover:border-[#2a2a3e] transition-all"
      style={{ animation: 'fadeUp .3s ease-out both' }}>
      <style>{`@keyframes fadeUp{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:translateY(0)}}`}</style>

      <div className="flex gap-0">
        {/* ── Video thumbnail / player ── */}
        <div className="relative shrink-0 cursor-pointer"
          style={{ width: 120, height: 160, background: `linear-gradient(135deg,hsl(${hue},25%,8%),hsl(${(hue+60)%360},18%,5%))` }}
          onClick={togglePlay}>
          {video.videoUrl ? (
            <video
              ref={videoRef}
              src={video.videoUrl}
              loop playsInline
              className="w-full h-full object-cover"
              onEnded={() => setPlaying(false)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="text-white/20 text-3xl">🎬</span>
            </div>
          )}

          {/* Play/Pause overlay */}
          <div className={`absolute inset-0 flex items-center justify-center transition-opacity duration-200
            ${playing ? 'opacity-0 group-hover:opacity-100' : 'bg-black/20 opacity-100'}`}>
            <div className="w-10 h-10 rounded-full bg-black/50 backdrop-blur flex items-center justify-center">
              {playing ? (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                  <rect x="3" y="2" width="3.5" height="12" rx="1" />
                  <rect x="9.5" y="2" width="3.5" height="12" rx="1" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="white">
                  <path d="M4 2l10 6-10 6V2z" />
                </svg>
              )}
            </div>
          </div>

          {/* Duration badge */}
          {video.duration > 0 && (
            <div className="absolute bottom-2 right-2 bg-black/70 text-white text-[10px] font-bold font-body px-1.5 py-0.5 rounded">
              {Math.floor(video.duration / 60)}:{String(Math.floor(video.duration % 60)).padStart(2, '0')}
            </div>
          )}

          {/* Views */}
          <div className="absolute bottom-2 left-2 flex items-center gap-1">
            <svg width="10" height="10" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,.7)" strokeWidth="1.5">
              <path d="M1 8S4 3 8 3s7 5 7 5-3 5-7 5S1 8 1 8z"/><circle cx="8" cy="8" r="2"/>
            </svg>
            <span className="text-white/70 text-[10px] font-body">{formatCount(video.views)}</span>
          </div>
        </div>

        {/* ── Info ── */}
        <div className="flex-1 min-w-0 p-4 flex flex-col justify-between">
          {/* Title / caption */}
          <div>
            <p className="text-white text-[14px] font-semibold font-body leading-snug mb-1.5 line-clamp-2">
              {captionTxt || <span className="text-[#444] italic">Chưa có tiêu đề</span>}
            </p>
            {hashtags.length > 0 && (
              <div className="flex flex-wrap gap-1 mb-2">
                {hashtags.map(h => (
                  <span key={h} className="text-[#ff2d78] text-[11px] font-body font-semibold">{h}</span>
                ))}
              </div>
            )}
            <p className="text-[#444] text-[11px] font-body">{formatTimeAgo(video.createdAt)}</p>
          </div>

          {/* Music */}
          {video.music && (
            <div className="flex items-center gap-1.5 mt-1">
              <svg width="11" height="11" viewBox="0 0 13 13" fill="none" stroke="#666" strokeWidth="1.2">
                <path d="M5 10V3l7-1.5V8.5"/><circle cx="3" cy="10" r="2"/><circle cx="10" cy="8.5" r="2"/>
              </svg>
              <span className="text-[#555] text-[11px] font-body truncate max-w-[160px]">
                {video.music.title} – {video.music.artist}
              </span>
            </div>
          )}

          {/* ── Action bar ── */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-[#1a1a2a]">
            {/* Like */}
            <button
              onClick={handleLike}
              disabled={likeLoading}
              className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer transition-all active:scale-90 disabled:opacity-50 group/like"
            >
              <svg width="16" height="16" viewBox="0 0 24 24"
                fill={liked ? '#ff2d78' : 'none'}
                stroke={liked ? '#ff2d78' : '#555'}
                strokeWidth="1.5"
                className="transition-transform group-hover/like:scale-110"
              >
                <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
              </svg>
              <span className={`text-[12px] font-body transition-colors ${liked ? 'text-[#ff2d78]' : 'text-[#555] group-hover/like:text-[#888]'}`}>
                {formatCount(likeCount)}
              </span>
            </button>

            {/* Comment */}
            <button
              onClick={() => setShowComments(s => !s)}
              className="flex items-center gap-1.5 bg-transparent border-none cursor-pointer group/cmt"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke={showComments ? '#ff2d78' : '#555'}
                strokeWidth="1.5"
                className="transition-all group-hover/cmt:stroke-[#888]">
                <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
              </svg>
              <span className={`text-[12px] font-body transition-colors ${showComments ? 'text-[#ff2d78]' : 'text-[#555] group-hover/cmt:text-[#888]'}`}>
                {formatCount(video.comments)}
              </span>
            </button>

            {/* Shares */}
            <div className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#555" strokeWidth="1.5" strokeLinecap="round">
                <path d="M4 12v8a2 2 0 002 2h12a2 2 0 002-2v-8M16 6l-4-4-4 4M12 2v13" />
              </svg>
              <span className="text-[#555] text-[12px] font-body">{formatCount(video.shares)}</span>
            </div>

            {/* Privacy badge */}
            <span className="ml-auto text-[10px] font-body px-2 py-0.5 rounded-full border"
              style={{
                borderColor: video.privacy === 'public' ? '#10b98130' : '#f59e0b30',
                color:       video.privacy === 'public' ? '#10b981'   : '#f59e0b',
                background:  video.privacy === 'public' ? '#10b98110' : '#f59e0b10',
              }}>
              {video.privacy === 'public' ? '🌍 Công khai' : video.privacy === 'friends' ? '👥 Bạn bè' : '🔒 Riêng tư'}
            </span>

            {/* Delete (owner only) */}
            {isOwner && (
              <button
                onClick={handleDeleteClick}
                disabled={deleting}
                className={`text-[11px] font-body px-2.5 py-1 rounded-lg border-none cursor-pointer transition-all disabled:opacity-50
                  ${confirmDel ? 'bg-red-500/20 text-red-400 animate-pulse' : 'bg-transparent text-[#333] hover:text-red-400 hover:bg-red-500/10'}`}
              >
                {deleting ? '...' : confirmDel ? 'Xác nhận xóa?' : '🗑'}
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Inline comment panel ── */}
      {showComments && (
        <InlineCommentPanel
          videoId={video.id}
          onClose={() => setShowComments(false)}
        />
      )}
    </div>
  );
}

/* ── Main export ── */
export default function ProfileVideoList({ videos = [], isOwner = false, onDelete, loading = false }) {
  if (loading) {
    return (
      <div className="flex flex-col gap-3 p-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-40 rounded-xl bg-[#111118] border border-[#1e1e2e] animate-pulse" />
        ))}
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3 text-[#444]">
        <span className="text-4xl">🎬</span>
        <p className="text-[14px] font-body">
          {isOwner ? 'Bạn chưa đăng video nào' : 'Người dùng chưa đăng video nào'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 p-4">
      {videos.map((v, i) => (
        <div key={v.id} style={{ animationDelay: `${i * 0.06}s` }}>
          <VideoRow video={v} isOwner={isOwner} onDelete={onDelete} />
        </div>
      ))}
    </div>
  );
}