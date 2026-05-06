import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getComments, postComment, getReplies, likeComment as likeCommentApi, unlikeComment as unlikeCommentApi } from '../../../services/videoService';
import { searchMentionUsers } from '../../../services/userService';
import { formatCount, formatTimeAgo } from '../../../utils/formatters';
import { isNotEmpty, hasMaxLength } from '../../../utils/validators';
import { SendIcon } from '../../../icons/ActionIcons';
import { getStoredUser } from '../../../utils/helpers';
import EmojiPickerButton from '../../ui/EmojiPickerButton';
import MentionDropdown from './MentionDropdown';


export default function CommentPanel({ videoId, totalComments, onClose }) {
  const me = getStoredUser();
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [visible, setVisible] = useState(false);
  const [replyTo, setReplyTo] = useState(null); // { id, username }
  const [mentionUsers, setMentionUsers] = useState([]);
  const [mentionLoading, setMentionLoading] = useState(false);
  const [mentionVisible, setMentionVisible] = useState(false);
  const [mentionQuery, setMentionQuery] = useState('');
  const [mentions, setMentions] = useState([]); // collected mentions for submit
  const inputRef = useRef(null);
  const listRef = useRef(null);
  const submittingRef = useRef(false);
  const mentionTimerRef = useRef(null);

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
    const handler = (e) => { if (e.key === 'Escape' && !mentionVisible) handleClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [mentionVisible]);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 280);
  };

  // ── @Mention logic ──
  const getMentionQuery = (text, cursorPos) => {
    const before = text.slice(0, cursorPos);
    const match = before.match(/@([^\s]*)$/);
    return match ? match[1] : null;
  };

  const handleInputChange = (e) => {
    const val = e.target.value;
    setInput(val);
    if (error) setError('');

    const cursorPos = e.target.selectionStart;
    const q = getMentionQuery(val, cursorPos);

    if (q !== null) {
      setMentionQuery(q);
      setMentionVisible(true);

      // Debounce search
      clearTimeout(mentionTimerRef.current);
      mentionTimerRef.current = setTimeout(async () => {
        setMentionLoading(true);
        try {
          const res = await searchMentionUsers(q, 8);
          setMentionUsers(res.data.users || []);
        } catch (err) {
          setMentionUsers([{ id: 'error', username: err.response?.data?.message || err.message || 'Lỗi API', fullName: 'Error' }]);
        } finally {
          setMentionLoading(false);
        }
      }, 300);
    } else {
      setMentionVisible(false);
      setMentionUsers([]);
    }
  };

  const handleMentionSelect = (user) => {
    const cursorPos = inputRef.current?.selectionStart || input.length;
    const before = input.slice(0, cursorPos);
    const after = input.slice(cursorPos);
    const atIdx = before.lastIndexOf('@');

    const newInput = before.slice(0, atIdx) + `@${user.username} ` + after;
    setInput(newInput);
    setMentionVisible(false);
    setMentionUsers([]);

    // Add to mentions list (avoid duplicates)
    setMentions(prev => {
      if (prev.find(m => m.userId === user.id)) return prev;
      return [...prev, { userId: user.id, username: user.username }];
    });

    // Focus back and set cursor
    setTimeout(() => {
      const pos = atIdx + user.username.length + 2;
      inputRef.current?.focus();
      inputRef.current?.setSelectionRange(pos, pos);
    }, 0);
  };

  // ── Reply logic ──
  const handleReply = useCallback((comment) => {
    setReplyTo({ id: comment.id, username: comment.username });
    setInput(`@${comment.username} `);
    setMentions([{ userId: comment.userId, username: comment.username }]);
    inputRef.current?.focus();
  }, []);

  const cancelReply = () => {
    setReplyTo(null);
    setInput('');
    setMentions([]);
  };

  // ── Submit ──
  const handleSubmit = async () => {
    if (submittingRef.current) return;
    if (!isNotEmpty(input)) { setError('Vui lòng nhập bình luận'); return; }
    if (!hasMaxLength(input, 300)) { setError('Bình luận tối đa 300 ký tự'); return; }

    submittingRef.current = true;
    setError('');
    setSubmitting(true);
    try {
      const r = await postComment(videoId, {
        content: input,
        parentId: replyTo?.id || null,
        mentions: mentions.length > 0 ? mentions : null,
      });
      const newComment = r.data.comment;

      if (replyTo) {
        // Update reply count on parent comment
        setComments(prev => prev.map(c =>
          c.id === replyTo.id ? { ...c, replies: (c.replies || 0) + 1 } : c
        ));
      } else {
        setComments((p) => [newComment, ...p]);
      }

      setInput('');
      setReplyTo(null);
      setMentions([]);
      if (!replyTo) listRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    } catch (e) {
      setError(e.message || 'Vui lòng đăng nhập để bình luận');
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  // ── Like comment ──
  const handleLikeComment = useCallback(async (commentId, currentlyLiked) => {
    // Optimistic update
    setComments(prev => prev.map(c =>
      c.id === commentId
        ? { ...c, isLiked: !currentlyLiked, likes: currentlyLiked ? Math.max(0, c.likes - 1) : c.likes + 1 }
        : c
    ));
    try {
      if (currentlyLiked) await unlikeCommentApi(videoId, commentId);
      else await likeCommentApi(videoId, commentId);
    } catch {
      // Rollback
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, isLiked: currentlyLiked, likes: currentlyLiked ? c.likes + 1 : Math.max(0, c.likes - 1) }
          : c
      ));
    }
  }, [videoId]);

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
                <CommentItemFull
                  key={c.id || i}
                  comment={c}
                  videoId={videoId}
                  onReply={handleReply}
                  onLike={handleLikeComment}
                />
              ))}
            </div>
          )}
        </div>

        {/* ── Input bình luận ── */}
        <div
          className="px-4 py-4 shrink-0"
          style={{ borderTop: '1px solid rgba(255,255,255,0.07)', position: 'relative' }}
        >
          {/* Reply indicator */}
          {replyTo && (
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              padding: '6px 12px',
              marginBottom: 8,
              background: 'rgba(255, 45, 120, 0.08)',
              borderRadius: 10,
              border: '1px solid rgba(255, 45, 120, 0.15)',
            }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)', fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
                Đang trả lời
              </span>
              <span style={{ fontSize: 12, color: '#ff2d78', fontWeight: 600, fontFamily: 'var(--font-body, Inter, sans-serif)' }}>
                @{replyTo.username}
              </span>
              <button
                onClick={cancelReply}
                style={{
                  marginLeft: 'auto',
                  background: 'none',
                  border: 'none',
                  color: 'rgba(255,255,255,0.4)',
                  cursor: 'pointer',
                  fontSize: 14,
                  padding: '0 2px',
                  lineHeight: 1,
                }}
              >
                ✕
              </button>
            </div>
          )}

          {error && (
            <p className="text-[#ff2d78] text-xs font-body mb-2 px-1">{error}</p>
          )}

          {/* Mention dropdown */}
          <div style={{ position: 'relative' }}>
            <MentionDropdown
              users={mentionUsers}
              loading={mentionLoading}
              visible={mentionVisible}
              onSelect={handleMentionSelect}
              onClose={() => setMentionVisible(false)}
              query={mentionQuery}
            />

            <div
              className="flex items-center gap-3 px-4 py-3 rounded-2xl"
              style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              {/* Avatar mini */}
              <div
                className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white overflow-hidden"
                style={{ background: me?.anh_dai_dien ? undefined : 'linear-gradient(135deg,#ff2d78,#ff6b35)' }}
              >
                {me?.anh_dai_dien
                  ? <img src={me.anh_dai_dien} alt="" className="w-full h-full object-cover" />
                  : (me?.initials || me?.fullName?.[0]?.toUpperCase() || 'U')
                }
              </div>
              <input
                ref={inputRef}
                type="text"
                value={input}
                onChange={handleInputChange}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey && !mentionVisible) handleSubmit();
                }}
                placeholder={replyTo ? `Trả lời @${replyTo.username}...` : 'Thêm bình luận...'}
                className="flex-1 bg-transparent border-none outline-none text-white text-[14px] font-body placeholder:text-[#555]"
              />
              <EmojiPickerButton
                onSelect={(emoji) => setInput((p) => p + emoji)}
                position="top"
                size={17}
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
          </div>

          {/* Gợi ý emoji nhanh */}
          <div className="flex gap-2 mt-2.5 px-1">
            {['😂', '❤️', '🔥', '👏', '😮', '💯', '😍', '😢'].map(emoji => (
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


/* ── CommentItemFull — Comment with replies, like API, @mention display ── */
function CommentItemFull({ comment, videoId, onReply, onLike }) {
  const [showReplies, setShowReplies] = useState(false);
  const [replies, setReplies] = useState([]);
  const [repliesLoading, setRepliesLoading] = useState(false);
  const [repliesLoaded, setRepliesLoaded] = useState(false);

  const handleToggleReplies = async () => {
    if (showReplies) {
      setShowReplies(false);
      return;
    }
    setShowReplies(true);
    if (!repliesLoaded) {
      setRepliesLoading(true);
      try {
        const r = await getReplies(videoId, comment.id);
        setReplies(r.data.replies || []);
        setRepliesLoaded(true);
      } catch {
        setReplies([]);
      } finally {
        setRepliesLoading(false);
      }
    }
  };

  // Like a reply (optimistic)
  const handleLikeReply = async (replyId, currentlyLiked) => {
    setReplies(prev => prev.map(r =>
      r.id === replyId
        ? { ...r, isLiked: !currentlyLiked, likes: currentlyLiked ? Math.max(0, r.likes - 1) : r.likes + 1 }
        : r
    ));
    try {
      if (currentlyLiked) await unlikeCommentApi(videoId, replyId);
      else await likeCommentApi(videoId, replyId);
    } catch {
      setReplies(prev => prev.map(r =>
        r.id === replyId
          ? { ...r, isLiked: currentlyLiked, likes: currentlyLiked ? r.likes + 1 : Math.max(0, r.likes - 1) }
          : r
      ));
    }
  };

  return (
    <div style={{ borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
      {/* Main comment */}
      <div className="py-3.5 flex gap-3">
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
            <RenderMentionText content={comment.content} mentions={comment.mentions} />
          </p>

          {/* Meta */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => onReply(comment)}
              className="bg-transparent border-none text-[#555] text-[12px] font-body cursor-pointer hover:text-[#888] transition-colors p-0"
            >
              Trả lời
            </button>

            {comment.replies > 0 && (
              <button
                onClick={handleToggleReplies}
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
            onClick={() => onLike(comment.id, comment.isLiked)}
            className="bg-transparent border-none cursor-pointer p-1 transition-transform active:scale-90"
            style={{ transform: comment.isLiked ? 'scale(1.1)' : 'scale(1)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24"
              fill={comment.isLiked ? '#ff2d78' : 'none'}
              stroke={comment.isLiked ? '#ff2d78' : '#555'}
              strokeWidth="1.5">
              <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
            </svg>
          </button>
          <span
            className="text-[10px] font-body"
            style={{ color: comment.isLiked ? '#ff2d78' : '#444' }}
          >
            {comment.likes > 0 ? formatCount(comment.likes) : ''}
          </span>
        </div>
      </div>

      {/* Replies */}
      {showReplies && (
        <div style={{ marginLeft: 48, paddingBottom: 8 }}>
          {repliesLoading ? (
            <div style={{ padding: '8px 0' }}>
              <div style={{
                width: 16, height: 16,
                border: '2px solid rgba(255,255,255,0.08)',
                borderTopColor: '#ff2d78',
                borderRadius: '50%',
                animation: 'spin 0.6s linear infinite',
              }} />
            </div>
          ) : (
            replies.map((reply, i) => (
              <div key={reply.id || i} className="py-2 flex gap-2.5" style={{ borderTop: i > 0 ? '1px solid rgba(255,255,255,0.03)' : 'none' }}>
                <div
                  className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-[10px] font-bold text-white"
                  style={{
                    background: reply.anh_dai_dien ? undefined : `hsl(${(reply.username?.charCodeAt(0) || 0) * 37 % 360}, 55%, 40%)`,
                    overflow: 'hidden',
                  }}
                >
                  {reply.anh_dai_dien
                    ? <img src={reply.anh_dai_dien} alt="" className="w-full h-full object-cover" />
                    : (reply.initials || reply.username?.[0]?.toUpperCase() || 'U')
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline gap-2 mb-0.5">
                    <span className="text-white text-[12px] font-semibold font-body">{reply.username}</span>
                    <span className="text-[#444] text-[10px] font-body">{formatTimeAgo(reply.createdAt)}</span>
                  </div>
                  <p className="text-[#ccc] text-[13px] font-body leading-relaxed m-0 break-words">
                    <RenderMentionText content={reply.content} mentions={reply.mentions} />
                  </p>
                </div>
                {/* Reply like */}
                <div className="flex flex-col items-center gap-0.5 shrink-0">
                  <button
                    onClick={() => handleLikeReply(reply.id, reply.isLiked)}
                    className="bg-transparent border-none cursor-pointer p-0.5 transition-transform active:scale-90"
                  >
                    <svg width="13" height="13" viewBox="0 0 24 24"
                      fill={reply.isLiked ? '#ff2d78' : 'none'}
                      stroke={reply.isLiked ? '#ff2d78' : '#555'}
                      strokeWidth="1.5">
                      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                    </svg>
                  </button>
                  {reply.likes > 0 && (
                    <span className="text-[9px] font-body" style={{ color: reply.isLiked ? '#ff2d78' : '#444' }}>
                      {formatCount(reply.likes)}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}


/* ── RenderMentionText — Hiển thị @username với màu highlight ── */
function RenderMentionText({ content, mentions = [] }) {
  if (!content) return null;
  if (!mentions || mentions.length === 0) {
    // Vẫn highlight @username dạng text
    const parts = content.split(/(@\w+)/g);
    return parts.map((part, i) =>
      part.startsWith('@')
        ? <span key={i} style={{ color: '#ff2d78', fontWeight: 600, cursor: 'pointer' }}>{part}</span>
        : part
    );
  }

  const mentionUsernames = mentions.map(m => m.username);
  const regex = new RegExp(`(@(?:${mentionUsernames.join('|')}))(?:\\s|$|[^\\w])`, 'g');

  // Simple split approach
  const parts = content.split(/(@\w+)/g);
  return parts.map((part, i) => {
    if (part.startsWith('@')) {
      const username = part.slice(1);
      const isMentioned = mentionUsernames.includes(username);
      return (
        <span
          key={i}
          style={{
            color: isMentioned ? '#ff2d78' : '#7eb8da',
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          {part}
        </span>
      );
    }
    return part;
  });
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