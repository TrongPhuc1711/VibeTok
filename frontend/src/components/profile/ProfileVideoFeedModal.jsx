import React, { useState, useCallback, useEffect, useRef } from 'react';
import VideoCard from '../video/VideoCard/VideoCard';
import VideoCardActions from '../video/VideoCard/VideoCardActions';
import CommentPanel from '../video/CommentPannel/CommentPanel';

/**
 * ProfileVideoFeedModal
 *
 * Props:
 *  videos       – mảng video của user (đã fetch từ profile)
 *  initialIndex – index của video được click vào ban đầu
 *  onClose      – () => void
 */
export default function ProfileVideoFeedModal({ videos = [], initialIndex = 0, onClose }) {
  const [currentIdx,     setCurrentIdx]     = useState(initialIndex);
  const [commentVideoId, setCommentVideoId] = useState(null);
  const [visible,        setVisible]        = useState(false);
  const [aspectRatio,    setAspectRatio]    = useState(9 / 16);
  const containerRef = useRef(null);

  const current      = videos[currentIdx];
  const showComments = commentVideoId !== null;

  /* ── Mount animation ── */
  useEffect(() => {
    requestAnimationFrame(() => setVisible(true));
  }, []);

  /* ── Đóng modal với animation ── */
  const handleClose = useCallback(() => {
    setVisible(false);
    setTimeout(onClose, 260);
  }, [onClose]);

  /* ── Keyboard navigation ── */
  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') { handleClose(); return; }
      const tag = e.target?.tagName?.toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      if (showComments) return;
      if (e.key === 'ArrowDown' || e.key === 'j') go(1);
      if (e.key === 'ArrowUp'   || e.key === 'k') go(-1);
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [handleClose, showComments, currentIdx]);

  /* ── Chuyển video ── */
  const go = useCallback((dir) => {
    const next = currentIdx + dir;
    if (next >= 0 && next < videos.length) {
      setCurrentIdx(next);
      setCommentVideoId(null);
      setAspectRatio(9 / 16);
    }
  }, [currentIdx, videos.length]);

  /* ── Wheel scroll (chỉ khi không mở comment) ── */
  const handleWheel = useCallback((e) => {
    if (showComments) return;
    e.preventDefault();
    go(e.deltaY > 0 ? 1 : -1);
  }, [go, showComments]);

  /* ── Tính kích thước video ── */
  const videoH   = Math.min(window.innerHeight * 0.86, 720);
  const videoW   = Math.round(videoH * aspectRatio);
  const maxVideoW = showComments
    ? Math.min(videoW, window.innerWidth - 420 - 88 - 48)
    : Math.min(videoW, window.innerWidth - 88 - 48);

  if (!current) return null;

  return (
    <div
      className="fixed inset-0 z-[300] flex items-center justify-center"
      style={{
        background:     'rgba(5, 5, 10, 0.96)',
        backdropFilter: 'blur(16px)',
        opacity:        visible ? 1 : 0,
        transition:     'opacity 0.26s ease',
      }}
    >
      {/* ── Nút đóng X ── */}
      <button
        onClick={handleClose}
        className="absolute top-5 left-5 z-[400] flex items-center gap-2 border-none cursor-pointer transition-all group"
        style={{
          background: 'rgba(255,255,255,0.08)',
          borderRadius: 12,
          padding: '8px 14px',
          color: 'rgba(255,255,255,0.7)',
        }}
        title="Đóng (Esc)"
      >
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round"
          style={{ transition: 'transform 0.2s' }}
          className="group-hover:rotate-90"
        >
          <path d="M3 3l10 10M13 3L3 13" />
        </svg>
      </button>

      

      {/* ── Body: Video + Actions ── */}
      <div
        ref={containerRef}
        className="flex items-end"
        style={{ gap: 16 }}
        onWheel={handleWheel}
      >
        {/* Video container */}
        <div
          className="relative flex-shrink-0 overflow-hidden"
          style={{
            width:        maxVideoW,
            height:       videoH,
            borderRadius: 16,
            background:   '#000',
            boxShadow:    '0 32px 80px rgba(0,0,0,0.7)',
            transform:    visible ? 'scale(1)' : 'scale(0.96)',
            transition:   'transform 0.26s ease',
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
        <div className="flex-shrink-0 flex flex-col items-center" style={{ paddingBottom: 12 }}>
          <VideoCardActions
            key={current.id + '-actions'}
            video={current}
            inline
            onComment={() => setCommentVideoId(current.id)}
          />
        </div>
      </div>

      {/* ── Mũi tên điều hướng (ẩn khi mở comment) ── */}
      {!showComments && (
        <div
          className="absolute flex flex-col gap-2 z-[350]"
          style={{ right: 16, top: '50%', transform: 'translateY(-50%)' }}
        >
          <NavArrow
            direction="up"
            onClick={() => go(-1)}
            disabled={currentIdx === 0}
          />
          <NavArrow
            direction="down"
            onClick={() => go(1)}
            disabled={currentIdx === videos.length - 1}
          />
        </div>
      )}

      {/* ── Dot pagination (bottom center) ── */}
      {!showComments && videos.length > 1 && (
        <div
          className="absolute bottom-5 left-1/2 flex gap-1.5"
          style={{ transform: 'translateX(-50%)' }}
        >
          {videos.slice(
            Math.max(0, currentIdx - 4),
            Math.min(videos.length, currentIdx + 5)
          ).map((_, i) => {
            const realIdx = Math.max(0, currentIdx - 4) + i;
            const isActive = realIdx === currentIdx;
            return (
              <button
                key={realIdx}
                onClick={() => { setCurrentIdx(realIdx); setCommentVideoId(null); }}
                style={{
                  width:      isActive ? 20 : 6,
                  height:     6,
                  borderRadius: 3,
                  background: isActive ? '#ff2d78' : 'rgba(255,255,255,0.25)',
                  border:     'none',
                  cursor:     'pointer',
                  padding:    0,
                  transition: 'all 0.2s ease',
                  flexShrink: 0,
                }}
              />
            );
          })}
        </div>
      )}

      {/* ── Comment Panel ── */}
      {showComments && (
        <CommentPanel
          videoId={commentVideoId}
          totalComments={current.comments}
          onClose={() => setCommentVideoId(null)}
        />
      )}
    </div>
  );
}

/* ── NavArrow ── */
function NavArrow({ direction, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width:        44,
        height:       44,
        borderRadius: '50%',
        background:   'rgba(255,255,255,0.1)',
        backdropFilter: 'blur(8px)',
        border:       '1px solid rgba(255,255,255,0.12)',
        color:        'white',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        cursor:       disabled ? 'not-allowed' : 'pointer',
        opacity:      disabled ? 0.2 : 1,
        transition:   'all 0.15s ease',
      }}
      className="hover:scale-105 active:scale-95"
    >
      {direction === 'up' ? (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="18 15 12 9 6 15" />
        </svg>
      ) : (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
          <polyline points="6 9 12 15 18 9" />
        </svg>
      )}
    </button>
  );
}