import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import VideoCard from '../components/video/VideoCard/VideoCard';
import VideoCardActions from '../components/video/VideoCard/VideoCardActions';
import CommentPanel from '../components/video/CommentPannel/CommentPanel';
import { BounceDots } from '../components/ui/Spinner';
import { useVideoFeed } from '../hooks/useVideoFeed';

export default function HomePage({ feedType = 'forYou' }) {
  const { videos, loading } = useVideoFeed(feedType);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [showComments, setShowComments] = useState(false);

  const current = videos[currentIdx];

  const go = (dir) => {
    const next = currentIdx + dir;
    if (next >= 0 && next < videos.length) setCurrentIdx(next);
  };

  const rightPanel =
    showComments && current ? (
      <CommentPanel
        videoId={current.id}
        totalComments={current.comments}
        onClose={() => setShowComments(false)}
      />
    ) : null;

  return (
    <PageLayout rightPanel={rightPanel} noPadding>
      <div
        className="w-full h-full flex items-center justify-center bg-black outline-none select-none"
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
          /* ── TikTok-style layout: video + side actions ── */
          <div className="flex items-end gap-3" style={{ height: 'min(calc(100vh - 40px), 760px)' }}>

            {/* ── Navigation: Lên ── */}
            <div className="flex flex-col gap-3 mb-16 shrink-0">
              <button
                onClick={() => go(-1)}
                disabled={currentIdx === 0}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center
                           text-white hover:bg-white/20 transition-all cursor-pointer
                           disabled:opacity-20 disabled:cursor-not-allowed border-none"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15" />
                </svg>
              </button>
              <button
                onClick={() => go(1)}
                disabled={currentIdx === videos.length - 1}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center
                           text-white hover:bg-white/20 transition-all cursor-pointer
                           disabled:opacity-20 disabled:cursor-not-allowed border-none"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9" />
                </svg>
              </button>
            </div>

            {/* ── Video portrait 9:16 ── */}
            <div
              className="relative rounded-2xl overflow-hidden shadow-2xl flex-shrink-0"
              style={{
                /* chiều cao = 100% khung, chiều rộng theo tỉ lệ 9:16 */
                height: '100%',
                width: 'calc(min(calc(100vh - 40px), 760px) * 9 / 16)',
                maxWidth: '430px',
                minWidth: '280px',
              }}
            >
              <VideoCard
                key={current.id}
                video={current}
                isActive
                hideActions              /* actions được render bên ngoài */
                onComment={() => setShowComments(true)}
              />
            </div>

            {/* ── Side actions — kiểu TikTok ── */}
            <div className="flex flex-col items-center mb-20 shrink-0">
              <VideoCardActions
                key={current.id + '-actions'}
                video={current}
                inline                   /* render dạng column, không absolute */
                onComment={() => setShowComments(true)}
              />
            </div>

          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 text-white/60 font-body">
            <span className="text-[32px]">🎬</span>
            <p>Không có video nào. Hãy theo dõi thêm creator!</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}