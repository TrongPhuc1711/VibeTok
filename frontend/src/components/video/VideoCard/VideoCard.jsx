import React, { useRef, useState, useEffect } from 'react';
import VideoCardTopBar from './VideoCardTopBar';
import VideoCardInfo from './VideoCardInfo';
import VideoCardActions from './VideoCardActions';
import { VideoPlaySmIcon } from '../../../icons/CommonIcons';

/* ─────────────────────────────────────────────
   Like persistence helpers (localStorage)
───────────────────────────────────────────── */
const LIKES_KEY = 'vibetok_liked_videos';

export const getLikedSet = () => {
  try { return new Set(JSON.parse(localStorage.getItem(LIKES_KEY) || '[]')); }
  catch { return new Set(); }
};

export const saveLikedSet = (set) => {
  localStorage.setItem(LIKES_KEY, JSON.stringify([...set]));
};

export const isVideoLiked = (videoId) => getLikedSet().has(String(videoId));

export const toggleVideoLike = (videoId) => {
  const set = getLikedSet();
  const id  = String(videoId);
  if (set.has(id)) set.delete(id); else set.add(id);
  saveLikedSet(set);
  return set.has(id);
};

export default function VideoCard({
  video,
  isActive,
  onComment,
  onLike,
  onShare,
  onBookmark,
  onRatio,          // callback(width/height)
  hideActions = false,
  hideTopBar  = false,
}) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted,   setMuted]   = useState(true);

  const hue = (parseInt(video?.id?.slice(-3) ?? '0', 16) || 0) % 360;

  /* Auto play / pause */
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      v.pause(); v.currentTime = 0; setPlaying(false);
    }
  }, [isActive]);

  /* Khi metadata load xong → báo tỉ lệ thực cho parent */
  const handleLoadedMetadata = () => {
    const v = videoRef.current;
    if (v?.videoWidth && v?.videoHeight && onRatio) {
      onRatio(v.videoWidth / v.videoHeight);
    }
  };

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) { v.play().then(() => setPlaying(true)).catch(() => {}); }
    else          { v.pause(); setPlaying(false); }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) { videoRef.current.muted = !muted; setMuted(m => !m); }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{ background: `linear-gradient(135deg,hsl(${hue},25%,7%),hsl(${(hue+60)%360},18%,4%))` }}
    >
      {/* ── Video element ── */}
      {video?.videoUrl ? (
        <video
          ref={videoRef}
          src={video.videoUrl}
          loop muted={muted} playsInline
          onClick={togglePlay}
          onLoadedMetadata={handleLoadedMetadata}
          className="absolute inset-0 w-full h-full cursor-pointer"
          style={{ objectFit: 'cover', objectPosition: 'center', zIndex: 1 }}
        />
      ) : (
        <>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 10%,rgba(255,107,53,.18),transparent 55%)' }}/>
          <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 85%,rgba(255,45,120,.14),transparent 55%)' }}/>
        </>
      )}

      {/* ── Pause overlay ── */}
      {video?.videoUrl && !playing && (
        <div
          onClick={togglePlay}
          className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
          style={{ background: 'rgba(0,0,0,0.15)' }}
        >
          <div
            className="w-[60px] h-[60px] rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          >
            <VideoPlaySmIcon />
          </div>
        </div>
      )}

      {/* ── Mute button ── */}
      <button
        onClick={toggleMute}
        className="absolute top-3.5 right-3.5 w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer z-20 transition-all hover:scale-110"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', color: 'white', fontSize: 14 }}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {/* ── Overlays ── */}
      <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 10 }}>
        {!hideTopBar && (
          <div style={{ pointerEvents: 'auto' }}>
            <VideoCardTopBar activeTab="For You" />
          </div>
        )}
        <div style={{ pointerEvents: 'auto' }}>
          <VideoCardInfo video={video} />
        </div>
        {!hideActions && (
          <div style={{ pointerEvents: 'auto' }}>
            <VideoCardActions
              video={video}
              onComment={onComment}
              onLike={onLike}
              onShare={onShare}
              onBookmark={onBookmark}
            />
          </div>
        )}
      </div>

      {/* ── Progress bar ── */}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] z-20" style={{ background: 'rgba(255,255,255,0.1)' }}>
        <div style={{ height: '100%', width: '42%', background: 'rgba(255,255,255,0.65)' }} />
      </div>
    </div>
  );
}