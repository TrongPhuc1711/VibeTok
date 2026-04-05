import React, { useState, useEffect, useRef } from 'react';
import { getComments, postComment } from '../../../services/videoService';
import { formatCount, formatTimeAgo } from '../../../utils/formatters';
import { isNotEmpty, hasMaxLength } from '../../../utils/validators';
import { SendIcon } from '../../../icons/ActionIcons';

/**
 * CommentPanel — giống TikTok: overlay panel trượt từ phải
 *
 * Props:
 *  videoId       – string
 *  totalComments – number
 *  onClose       – () => void
 */
export default function CommentPanel({ videoId, totalComments, onClose }) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const submittingRef = useRef(false);

  // animation mount
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  useEffect(() => {
    if (!videoId) return;
    setLoading(true);
    getComments(videoId)
      .then((r) => setComments(r.data.comments || []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [videoId]);

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  const handleSubmit = async () => {
  // Dùng ref để chặn ngay lập tức, không chờ setState
  if (submittingRef.current) return;
  if (!isNotEmpty(input)) { setError('Vui lòng nhập bình luận'); return; }
  if (!hasMaxLength(input, 300)) { setError('Bình luận tối đa 300 ký tự'); return; }

  submittingRef.current = true;
  setError('');
  setSubmitting(true);
  try {
    const r = await postComment(videoId, { content: input });
    setComments((p) => [r.data.comment, ...p]);
    setInput('');
    listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  } catch (e) {
    setError(e.message || 'Vui lòng đăng nhập để bình luận');
  } finally {
    submittingRef.current = false;
    setSubmitting(false);
  }
};

  const totalCount = totalComments || comments.length;

  return (
    <>
      {/* Backdrop mờ */}
      <div
        className="fixed inset-0 z-40"
        onClick={handleClose}
        style={{ background: 'transparent' }}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
        style={{
          width: 420,
          background: 'rgba(22, 22, 29, 0.98)',
          backdropFilter: 'blur(20px)',
          borderLeft: '1px solid rgba(255,255,255,0.07)',
          transform: visible ? 'translateX(0)' : 'translateX(100%)',
          transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          boxShadow: '-12px 0 40px rgba(0,0,0,0.5)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-5 py-4 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}
        >
          <div className="flex items-baseline gap-2">
            <span className="text-white text-[16px] font-bold font-body">Bình luận</span>
            <span
              className="text-[13px] font-body px-2 py-0.5 rounded-full"
              style={{ background: 'rgba(255,255,255,0.08)', color: '#888' }}
            >
              {formatCount(totalCount)}
            </span>
          </div>
          <button
            onClick={handleClose}
            className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-all hover:scale-105"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa' }}
          >
            <CloseIcon />
          </button>
        </div>

        {/* ── Danh sách comment ── */}
        <div ref={listRef} className="flex-1 overflow-auto px-5 py-2">
          {loading ? (
            <div className="flex flex-col gap-4 pt-4">
              {[1, 2, 3].map(i => <CommentSkeleton key={i} />)}
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <p className="text-[#555] text-[13px] font-body text-center">
                Chưa có bình luận nào.<br />Hãy là người đầu tiên!
              </p>
            </div>
          ) : (
            <div className="flex flex-col">
              {comments.map((c, i) => (
                <CommentItem key={c.id || i} comment={c} />
              ))}
            </div>
          )}
        </div>

        {/* ── Input bình luận ── */}
        <div
          className="px-4 py-4 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}
        >
          {error && (
            <p className="text-[#ff2d78] text-xs font-body mb-2 px-1">{error}</p>
          )}
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
          >
            {/* Avatar mini */}
            <div
              className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
              style={{ background: 'linear-gradient(135deg,#ff2d78,#ff6b35)' }}
            >
              B
            </div>
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey)  handleSubmit(); }}
              placeholder="Thêm bình luận..."
              className="flex-1 bg-transparent border-none outline-none text-white text-[14px] font-body placeholder:text-[#555]"
            />
            <button
              onClick={handleSubmit}
              disabled={submitting || !input.trim()}
              className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              style={{
                background: input.trim() ? 'linear-gradient(135deg,#ff2d78,#ff6b35)' : 'rgba(255,255,255,0.05)',
                transform: submitting ? 'scale(0.9)' : 'scale(1)',
              }}
            >
              <SendIcon active={!!input.trim()} />
            </button>
          </div>

          {/* Gợi ý emoji */}
          <div className="flex gap-2 mt-2.5 px-1">
            {['😂', '❤️', '🔥', '👏', '😮', '💯'].map(emoji => (
              <button
                key={emoji}
                onClick={() => setInput(p => p + emoji)}
                className="text-[18px] hover:scale-125 transition-transform cursor-pointer bg-transparent border-none"
              >
                {emoji}
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

/* ── CommentItem ── */
function CommentItem({ comment }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(comment.likes ?? 0);
  const [showReplies, setShowReplies] = useState(false);

  return (
    <div className="py-3.5 flex gap-3" style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Avatar */}
      <div
        className="w-9 h-9 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
        style={{
          background: comment.anh_dai_dien
            ? undefined
            : `hsl(${(comment.username?.charCodeAt(0) || 0) * 37 % 360}, 60%, 40%)`,
          overflow: 'hidden',
        }}
      >
        {comment.anh_dai_dien
          ? <img src={comment.anh_dai_dien} alt="" className="w-full h-full object-cover" />
          : (comment.initials || comment.username?.[0]?.toUpperCase() || 'U')
        }
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2 mb-0.5">
          <span className="text-white text-[13px] font-semibold font-body">
            {comment.username}
          </span>
          <span className="text-[#444] text-[11px] font-body">
            {formatTimeAgo(comment.createdAt)}
          </span>
        </div>

        <p className="text-[#ddd] text-[14px] font-body leading-relaxed m-0 mb-2 break-words">
          {comment.content}
        </p>

        {/* Meta */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => setShowReplies(s => !s)}
            className="bg-transparent border-none text-[#555] text-[12px] font-body cursor-pointer hover:text-[#888] transition-colors p-0"
          >
            Trả lời
          </button>

          {comment.replies > 0 && (
            <button
              onClick={() => setShowReplies(s => !s)}
              className="bg-transparent border-none text-[#555] text-[12px] font-body cursor-pointer hover:text-[#888] transition-colors p-0"
            >
              — Xem {comment.replies} trả lời {showReplies ? '▲' : '▼'}
            </button>
          )}
        </div>
      </div>

      {/* Like button */}
      <div className="flex flex-col items-center gap-0.5 shrink-0 ml-1">
        <button
          onClick={() => { setLiked(l => !l); setLikes(n => liked ? n - 1 : n + 1); }}
          className="bg-transparent border-none cursor-pointer p-1 transition-transform active:scale-90"
          style={{ transform: liked ? 'scale(1.1)' : 'scale(1)' }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24"
            fill={liked ? '#ff2d78' : 'none'}
            stroke={liked ? '#ff2d78' : '#555'}
            strokeWidth="1.5">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
        </button>
        <span
          className="text-[10px] font-body"
          style={{ color: liked ? '#ff2d78' : '#444' }}
        >
          {likes > 0 ? formatCount(likes) : ''}
        </span>
      </div>
    </div>
  );
}

/* ── Skeleton loading ── */
function CommentSkeleton() {
  return (
    <div className="flex gap-3 py-3 animate-pulse">
      <div className="w-9 h-9 rounded-full flex-shrink-0" style={{ background: 'rgba(255,255,255,0.06)' }} />
      <div className="flex-1 flex flex-col gap-2">
        <div className="h-3 rounded-full w-24" style={{ background: 'rgba(255,255,255,0.06)' }} />
        <div className="h-3 rounded-full w-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="h-3 rounded-full w-3/4" style={{ background: 'rgba(255,255,255,0.04)' }} />
      </div>
    </div>
  );
}

/* Icons */
function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 3l10 10M13 3L3 13" />
    </svg>
  );
}