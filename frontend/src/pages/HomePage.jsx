import React, { useState } from 'react';
import PageLayout from '../components/layout/PageLayout';
import VideoCard from '../components/video/VideoCard/VideoCard';
import VideoCardActions from '../components/video/VideoCard/VideoCardActions';
import CommentPanel from '../components/video/CommentPannel/CommentPanel';
import { BounceDots } from '../components/ui/Spinner';
import { useVideoFeed } from '../hooks/useVideoFeed';

/* ── Icon mũi tên ── */
function ArrowUp() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="18 15 12 9 6 15" />
    </svg>
  );
}
function ArrowDown() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6 9 12 15 18 9" />
    </svg>
  );
}

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
        // Đã thêm 'relative' để làm gốc tọa độ cho các nút absolute
        className="relative w-full h-full flex items-center justify-center bg-black outline-none select-none"
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
            {/* ── Nút Navigation (Lên/Xuống) — Tách riêng ra ngoài cùng bên phải ── */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-50">
              <button
                onClick={() => go(-1)}
                disabled={currentIdx === 0}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed border-none"
              >
                <ArrowUp />
              </button>

              <button
                onClick={() => go(1)}
                disabled={currentIdx === videos.length - 1}
                className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all cursor-pointer disabled:opacity-20 disabled:cursor-not-allowed border-none"
              >
                <ArrowDown />
              </button>
            </div>

            {/* ── Khu vực Video và Các nút Tương tác ── */}
            {(() => {
              const videoH = 'min(calc(100vh - 40px), 760px)';

              return (
                <div className="flex items-end gap-2">

                  {/* ── Video ── */}
                  <div
                    className="relative rounded-2xl overflow-hidden shadow-2xl flex-shrink-0"
                    style={{
                      height: videoH,
                      width: `calc(${videoH} * 9 / 16)`,
                      maxWidth: '430px',
                      minWidth: '280px',
                    }}
                  >
                    <VideoCard
                      key={current.id}
                      video={current}
                      isActive
                      hideActions
                      hideTopBar
                      onComment={() => setShowComments(true)}
                    />
                  </div>

                  {/* ── Cột phải (Bây giờ chỉ chứa các nút Tương tác) ── */}
                  <div
                    className="flex flex-col shrink-0 justify-end pb-4"
                    style={{ height: videoH }}
                  >
                    <VideoCardActions
                      key={current.id + '-actions'}
                      video={current}
                      inline
                      onComment={() => setShowComments(true)}
                    />
                  </div>

                </div>
              );
            })()}
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