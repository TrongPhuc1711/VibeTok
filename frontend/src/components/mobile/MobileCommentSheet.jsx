import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getComments, postComment, getReplies, likeComment as likeCommentApi, unlikeComment as unlikeCommentApi } from '../../services/videoService';
import { formatCount, formatTimeAgo } from '../../utils/formatters';
import { isNotEmpty, hasMaxLength } from '../../utils/validators';
import { SendIcon, HeartIcon } from '../../icons/ActionIcons';
import { CloseIcon } from '../../icons/MessageIcons';
import { getStoredUser } from '../../utils/helpers';

export default function MobileCommentSheet({ videoId, totalComments, onClose }) {
  const me = getStoredUser();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const submittingRef = useRef(false);

  useEffect(() => { requestAnimationFrame(() => setVisible(true)); }, []);

  useEffect(() => {
    if (!videoId) return;
    setLoading(true);
    getComments(videoId)
      .then((r) => setComments(r.data.comments || []))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [videoId]);

  const handleClose = () => { setVisible(false); setTimeout(onClose, 280); };

  const handleReply = useCallback((comment) => {
    setReplyTo({ id: comment.id, username: comment.username });
    setInput(`@${comment.username} `);
    inputRef.current?.focus();
  }, []);

  const cancelReply = () => { setReplyTo(null); setInput(''); };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    if (!isNotEmpty(input)) { setError('Vui lòng nhập bình luận'); return; }
    if (!hasMaxLength(input, 300)) { setError('Tối đa 300 ký tự'); return; }
    submittingRef.current = true;
    setError(''); setSubmitting(true);
    try {
      const r = await postComment(videoId, { content: input, parentId: replyTo?.id || null });
      if (replyTo) {
        setComments(prev => prev.map(c => c.id === replyTo.id ? { ...c, replies: (c.replies || 0) + 1 } : c));
      } else {
        setComments((p) => [r.data.comment, ...p]);
      }
      setInput(''); setReplyTo(null);
      if (!replyTo) listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) { setError(e.message || 'Vui lòng đăng nhập'); }
    finally { submittingRef.current = false; setSubmitting(false); }
  };

  const handleLikeComment = useCallback(async (commentId, currentlyLiked) => {
    setComments(prev => prev.map(c => c.id === commentId
      ? { ...c, isLiked: !currentlyLiked, likes: currentlyLiked ? Math.max(0, c.likes - 1) : c.likes + 1 } : c));
    try {
      if (currentlyLiked) await unlikeCommentApi(videoId, commentId);
      else await likeCommentApi(videoId, commentId);
    } catch {
      setComments(prev => prev.map(c => c.id === commentId
        ? { ...c, isLiked: currentlyLiked, likes: currentlyLiked ? c.likes + 1 : Math.max(0, c.likes - 1) } : c));
    }
  }, [videoId]);

  const totalCount = totalComments || comments.length;

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 z-[60]" onClick={handleClose}
        style={{ background: visible ? 'rgba(0,0,0,0.5)' : 'transparent', transition: 'background 0.28s ease' }} />

      {/* Sheet */}
      <div className="fixed left-0 right-0 bottom-0 z-[60] flex flex-col"
        style={{
          maxHeight: '65vh', borderRadius: '16px 16px 0 0',
          background: 'rgba(22, 22, 29, 0.98)', backdropFilter: 'blur(20px)',
          transform: visible ? 'translateY(0)' : 'translateY(100%)',
          transition: 'transform 0.28s cubic-bezier(0.32, 0.72, 0, 1)',
          paddingBottom: 'env(safe-area-inset-bottom)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle bar */}
        <div className="flex justify-center pt-2 pb-1 shrink-0">
          <div style={{ width: 36, height: 4, borderRadius: 2, background: 'rgba(255,255,255,0.2)' }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 shrink-0"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
          <span className="text-white text-[15px] font-bold font-body">
            {formatCount(totalCount)} bình luận
          </span>
          <button onClick={handleClose}
            className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer"
            style={{ background: 'rgba(255,255,255,0.08)', color: '#aaa' }}>
            <CloseIcon size={14} />
          </button>
        </div>

        {/* Comment list */}
        <div ref={listRef} className="flex-1 overflow-auto px-4 py-2">
          {loading ? (
            <div className="flex flex-col gap-4 pt-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="flex gap-3 animate-pulse">
                  <div className="w-8 h-8 rounded-full bg-white/5 shrink-0" />
                  <div className="flex-1 flex flex-col gap-2">
                    <div className="h-3 rounded bg-white/5 w-24" />
                    <div className="h-3 rounded bg-white/4 w-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-2">
              <p className="text-[#555] text-[13px] font-body text-center">Chưa có bình luận nào.<br />Hãy là người đầu tiên!</p>
            </div>
          ) : (
            comments.map((c, i) => (
              <MobileCommentItem key={c.id || i} comment={c} videoId={videoId} onReply={handleReply} onLike={handleLikeComment} />
            ))
          )}
        </div>

        {/* Input */}
        <div className="px-3 py-3 shrink-0" style={{ borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {replyTo && (
            <div className="flex items-center gap-2 px-3 py-1.5 mb-2 rounded-lg"
              style={{ background: 'rgba(255,45,120,0.08)', border: '1px solid rgba(255,45,120,0.15)' }}>
              <span className="text-[11px] text-white/50 font-body">Trả lời</span>
              <span className="text-[11px] text-primary font-semibold font-body">@{replyTo.username}</span>
              <button onClick={cancelReply}
                className="ml-auto bg-transparent border-none text-white/40 cursor-pointer text-xs p-0">✕</button>
            </div>
          )}
          {error && <p className="text-primary text-xs font-body mb-1.5 px-1">{error}</p>}
          <div className="flex items-center gap-2 px-3 py-2.5 rounded-2xl"
            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}>
            <div className="w-7 h-7 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
              style={{ background: me?.anh_dai_dien ? undefined : 'linear-gradient(135deg,#ff2d78,#ff6b35)' }}>
              {me?.anh_dai_dien
                ? <img src={me.anh_dai_dien} alt="" className="w-full h-full object-cover" />
                : (me?.initials || me?.fullName?.[0]?.toUpperCase() || 'U')}
            </div>
            <input ref={inputRef} type="text" value={input}
              onChange={(e) => { setInput(e.target.value); if (error) setError(''); }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
              placeholder={replyTo ? `Trả lời @${replyTo.username}...` : 'Thêm bình luận...'}
              className="flex-1 bg-transparent border-none outline-none text-white text-[13px] font-body placeholder:text-[#555]" />
            <button onClick={handleSubmit} disabled={submitting || !input.trim()}
              className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer disabled:opacity-30"
              style={{ background: input.trim() ? 'linear-gradient(135deg,#ff2d78,#ff6b35)' : 'rgba(255,255,255,0.05)' }}>
              <SendIcon active={!!input.trim()} />
            </button>
          </div>
        </div>
      </div>
    </>
  );
}

/* ── Comment Item for mobile ── */
function MobileCommentItem({ comment, videoId, onReply, onLike }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);

  const handleToggleReplies = async () => {
    if (showReplies) { setShowReplies(false); return; }
    setShowReplies(true);
    if (!repliesLoaded) {
      setRepliesLoading(true);
      try {
        const r = await getReplies(videoId, comment.id);
        setReplies(r.data.replies || []);
        setRepliesLoaded(true);
      } catch { setReplies([]); }
      finally { setRepliesLoading(false); }
    }
  };

  const name = comment.username || 'user';
  const hue = (name.charCodeAt(0) || 0) * 37 % 360;

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      <div className="py-3 flex gap-2.5">
        <div className="w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-[10px] font-bold text-white overflow-hidden"
          style={{ background: comment.anh_dai_dien ? undefined : `hsl(${hue}, 60%, 40%)` }}>
          {comment.anh_dai_dien
            ? <img src={comment.anh_dai_dien} alt="" className="w-full h-full object-cover" />
            : (comment.initials || name[0]?.toUpperCase() || 'U')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-1.5 mb-0.5">
            <span className="text-white text-[12px] font-semibold font-body">{name}</span>
            <span className="text-[#444] text-[10px] font-body">{formatTimeAgo(comment.createdAt)}</span>
          </div>
          <p className="text-[#ddd] text-[13px] font-body leading-relaxed m-0 mb-1.5 break-words">{comment.content}</p>
          <div className="flex items-center gap-3">
            <button onClick={() => onReply(comment)}
              className="bg-transparent border-none text-[#555] text-[11px] font-body cursor-pointer p-0">Phản hồi</button>
            {comment.replies > 0 && (
              <button onClick={handleToggleReplies}
                className="bg-transparent border-none text-[#555] text-[11px] font-body cursor-pointer p-0">
                Xem {comment.replies} trả lời {showReplies ? '▲' : '▼'}
              </button>
            )}
          </div>
        </div>
        <div className="flex flex-col items-center gap-0.5 shrink-0">
          <button onClick={() => onLike(comment.id, comment.isLiked)}
            className="bg-transparent border-none cursor-pointer p-1 flex items-center justify-center">
            <HeartIcon size={14} filled={comment.isLiked} strokeColor={comment.isLiked ? '#ff2d78' : '#555'} />
          </button>
          {comment.likes > 0 && (
            <span className="text-[9px] font-body" style={{ color: comment.isLiked ? '#ff2d78' : '#444' }}>
              {formatCount(comment.likes)}
            </span>
          )}
        </div>
      </div>

      {showReplies && (
        <div style={{ marginLeft: 40, paddingBottom: 8 }}>
          {repliesLoading ? (
            <div className="py-2"><div className="w-4 h-4 border-2 border-white/10 border-t-primary rounded-full animate-spin" /></div>
          ) : replies.map((reply, i) => (
            <div key={reply.id || i} className="py-2 flex gap-2" style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
              <div className="w-6 h-6 rounded-full shrink-0 flex items-center justify-center text-[9px] font-bold text-white overflow-hidden"
                style={{ background: reply.anh_dai_dien ? undefined : `hsl(${(reply.username?.charCodeAt(0) || 0) * 37 % 360}, 55%, 40%)` }}>
                {reply.anh_dai_dien ? <img src={reply.anh_dai_dien} alt="" className="w-full h-full object-cover" /> : (reply.username?.[0]?.toUpperCase() || 'U')}
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-white text-[11px] font-semibold font-body">{reply.username}</span>
                <span className="text-[#444] text-[9px] font-body ml-1.5">{formatTimeAgo(reply.createdAt)}</span>
                <p className="text-[#ccc] text-[12px] font-body m-0 break-words">{reply.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
