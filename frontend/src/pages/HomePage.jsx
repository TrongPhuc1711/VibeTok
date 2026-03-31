import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import VideoCard from '../components/video/VideoCard/VideoCard';
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
        // Đặt bg-black giống TikTok và relative để làm mốc cho nút bấm absolute
        className="w-full h-full relative flex items-center justify-center bg-black outline-none"
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
          <>
            {/* 1. Khu vực Video - Đặt chính giữa */}
            <div
              className="relative rounded-xl overflow-hidden shadow-2xl flex-shrink-0"
              // Kích thước linh hoạt, tối đa 700px để không bị lố màn hình
              style={{ width: '400px', height: 'calc(100vh - 120px)', maxHeight: '700px' }}
            >
              <VideoCard
                video={current}
                isActive
                onComment={() => setShowComments(true)}
              />
            </div>

            {/* 2. Nút điều hướng - Cố định ở giữa, mép ngoài cùng bên phải */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-50">
              {/* Nút Lên */}
              <button
                onClick={() => go(-1)}
                disabled={currentIdx === 0}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="18 15 12 9 6 15"></polyline>
                </svg>
              </button>
              
              {/* Nút Xuống */}
              <button
                onClick={() => go(1)}
                disabled={currentIdx === videos.length - 1}
                className="w-12 h-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed"
              >
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6 9 12 15 18 9"></polyline>
                </svg>
              </button>
            </div>
          </>
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