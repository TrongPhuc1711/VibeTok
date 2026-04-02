import React, { useState, useCallback, useEffect } from 'react';
import PageLayout from '../components/layout/PageLayout';
import VideoCard from '../components/video/VideoCard/VideoCard';
import VideoCardActions from '../components/video/VideoCard/VideoCardActions';
import CommentPanel from '../components/video/CommentPannel/CommentPanel';
import { BounceDots } from '../components/ui/Spinner';
import { useVideoFeed } from '../hooks/useVideoFeed';

/* ── Nav arrow button ── */
function NavArrow({ direction, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="w-[38px] h-[38px] rounded-full flex items-center justify-center border-none cursor-pointer transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:bg-white/20 active:scale-95"
      style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', color: 'white' }}
    >
      {direction === 'up' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="18 15 12 9 6 15" /></svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><polyline points="6 9 12 15 18 9" /></svg>
      )}
    </button>
  );
}

/* ── Hook tính kích thước video container ── */
function useVideoContainerSize(aspectRatio, showComments) {
  const [size, setSize] = useState({ width: 360, height: 640 });

  useEffect(() => {
    const calculate = () => {
      const SIDEBAR_W  = 240;
      const ACTIONS_W  = 80;
      const COMMENT_W  = showComments ? 420 : 0;
      const NAV_W      = 60;
      const PADDING    = 48;

      const availW = window.innerWidth  - SIDEBAR_W - ACTIONS_W - COMMENT_W - NAV_W - PADDING;
      const availH = window.innerHeight * 0.88;

      let w = availH * aspectRatio;
      let h = availH;

      if (w > availW) {
        w = availW;
        h = w / aspectRatio;
      }

      w = Math.max(220, Math.round(w));
      h = Math.max(280, Math.round(h));

      setSize({ width: w, height: h });
    };

    calculate();
    window.addEventListener('resize', calculate);
    return () => window.removeEventListener('resize', calculate);
  }, [aspectRatio, showComments]);

  return size;
}

/* ── Main component ── */
export default function HomePage({ feedType = 'forYou' }) {
  const { videos, loading, loadMore, hasMore } = useVideoFeed(feedType);
  const [currentIdx,     setCurrentIdx]     = useState(0);
  const [commentVideoId, setCommentVideoId] = useState(null);
  const [aspectRatio,    setAspectRatio]    = useState(9 / 16);

  const current      = videos[currentIdx];
  const showComments = commentVideoId !== null;
  const containerSize = useVideoContainerSize(aspectRatio, showComments);

  /* Giữ Comment khi lướt  */
  const go = useCallback((dir) => {
    const next = currentIdx + dir;
    if (dir > 0 && next >= videos.length - 3 && hasMore) loadMore();
    
    if (next >= 0 && next < videos.length) {
      setCurrentIdx(next);
      
      //  load bình luận của video mới
      setCommentVideoId(prev => prev !== null ? videos[next].id : null);
      
      setAspectRatio(9 / 16);
    }
  }, [currentIdx, videos, hasMore, loadMore]);

  const handleWheel = useCallback((e) => {
    e.preventDefault();
    go(e.deltaY > 0 ? 1 : -1);
  }, [go]);

  /*  Xử lý phím mũi tên ── */
  const handleKeyDown = useCallback((e) => {
    const tag = e.target?.tagName?.toLowerCase();

    if (tag === 'input' || tag === 'textarea') return;
    
    if (e.key === 'ArrowDown' || e.key === 'j') go(1);
    if (e.key === 'ArrowUp'   || e.key === 'k') go(-1);
  }, [go]);

  return (
    <PageLayout noPadding>
      <div
        className="relative w-full h-full flex flex-row outline-none select-none overflow-hidden"
        style={{ background: '#08080f' }}
        tabIndex={0}
        onWheel={handleWheel}
        onKeyDown={handleKeyDown}
      >
        {loading ? (
          <div className="flex-1 flex items-center justify-center"><BounceDots /></div>
        ) : current ? (
          <>
            {/* Video + Actions ── */}
            <div 
              className="flex-1 relative flex items-center justify-center"
              onWheel={handleWheel} 
            >

              {/* Video + Action Buttons */}
              <div className="flex items-end relative" style={{ gap: 16 }}>

                {/* Video container  */}
                <div
                  className="relative flex-shrink-0 rounded-xl overflow-hidden shadow-2xl"
                  style={{
                    width:  containerSize.width,
                    height: containerSize.height,
                    background: '#000',
                  }}
                >
                  <VideoCard
                    key={current.id}
                    video={current}
                    isActive
                    hideActions
                    hideTopBar
                    onRatio={(r) => setAspectRatio(r)}
                    onComment={() => setCommentVideoId(current.id)}
                  />
                </div>

                {/* Action buttons */}
                <div className="flex-shrink-0 flex flex-col items-center pb-3">
                  <VideoCardActions
                    key={current.id + '-actions'}
                    video={current}
                    inline
                    onComment={() => setCommentVideoId(current.id)}
                  />
                </div>
              </div>

              <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-3 z-[350]">
                <NavArrow direction="up"   onClick={() => go(-1)} disabled={currentIdx === 0} />
                <NavArrow direction="down" onClick={() => go(1)}  disabled={currentIdx === videos.length - 1} />
              </div>

            </div>

            {/* Khung Bình luận ── */}
            {showComments && (
              <div 
                className="w-[420px] h-full bg-[#121212] border-l border-white/10 shrink-0 shadow-2xl z-40"
                onWheel={(e) => e.stopPropagation()} 
              >
                <CommentPanel
                  videoId={commentVideoId}
                  totalComments={current.comments}
                  onClose={() => setCommentVideoId(null)}
                />
              </div>
            )}
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-3 font-body text-white/25">
            <span className="text-[44px]">🎬</span>
            <p style={{ fontSize: 14 }}>Không có video nào. Hãy theo dõi thêm creator!</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}