import React, { useState, useCallback, useEffect, useRef } from 'react';
import VideoCard from '../video/VideoCard/VideoCard';
import VideoCardActions from '../video/VideoCard/VideoCardActions';
import MobileCommentSheet from './MobileCommentSheet';
import MobileTopBar from './MobileTopBar';
import { BounceDots } from '../ui/Spinner';

const stopAllVideos = () => {
  document.querySelectorAll('video').forEach((v) => {
    if (!v.paused) { v.muted = true; v.pause(); }
  });
};

export default function MobileFeed({ videos, loading, hasMore, loadMore, feedType, onFeedTypeChange }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [commentVideoId, setCommentVideoId] = useState(null);
  const touchStartY = useRef(0);
  const touchStartTime = useRef(0);
  const isAnimating = useRef(false);
  const prevVideosLength = useRef(0);

  const firstVideoId = videos[0]?.id ?? null;
  useEffect(() => {
    if (prevVideosLength.current === 0 && videos.length > 0) {
      setCurrentIdx(0);
      setCommentVideoId(null);
    }
    prevVideosLength.current = videos.length;
  }, [firstVideoId, videos.length]);

  const go = useCallback((dir) => {
    if (isAnimating.current) return;
    const next = currentIdx + dir;
    if (dir > 0 && next >= videos.length - 3 && hasMore) loadMore();
    if (next >= 0 && next < videos.length) {
      stopAllVideos();
      isAnimating.current = true;
      setCurrentIdx(next);
      setCommentVideoId(null);
      setTimeout(() => { isAnimating.current = false; }, 350);
    }
  }, [currentIdx, videos.length, hasMore, loadMore]);

  const handleTouchStart = (e) => {
    touchStartY.current = e.touches[0].clientY;
    touchStartTime.current = Date.now();
  };

  const handleTouchEnd = (e) => {
    const dy = touchStartY.current - e.changedTouches[0].clientY;
    const dt = Date.now() - touchStartTime.current;
    if (Math.abs(dy) > 60 && dt < 400) go(dy > 0 ? 1 : -1);
  };

  if (loading && videos.length === 0) {
    return <div className="flex items-center justify-center h-full" style={{ background: '#000' }}><BounceDots /></div>;
  }

  const current = videos[currentIdx];
  if (!current) {
    return <div className="flex flex-col items-center justify-center h-full gap-3 text-white/30 font-body px-6 text-center" style={{ background: '#000' }}><p className="text-sm">Không có video nào</p></div>;
  }

  return (
    <div className="relative w-full flex-1 overflow-hidden" onTouchStart={handleTouchStart} onTouchEnd={handleTouchEnd} style={{ background: '#000', touchAction: 'pan-x' }}>
      <div className="absolute inset-0">
        <VideoCard key={current.id} video={current} isActive hideActions hideTopBar onComment={() => setCommentVideoId(current.id)} />
      </div>
      <MobileTopBar feedType={feedType} onFeedTypeChange={onFeedTypeChange} />
      <div className="absolute right-2 flex flex-col items-center gap-3 z-20" style={{ bottom: 'calc(90px + env(safe-area-inset-bottom))' }}>
        <VideoCardActions key={`${current.id}-actions`} video={current} inline onComment={() => setCommentVideoId(current.id)} />
      </div>
      {commentVideoId && <MobileCommentSheet videoId={commentVideoId} totalComments={current.comments} onClose={() => setCommentVideoId(null)} />}
    </div>
  );
}
