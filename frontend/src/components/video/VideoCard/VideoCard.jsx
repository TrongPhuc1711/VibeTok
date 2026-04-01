import React, { useRef, useState, useEffect } from 'react';
import VideoCardTopBar from './VideoCardTopBar';
import VideoCardInfo from './VideoCardInfo';
import VideoCardActions from './VideoCardActions';
import { VideoPlaySmIcon } from '../../../icons/CommonIcons';

export default function VideoCard({
  video,
  isActive,
  onComment,
  onLike,
  onShare,
  onBookmark,
  hideActions = false,
  hideTopBar = false,
}) {
  const videoRef = useRef(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(true);
  const [videoLoaded, setVideoLoaded] = useState(false);

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
      v.play().then(() => setPlaying(true)).catch(() => {});
    } else {
      v.pause();
      setPlaying(false);
    }
  };

  const toggleMute = (e) => {
    e.stopPropagation();
    if (videoRef.current) {
      videoRef.current.muted = !muted;
      setMuted(m => !m);
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden"
      style={{
        background: `linear-gradient(135deg,hsl(${hue},30%,8%),hsl(${(hue + 60) % 360},20%,5%))`,
      }}
    >
      {/* ── Video element ── */}
      {video?.videoUrl ? (
        <video
          ref={videoRef}
          src={video.videoUrl}
          loop
          muted={muted}
          playsInline
          onClick={togglePlay}
          onLoadedData={() => setVideoLoaded(true)}
          className="absolute inset-0 w-full h-full cursor-pointer"
          /* object-contain: hiển thị đúng tỉ lệ, có letterbox nếu cần */
          style={{
            objectFit: 'contain',
            objectPosition: 'center',
            zIndex: 1,
          }}
        />
      ) : (
        /* Placeholder gradient nếu không có video */
        <>
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 20% -10%,rgba(255,107,53,.18),transparent 55%)' }}
          />
          <div
            className="absolute inset-0"
            style={{ background: 'radial-gradient(ellipse at 80% 90%,rgba(255,45,120,.14),transparent 55%)' }}
          />
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
            className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
          >
            <VideoPlaySmIcon />
          </div>
        </div>
      )}

      {/* ── Mute button ── */}
      <button
        onClick={toggleMute}
        className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer text-white text-sm z-20 transition-all hover:scale-105"
        style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
        title={muted ? 'Bật âm thanh' : 'Tắt âm thanh'}
      >
        {muted ? '🔇' : '🔊'}
      </button>

      {/* ── Overlay components ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ zIndex: 10 }}
      >
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
      <div
        className="absolute bottom-0 left-0 right-0 h-[2px] z-20"
        style={{ background: 'rgba(255,255,255,0.12)' }}
      >
        <div
          className="h-full"
          style={{
            width: '42%',
            background: 'rgba(255,255,255,0.7)',
            transition: 'width 0.3s linear',
          }}
        />
      </div>
    </div>
  );
}