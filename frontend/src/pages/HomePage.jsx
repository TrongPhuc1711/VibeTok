import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import VideoCard from '../components/video/VideoCard/VideoCard';
import CommentPanel from '../components/video/CommentPannel/CommentPanel';
import { BounceDots } from '../components/ui/Spinner';
import { useVideoFeed } from '../hooks/useVideoFeed';

// 1. Nhận feedType từ App.jsx truyền vào
export default function HomePage({ feedType = 'forYou' }) {
  // 2. Truyền feedType vào hook
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
    // 3. Đã xóa thẻ <div className="flex h-screen..."> bọc ngoài cùng gây lỗi layout
    <PageLayout rightPanel={rightPanel} noPadding>
      <div
        // 4. Đảm bảo thẻ div này chiếm toàn bộ không gian của PageLayout
        className="w-full h-full relative outline-none bg-base"
        tabIndex={0}
        onWheel={(e) => go(e.deltaY > 0 ? 1 : -1)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') go(1);
          if (e.key === 'ArrowUp') go(-1);
        }}
      >
        {loading ? (
          <div className="flex h-full items-center justify-center">
            <BounceDots />
          </div>
        ) : current ? (
          <>
            <VideoCard
              video={current}
              isActive
              onComment={() => setShowComments(true)}
            />

            {/* Dot navigator */}
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex flex-col gap-1.5 z-20">
              {videos.map((v, i) => (
                <div
                  key={v.id}
                  onClick={() => setCurrentIdx(i)}
                  className={`
                    rounded-full cursor-pointer transition-all self-center
                    ${i === currentIdx
                      ? 'w-2 h-2 bg-primary'
                      : 'w-1 h-1 bg-white/20 hover:bg-white/40'
                    }
                  `}
                />
              ))}
            </div>
          </>
        ) : (
          <div className="flex flex-col items-center justify-center h-full gap-3 text-text-subtle font-body">
            <span className="text-[32px]">🎬</span>
            <p>Không có video nào. Hãy theo dõi thêm creator!</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}