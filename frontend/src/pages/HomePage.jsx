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
      className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer transition-all disabled:opacity-20 disabled:cursor-not-allowed hover:scale-105"
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

      // Giới hạn tối thiểu
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
  const { videos, loading } = useVideoFeed(feedType);
  const [currentIdx,     setCurrentIdx]     = useState(0);
  const [commentVideoId, setCommentVideoId] = useState(null);
  // Tỉ lệ w/h thực của video hiện tại
  const [aspectRatio,    setAspectRatio]    = useState(9 / 16);

  const current      = videos[currentIdx];
  const showComments = commentVideoId !== null;
  const containerSize = useVideoContainerSize(aspectRatio, showComments);

  /* Chuyển video */
  const go = useCallback((dir) => {
    const next = currentIdx + dir;
    if (next >= 0 && next < videos.length) {
      setCurrentIdx(next);
      setCommentVideoId(null);
      // Reset về 9:16 mặc định → VideoCard sẽ update khi metadata load
      setAspectRatio(9 / 16);
    }
  }, [currentIdx, videos.length]);

  /* Wheel scroll */
  const handleWheel = useCallback((e) => {
    e.preventDefault();
    go(e.deltaY > 0 ? 1 : -1);
  }, [go]);

  return (
    <PageLayout noPadding>
      <div
        className="relative w-full h-full flex items-center justify-center outline-none select-none overflow-hidden"
        style={{ background: '#08080f' }}
        tabIndex={0}
        onWheel={handleWheel}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'j') go(1);
          if (e.key === 'ArrowUp'   || e.key === 'k') go(-1);
        }}
      >
        {loading ? (
          <BounceDots />
        ) : current ? (
          <>
            {/* ── Layout chính: Video + Actions ── */}
            <div
              className="flex items-end"
              style={{ gap: 16 }}
            >
              {/* ── Video container — co dãn theo tỉ lệ thực ── */}
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

              {/* ── Action buttons ── */}
              <div
                className="flex-shrink-0 flex flex-col items-center"
                style={{ paddingBottom: 12 }}
              >
                <VideoCardActions
                  key={current.id + '-actions'}
                  video={current}
                  inline
                  onComment={() => setCommentVideoId(current.id)}
                />
              </div>
            </div>

            {/* ── Mũi tên điều hướng ── */}
            <div
              className="absolute flex flex-col gap-2 z-50"
              style={{ right: 12, top: '50%', transform: 'translateY(-50%)' }}
            >
              <NavArrow direction="up"   onClick={() => go(-1)} disabled={currentIdx === 0} />
              <NavArrow direction="down" onClick={() => go(1)}  disabled={currentIdx === videos.length - 1} />
            </div>

            {/* ── Comment Panel ── */}
            {showComments && (
              <CommentPanel
                videoId={commentVideoId}
                totalComments={current.comments}
                onClose={() => setCommentVideoId(null)}
              />
            )}
          </>
        ) : (
          <div className="flex flex-col items-center gap-3 font-body" style={{ color: 'rgba(255,255,255,0.25)' }}>
            <span style={{ fontSize: 44 }}>🎬</span>
            <p style={{ fontSize: 14 }}>Không có video nào. Hãy theo dõi thêm creator!</p>
          </div>
        )}
      </div>
    </PageLayout>
  );
}