import React, { useRef, useState, useEffect, useCallback } from 'react';
import VideoCardTopBar from './VideoCardTopBar';
import VideoCardInfo from './VideoCardInfo';
import VideoCardActions from './VideoCardActions';
import VolumeControl, { useVideoVolume } from '../../video/VolumnControl/index';

export default function VideoCard({
    video,
    isActive,
    onComment,
    onLike,
    onShare,
    onBookmark,
    onRatio,
    hideActions = false,
    hideTopBar = false,
}) {
    const videoRef = useRef(null);
    const intendedPlayRef = useRef(false);
    const playPromiseRef = useRef(null);

    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [dragging, setDragging] = useState(false);
    const [showVolume, setShowVolume] = useState(false);
    const progressBarRef = useRef(null);

    const { volume, muted, setVolume, toggleMute, applyToVideo } = useVideoVolume();

    const hue = (parseInt(video?.id?.slice(-3) ?? '0', 16) || 0) % 360;

    // Sync volume to video element
    useEffect(() => {
        if (isActive) applyToVideo(videoRef.current);
    }, [volume, muted, isActive, applyToVideo]);

    // Auto play/pause based on isActive
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;

        if (isActive) {
            intendedPlayRef.current = true;
            applyToVideo(v);
            const p = v.play();
            playPromiseRef.current = p;
            if (p) {
                p.then(() => { if (intendedPlayRef.current) setPlaying(true); playPromiseRef.current = null; })
                    .catch((err) => { if (err.name !== 'AbortError') console.warn('[VideoCard] play():', err.name); setPlaying(false); playPromiseRef.current = null; });
            }
        } else {
            intendedPlayRef.current = false;
            v.muted = true;
            const doPause = () => { v.pause(); v.currentTime = 0; setPlaying(false); setProgress(0); };
            if (playPromiseRef.current) playPromiseRef.current.then(doPause).catch(doPause);
            else doPause();
        }
    }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

    // Cleanup on unmount
    useEffect(() => {
        return () => {
            intendedPlayRef.current = false;
            const v = videoRef.current;
            if (v) { v.muted = true; v.pause(); v.currentTime = 0; }
        };
    }, []);

    // Progress tracking
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        const onTime = () => { if (!dragging && v.duration) setProgress((v.currentTime / v.duration) * 100); };
        const onMeta = () => setDuration(v.duration || 0);
        v.addEventListener('timeupdate', onTime);
        v.addEventListener('loadedmetadata', onMeta);
        return () => { v.removeEventListener('timeupdate', onTime); v.removeEventListener('loadedmetadata', onMeta); };
    }, [dragging]);

    const handleLoadedMetadata = () => {
        const v = videoRef.current;
        if (v?.videoWidth && v?.videoHeight && onRatio) onRatio(v.videoWidth / v.videoHeight);
        setDuration(v?.duration || 0);
    };

    const togglePlay = useCallback(() => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) {
            intendedPlayRef.current = true;
            applyToVideo(v);
            v.play().then(() => setPlaying(true)).catch(() => { });
        } else {
            intendedPlayRef.current = false;
            v.muted = true;
            v.pause();
            setPlaying(false);
        }
    }, [applyToVideo]);

    const seekToRatio = useCallback((ratio) => {
        const v = videoRef.current;
        if (!v || !v.duration) return;
        const c = Math.max(0, Math.min(1, ratio));
        v.currentTime = c * v.duration;
        setProgress(c * 100);
    }, []);

    const handleProgressStart = (e) => {
        e.stopPropagation();
        setDragging(true);
        const getX = (ev) => ev.touches?.[0]?.clientX ?? ev.clientX;
        const getR = (ev) => {
            const bar = progressBarRef.current;
            if (!bar) return 0;
            const rect = bar.getBoundingClientRect();
            return (getX(ev) - rect.left) / rect.width;
        };
        seekToRatio(getR(e));
        const onMove = (ev) => seekToRatio(getR(ev));
        const onEnd = () => {
            setDragging(false);
            window.removeEventListener('mousemove', onMove);
            window.removeEventListener('mouseup', onEnd);
            window.removeEventListener('touchmove', onMove);
            window.removeEventListener('touchend', onEnd);
        };
        window.addEventListener('mousemove', onMove);
        window.addEventListener('mouseup', onEnd);
        window.addEventListener('touchmove', onMove, { passive: false });
        window.addEventListener('touchend', onEnd);
    };

    const fmtTime = (sec) => {
        if (!sec || isNaN(sec)) return '0:00';
        return `${Math.floor(sec / 60)}:${String(Math.floor(sec % 60)).padStart(2, '0')}`;
    };

    const currentSec = duration ? (progress / 100) * duration : 0;

    return (
        <div
            className="relative w-full h-full overflow-hidden group"
            style={{ background: `linear-gradient(135deg,hsl(${hue},25%,7%),hsl(${(hue + 60) % 360},18%,4%))` }}
        >
            {/* Video */}
            {video?.videoUrl ? (
                <video
                    ref={videoRef}
                    src={video.videoUrl}
                    loop
                    playsInline
                    preload="metadata"
                    onClick={togglePlay}
                    onLoadedMetadata={handleLoadedMetadata}
                    className="absolute inset-0 w-full h-full cursor-pointer"
                    style={{ objectFit: 'cover', zIndex: 1 }}
                />
            ) : (
                <>
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 20% 10%,rgba(255,107,53,.18),transparent 55%)' }} />
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(ellipse at 80% 85%,rgba(255,45,120,.14),transparent 55%)' }} />
                </>
            )}

            {/* Pause overlay */}
            {video?.videoUrl && !playing && isActive && (
                <div
                    onClick={togglePlay}
                    className="absolute inset-0 flex items-center justify-center cursor-pointer z-10"
                    style={{ background: 'rgba(0,0,0,0.15)' }}
                >
                    <div className="w-[60px] h-[60px] rounded-full flex items-center justify-center" style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="rgba(255,255,255,.9)">
                            <path d="M4 3l13 7-13 7V3z" />
                        </svg>
                    </div>
                </div>
            )}

            {/* Volume control — TikTok style, top right, hover */}
            {isActive && (
                <div
                    className="absolute top-3.5 right-3.5 z-20 opacity-0 group-hover:opacity-100 transition-opacity duration-300"
                    onMouseEnter={() => setShowVolume(true)}
                    onMouseLeave={() => setShowVolume(false)}
                >
                    <VolumeControl
                        volume={volume}
                        muted={muted}
                        onVolumeChange={setVolume}
                        onToggleMute={toggleMute}
                    />
                </div>
            )}

            {/* Overlay info */}
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

            {/* Progress bar */}
            <div
                className="absolute bottom-0 left-0 right-0 z-20 group/bar"
                style={{ height: 20, cursor: 'pointer' }}
                onMouseDown={handleProgressStart}
                onTouchStart={handleProgressStart}
            >
                {/* Time tooltip */}
                <div
                    className="absolute bottom-5 pointer-events-none whitespace-nowrap text-white text-[10px] font-body px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity"
                    style={{ left: `${progress}%`, transform: 'translateX(-50%)', background: 'rgba(0,0,0,0.7)' }}
                >
                    {fmtTime(currentSec)} / {fmtTime(duration)}
                </div>

                {/* Track */}
                <div
                    ref={progressBarRef}
                    className="absolute bottom-0 left-0 right-0"
                    style={{ height: dragging ? 6 : 3, background: 'rgba(255,255,255,0.15)', transition: 'height 0.15s ease' }}
                >
                    <div style={{ height: '100%', width: `${progress}%`, background: 'rgba(255,255,255,0.75)', transition: dragging ? 'none' : 'width 0.1s linear' }} />
                    <div
                        className="group-hover/bar:!opacity-100"
                        style={{ position: 'absolute', top: '50%', left: `${progress}%`, transform: 'translate(-50%,-50%)', width: 12, height: 12, borderRadius: '50%', background: 'white', boxShadow: '0 0 4px rgba(0,0,0,0.5)', opacity: dragging ? 1 : 0, transition: 'opacity 0.15s ease', pointerEvents: 'none' }}
                    />
                </div>
            </div>
        </div>
    );
}