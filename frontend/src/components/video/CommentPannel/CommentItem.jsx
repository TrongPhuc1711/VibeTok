import React, { useState } from 'react';
import { formatCount, formatTimeAgo } from '../../../utils/formatters';

/*
 CommentItem — một dòng bình luận
 
 Props:
 comment – { id, username, initials, content, likes, replies, createdAt }
 */
export default function CommentItem({ comment }) {
  const [liked, setLiked] = useState(false);
  const [likes, setLikes] = useState(comment.likes ?? 0);

  const toggleLike = () => {
    setLiked((l) => !l);
    setLikes((n) => (liked ? n - 1 : n + 1));
  };

  return (
    <div className="py-3.5 flex gap-3 border-b border-border/50 last:border-0">
      {/* Avatar */}
      <div className="w-[38px] h-[38px] rounded-full bg-gradient-to-br from-[#2a2a4a] to-[#3a3a5a] flex items-center justify-center text-xs font-bold text-text-secondary shrink-0">
        {comment.initials}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <p className="text-[#ccc] text-[13px] font-semibold font-body mb-1">
          {comment.username}
        </p>
        <p className="text-[#ddd] text-sm font-body leading-relaxed m-0 mb-1.5 break-words">
          {comment.content}
        </p>

        {/* Meta row */}
        <div className="flex items-center gap-4">
          <span className="text-text-faint text-xs font-body">
            {formatTimeAgo(comment.createdAt)}
          </span>

          <button className="bg-transparent border-none text-text-faint text-xs cursor-pointer font-body hover:text-text-secondary transition-colors">
            Trả lời
          </button>

          {comment.replies > 0 && (
            <span className="text-text-faint text-xs font-body cursor-pointer hover:text-text-secondary transition-colors">
              — Xem {comment.replies} trả lời ∨
            </span>
          )}

          {/* Like */}
          <button
            onClick={toggleLike}
            className={`
              ml-auto bg-transparent border-none text-xs cursor-pointer font-body
              flex items-center gap-1 transition-colors
              ${liked ? 'text-primary' : 'text-text-faint'}
            `}
          >
            ♥ {formatCount(likes)}
          </button>
        </div>
      </div>
    </div>
  );
}