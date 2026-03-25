import React, { useState, useEffect } from 'react';
import { getComments, postComment } from '../../services/videoService';
import { formatCount, formatTimeAgo } from '../../utils/formatters';
import { isNotEmpty, hasMaxLength } from '../../utils/validators';

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
            .then(r => setComments(r.data.comments))
            .catch(() => setComments([]))
            .finally(() => setLoading(false));
    }, [videoId]);

    const handleSubmit = async () => {
        if (!isNotEmpty(input)) { setError('Vui lòng nhập bình luận'); return; }
        if (!hasMaxLength(input, 300)) { setError('Bình luận tối đa 300 ký tự'); return; }
        setError(''); setSubmitting(true);
        try {
            const r = await postComment(videoId, { content: input });
            setComments(p => [r.data.comment, ...p]);
            setInput('');
        } catch (e) { setError(e.message || 'Vui lòng đăng nhập để bình luận'); }
        finally { setSubmitting(false); }
    };

    return (
        <div className="w-[440px] h-full bg-[#0d0d18] border-l border-border flex flex-col shrink-0 animate-slide-right">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
                <div className="flex items-center gap-2">
                    <span className="text-white text-[15px] font-semibold font-body">Bình luận</span>
                    <span className="text-text-faint text-sm font-body">{formatCount(totalComments || comments.length)}</span>
                </div>
                <button onClick={onClose}
                    className="w-7 h-7 rounded-full bg-white/5 hover:bg-white/10 border-none cursor-pointer text-text-secondary flex items-center justify-center text-base transition-colors">
                    ×
                </button>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto px-5">
                {loading
                    ? <div className="text-center py-10 text-text-subtle text-[13px] font-body">Đang tải...</div>
                    : comments.length === 0
                        ? <div className="text-center py-10 text-text-subtle text-[13px] font-body">Chưa có bình luận nào</div>
                        : comments.map(c => <CommentItem key={c.id} comment={c} />)
                }
            </div>

            {/* Input */}
            <div className="px-5 py-4 border-t border-border">
                {error && <p className="text-primary text-xs font-body mb-2">{error}</p>}
                <div className="bg-elevated border border-border2 rounded-full flex items-center gap-3 px-4 py-2.5">
                    <input
                        type="text" value={input}
                        onChange={e => { setInput(e.target.value); if (error) setError(''); }}
                        onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) handleSubmit(); }}
                        placeholder="Đăng nhập để bình luận"
                        className="flex-1 bg-transparent border-none outline-none text-white text-sm font-body placeholder:text-text-faint"
                    />
                    <button onClick={handleSubmit} disabled={submitting}
                        className={`rounded-full w-7 h-7 border-none flex items-center justify-center cursor-pointer transition-colors shrink-0
              ${input.trim() ? 'bg-primary' : 'bg-transparent'} ${submitting ? 'opacity-60' : ''}`}>
                        <SendIcon active={!!input.trim()} />
                    </button>
                </div>
            </div>
        </div>
    );
}

function CommentItem({ comment }) {
    const [liked, setLiked] = useState(false);
    const [likes, setLikes] = useState(comment.likes);

    return (
        <div className="py-3.5 flex gap-3 border-b border-border/50 last:border-0">
            <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#2a2a4a] to-[#3a3a5a] flex items-center justify-center text-xs font-bold text-text-secondary shrink-0">
                {comment.initials}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[#ccc] text-[13px] font-semibold font-body mb-1">{comment.username}</p>
                <p className="text-[#ddd] text-sm font-body leading-relaxed m-0 mb-1.5 break-words">{comment.content}</p>
                <div className="flex items-center gap-4">
                    <span className="text-text-faint text-xs font-body">{formatTimeAgo(comment.createdAt)}</span>
                    <button className="bg-transparent border-none text-text-faint text-xs cursor-pointer font-body hover:text-text-secondary">
                        Trả lời
                    </button>
                    {comment.replies > 0 && (
                        <span className="text-text-faint text-xs font-body cursor-pointer hover:text-text-secondary">
                            — Xem {comment.replies} trả lời ∨
                        </span>
                    )}
                    <button
                        onClick={() => { setLiked(l => !l); setLikes(n => liked ? n - 1 : n + 1); }}
                        className={`ml-auto bg-transparent border-none text-xs cursor-pointer font-body flex items-center gap-1 transition-colors ${liked ? 'text-primary' : 'text-text-faint'}`}
                    >
                        ♥ {formatCount(likes)}
                    </button>
                </div>
            </div>
        </div>
    );
}

function SendIcon({ active }) {
    return <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
        stroke={active ? '#fff' : '#555'}
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round">
        <path d="M13 1L6 8M13 1L9 13L6 8L1 5L13 1Z" />
    </svg>;
}