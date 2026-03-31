import React, { useRef, useState, useEffect } from 'react';
import VideoCardTopBar from './VideoCardTopBar';
import VideoCardInfo from './VideoCardInfo';
import VideoCardActions from './VideoCardActions';
import { VideoPlaySmIcon } from '../../../icons/CommonIcons';

export default function VideoCard({ video, isActive, onComment, onLike, onShare, onBookmark, hideActions = false }) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);

  const hue = (parseInt(video?.id?.slice(-3) ?? '0', 16) || 0) % 360;

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (isActive) {
      v.play().then(() => setPlaying(true)).catch(() => setPlaying(false));
    } else {
      v.pause();
      v.currentTime = 0;
      setPlaying(false);
    }
  }, [isActive]);

  const togglePlay = () => {
    const v = videoRef.current;
    if (!v) return;
    if (v.paused) {
      v.play().then(() => setPlaying(true)).catch(() => { });
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => {
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(m => !m);
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden flex items-center justify-center bg-base"
      style={{
        background: `linear-gradient(135deg,hsl(${hue},30%,8%),hsl(${(hue + 60) % 360},20%,5%))`,
      }}
    >
      {/* Video thật */}
      {video?.videoUrl ? (
        <video
          ref={videoRef}
          src={video.videoUrl}
          loop
          muted={muted}
          playsInline
          onClick={togglePlay}
          className="absolute inset-0 w-full h-full object-cover cursor-pointer"
          style={{ zIndex: 1 }}
        />
      ) : (
        <>
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 20% -10%,rgba(255,107,53,.15),transparent 50%)' }}
          />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: 'radial-gradient(ellipse at 80% 90%,rgba(255,45,120,.12),transparent 50%)' }}
          />
        </>
      )}

      {/* Pause overlay */}
      {!playing && (
        <div
          onClick={togglePlay}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60px] h-[60px] rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center cursor-pointer"
          style={{ zIndex: 15 }}
        >
          <VideoPlaySmIcon />
        </div>
      )}

      {/* Nút mute/unmute */}
      <button
        onClick={toggleMute}
        className="absolute top-16 right-4 w-8 h-8 rounded-full bg-black/40 backdrop-blur-sm flex items-center justify-center border-none cursor-pointer text-white text-sm"
        style={{ zIndex: 20 }}
        title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {/* Sub-components */}
      <div style={{ position: 'relative', zIndex: 10, width: '100%', height: '100%', pointerEvents: 'none' }}>
        <div style={{ pointerEvents: 'auto' }}>
          <VideoCardTopBar activeTab="For You" />
        </div>
        <div style={{ pointerEvents: 'auto' }}>
          <VideoCardInfo video={video} />
        </div>

        {/* Actions chỉ render bên trong khi hideActions = false */}
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

      {/* Progress bar */}
      <div className="absolute bottom-0 left-0 right-0 h-[2.5px] bg-white/15" style={{ zIndex: 20 }}>
        <div className="h-full w-[42%] bg-white/70" />
      </div>
    </div>
  );
}