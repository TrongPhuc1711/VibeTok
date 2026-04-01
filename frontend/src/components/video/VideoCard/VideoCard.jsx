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
  
  // 1. Quản lý trạng thái Volume
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('vibetok_volume');
    return saved !== null ? parseFloat(saved) : 0.5;
  });
  const [muted, setMuted] = useState(false);

  // Giữ nguyên logic hue của bạn
  const hue = (parseInt(video?.id?.slice(-3) ?? '0', 16) || 0) % 360;

  // 2. Đồng bộ âm lượng với thẻ video thực tế
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.muted = muted;
    }
  }, [volume, muted]);

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

  // 3. Hàm xử lý khi kéo thanh volume
  const handleVolumeChange = (e) => {
    const newVol = parseFloat(e.target.value);
    setVolume(newVol);
    setMuted(newVol === 0);
    localStorage.setItem('vibetok_volume', newVol);
  };

  // 4. Hàm xử lý khi bấm nút Loa
  const toggleMute = (e) => {
    e.stopPropagation();
    const newMuted = !muted;
    setMuted(newMuted);
    // Nếu đang tắt tiếng mà bật lại, nếu volume đang là 0 thì cho lên 0.5
    if (!newMuted && volume === 0) {
        setVolume(0.5);
        localStorage.setItem('vibetok_volume', 0.5);
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden group" // Thêm class 'group' để hiện volume khi hover
      style={{ background: `linear-gradient(135deg,hsl(${hue},25%,7%),hsl(${(hue+60)%360},18%,4%))` }}
    >
      {/* ── Video element ── */}
      {video?.videoUrl ? (
        <video
          ref={videoRef}
          src={video.videoUrl}
          loop playsInline
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

      {/* ── Cụm điều khiển âm lượng mới (Slider + Button) ── */}
      <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-20 bg-black/40 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <input
          type="range"
          min="0" max="1" step="0.05"
          value={muted ? 0 : volume}
          onChange={handleVolumeChange}
          className="w-16 h-1 accent-white cursor-pointer"
        />
        <button 
          onClick={toggleMute} 
          className="text-white border-none bg-transparent cursor-pointer text-lg p-0 flex items-center justify-center"
        >
          {muted || volume === 0 ? '🔇' : '🔊'}
        </button>
      </div>

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