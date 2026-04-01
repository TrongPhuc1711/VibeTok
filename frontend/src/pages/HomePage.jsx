import React, { useState, useCallback } from 'react';
import PageLayout from '../components/layout/PageLayout';
import VideoCard from '../components/video/VideoCard/VideoCard';
import VideoCardActions from '../components/video/VideoCard/VideoCardActions';
import CommentPanel from '../components/video/CommentPannel/CommentPanel';
import { BounceDots } from '../components/ui/Spinner';
import { useVideoFeed } from '../hooks/useVideoFeed';

function ArrowUp() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}
function ArrowDown() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

export default function HomePage({ feedType = 'forYou' }) {
  const { videos, loading } = useVideoFeed(feedType);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [commentVideoId, setCommentVideoId] = useState(null);

  const current = videos[currentIdx];
  const showComments = commentVideoId !== null;

  const go = useCallback((dir) => {
    const next = currentIdx + dir;
    if (next >= 0 && next < videos.length) {
      setCurrentIdx(next);
      setCommentVideoId(null); // đóng comment khi chuyển video
    }
  }, [currentIdx, videos.length]);

  const handleOpenComment = useCallback((videoId) => {
    setCommentVideoId(videoId || current?.id || null);
  }, [current]);

  const handleCloseComment = useCallback(() => {
    setCommentVideoId(null);
  }, []);

  return (
    <PageLayout noPadding>
      <div
        className="relative w-full h-full flex items-center justify-center bg-[#0a0a0f] outline-none select-none overflow-hidden"
        tabIndex={0}
        onWheel={(e) => go(e.deltaY > 0 ? 1 : -1)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') go(1);
          if (e.key === 'ArrowUp') go(-1);
        }}
      >
        {loading ? (
          <BounceDots />
        ) : current ? (
          <div className="flex items-center justify-center w-full h-full">

            {/* ── Vùng video + actions ── */}
            <div className="flex items-end gap-4 relative">

              {/* ── Video container — tự co dãn theo tỉ lệ 9:16 ── */}
              <div
                className="relative rounded-2xl overflow-hidden shadow-2xl flex-shrink-0 bg-black"
                style={{
                  /* Chiều cao tối đa 88vh, chiều rộng tự tính theo 9:16 */
                  height: 'min(88vh, 780px)',
                  width: 'min(calc(88vh * 9/16), calc(780px * 9/16), calc(100vw - 420px))',
                  minWidth: 270,
                  maxWidth: 440,
                }}
              >
                <VideoCard
                  key={current.id}
                  video={current}
                  isActive
                  hideActions
                  hideTopBar
                  onComment={() => handleOpenComment(current.id)}
                />
              </div>

              {/* ── Actions bên phải video ── */}
              <div className="flex flex-col items-center gap-1 pb-4 shrink-0">
                <VideoCardActions
                  key={current.id + '-actions'}
                  video={current}
                  inline
                  onComment={() => handleOpenComment(current.id)}
                />
              </div>
            </div>

            {/* ── Nút mũi tên điều hướng ── */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-50">
              <button
                onClick={() => go(-1)}
                disabled={currentIdx === 0}
                className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed border-none"
              >
                <ArrowUp />
              </button>
              <button
                onClick={() => go(1)}
                disabled={currentIdx === videos.length - 1}
                className="w-9 h-9 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed border-none"
              >
                <ArrowDown />
              </button>
            </div>

            {/* ── Comment Panel — overlay kiểu TikTok ── */}
            {showComments && (
              <CommentPanel
                videoId={commentVideoId}
                totalComments={current.comments}
                onClose={handleCloseComment}
              />
            )}
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/40 font-body">
            <span className="text-[40px]">🎬</span>
            <p className="text-sm">Không có video nào. Hãy theo dõi thêm creator!</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}