import React, { useState, useEffect } from 'react';
import { getComments, postComment } from '../../../services/videoService';
import { formatCount } from '../../../utils/formatters';
import { isNotEmpty, hasMaxLength } from '../../../utils/validators';
import CommentItem from './CommentItem';
import { SendIcon } from '../../../icons/ActionIcons';

/**
 * CommentPanel — panel bình luận dạng side drawer
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

  useEffect(() => {
    if (!videoId) return;
    setLoading(true);
    getComments(videoId)
      .then((r) => setComments(r.data.comments))
      .catch(() => setComments([]))
      .finally(() => setLoading(false));
  }, [videoId]);

  const handleSubmit = async () => {
    if (!isNotEmpty(input)) { setError('Vui lòng nhập bình luận'); return; }
    if (!hasMaxLength(input, 300)) { setError('Bình luận tối đa 300 ký tự'); return; }

    setError('');
    setSubmitting(true);
    try {
      const r = await postComment(videoId, { content: input });
      setComments((p) => [r.data.comment, ...p]);
      setInput('');
    } catch (e) {
      setError(e.message || 'Vui lòng đăng nhập để bình luận');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-[440px] h-full bg-[#0d0d18] border-l border-border flex flex-col shrink-0 animate-slide-right">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <span className="text-white text-[15px] font-semibold font-body">Bình luận</span>
          <span className="text-text-faint text-sm font-body">
            {formatCount(totalComments || comments.length)}
          </span>
        </div>
        <button
          onClick={onClose}
          className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border-none cursor-pointer text-text-secondary flex items-center justify-center text-base transition-colors"
        >
          ×
        </button>
      </div>

      {/* Comment list */}
      <div className="flex-1 overflow-auto px-5">
        {loading ? (
          <div className="text-center py-10 text-text-subtle text-[13px] font-body">
            Đang tải...
          </div>
        ) : comments.length === 0 ? (
          <div className="text-center py-10 text-text-subtle text-[13px] font-body">
            Chưa có bình luận nào
          </div>
        ) : (
          comments.map((c) => <CommentItem key={c.id} comment={c} />)
        )}
      </div>

      {/* Input */}
      <div className="px-5 py-4 border-t border-border">
        {error && (
          <p className="text-primary text-xs font-body mb-2">{error}</p>
        )}
        <div className="bg-elevated border border-border2 rounded-full flex items-center gap-3 px-4 py-2.5">
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              if (error) setError('');
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) handleSubmit();
            }}
            placeholder="Đăng nhập để bình luận"
            className="flex-1 bg-transparent border-none outline-none text-white text-sm font-body placeholder:text-text-faint"
          />
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className={`
              rounded-full w-7 h-7 border-none flex items-center justify-center
              cursor-pointer transition-colors shrink-0
              ${input.trim() ? 'bg-primary' : 'bg-transparent'}
              ${submitting ? 'opacity-60' : ''}
            `}
          >
            <SendIcon active={!!input.trim()} />
          </button>
        </div>
      </div>
    </div>
  );
}