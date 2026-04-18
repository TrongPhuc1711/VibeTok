import React, { useRef, useState, useEffect, useCallback } from 'react';
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
    onRatio,
    hideActions = false,
    hideTopBar = false,
}) {
    const videoRef = useRef(null);
    const progressBarRef = useRef(null);
    // Use ref to track play intent - avoids race conditions from async play()
    const intendedPlayRef = useRef(false);
    // Track if we're currently in a play() promise to avoid AbortError spam
    const playPromiseRef = useRef(null);

    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [dragging, setDragging] = useState(false);

    const [volume, setVolume] = useState(() => {
        try {
            const saved = localStorage.getItem('vibetok_volume');
            return saved !== null ? parseFloat(saved) : 0.5;
        } catch {
            return 0.5;
        }
    });
    const [muted, setMuted] = useState(false);

    const hue = (parseInt(video?.id?.slice(-3) ?? '0', 16) || 0) % 360;

    // ── FIX: Volume sync ONLY when active, prevents audio bleed from inactive cards ──
    useEffect(() => {
        const v = videoRef.current;
        if (!v || !isActive) return;
        v.volume = volume;
        v.muted = muted;
    }, [volume, muted, isActive]);

    // ── Auto play/pause based on isActive ──
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;

        if (isActive) {
            intendedPlayRef.current = true;
            v.volume = volume;
            v.muted = muted;

            // Cancel any in-flight play promise before starting new one
            if (playPromiseRef.current) {
                playPromiseRef.current = null;
            }

            const promise = v.play();
            playPromiseRef.current = promise;

            if (promise !== undefined) {
                promise
                    .then(() => {
                        if (intendedPlayRef.current) setPlaying(true);
                        playPromiseRef.current = null;
                    })
                    .catch((err) => {
                        // AbortError is expected when video is paused before play() resolves
                        if (err.name !== 'AbortError') {
                            console.warn('[VideoCard] play() failed:', err.name);
                        }
                        setPlaying(false);
                        playPromiseRef.current = null;
                    });
            }
        } else {
            intendedPlayRef.current = false;
            // Mute FIRST (instant audio cut), then pause
            v.muted = true;

            // Wait for any in-flight play promise before pausing
            const doPause = () => {
                v.pause();
                v.currentTime = 0;
                setPlaying(false);
                setProgress(0);
            };

            if (playPromiseRef.current) {
                playPromiseRef.current.then(doPause).catch(doPause);
            } else {
                doPause();
            }
        }
    }, [isActive]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Cleanup on unmount ──
    useEffect(() => {
        return () => {
            intendedPlayRef.current = false;
            const v = videoRef.current;
            if (v) {
                v.muted = true;
                v.pause();
                v.currentTime = 0;
                // Don't clear src - causes issues with React StrictMode double-mount
            }
        };
    }, []);

    // ── Progress tracking ──
    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;

        const onTimeUpdate = () => {
            if (!dragging && v.duration) {
                setProgress((v.currentTime / v.duration) * 100);
            }
        };
        const onLoadedMetadata = () => setDuration(v.duration || 0);
        const onEnded = () => {
            // Loop is handled by `loop` attribute, but update state
            setProgress(0);
        };

        v.addEventListener('timeupdate', onTimeUpdate);
        v.addEventListener('loadedmetadata', onLoadedMetadata);
        v.addEventListener('ended', onEnded);
        return () => {
            v.removeEventListener('timeupdate', onTimeUpdate);
            v.removeEventListener('loadedmetadata', onLoadedMetadata);
            v.removeEventListener('ended', onEnded);
        };
    }, [dragging]);

    // ── Aspect ratio callback ──
    const handleLoadedMetadata = () => {
        const v = videoRef.current;
        if (v?.videoWidth && v?.videoHeight && onRatio) {
            onRatio(v.videoWidth / v.videoHeight);
        }
        setDuration(v?.duration || 0);
    };

    // ── Toggle play ──
    const togglePlay = useCallback(() => {
        const v = videoRef.current;
        if (!v) return;

        if (v.paused) {
            intendedPlayRef.current = true;
            v.muted = muted;
            v.volume = volume;
            const p = v.play();
            if (p) {
                p.then(() => setPlaying(true)).catch(() => {});
            }
        } else {
            intendedPlayRef.current = false;
            v.muted = true; // instant audio cut
            v.pause();
            setPlaying(false);
        }
    }, [muted, volume]);

    // ── Seek ──
    const seekToRatio = useCallback((ratio) => {
        const v = videoRef.current;
        if (!v || !v.duration) return;
        const clamped = Math.max(0, Math.min(1, ratio));
        v.currentTime = clamped * v.duration;
        setProgress(clamped * 100);
    }, []);

    const getRatioFromClientX = (clientX) => {
        const bar = progressBarRef.current;
        if (!bar) return 0;
        const rect = bar.getBoundingClientRect();
        return (clientX - rect.left) / rect.width;
    };

    const handleProgressStart = (e) => {
        e.stopPropagation();
        setDragging(true);

        const getClientX = (ev) =>
            ev.touches && ev.touches.length > 0 ? ev.touches[0].clientX : ev.clientX;

        seekToRatio(getRatioFromClientX(getClientX(e)));

        const onMove = (ev) => seekToRatio(getRatioFromClientX(getClientX(ev)));
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

    // ── Volume ──
    const handleVolumeChange = (e) => {
        const newVol = parseFloat(e.target.value);
        setVolume(newVol);
        setMuted(newVol === 0);
        try { localStorage.setItem('vibetok_volume', String(newVol)); } catch {}
    };

    const toggleMute = (e) => {
        e.stopPropagation();
        const newMuted = !muted;
        setMuted(newMuted);
        if (!newMuted && volume === 0) {
            setVolume(0.5);
            try { localStorage.setItem('vibetok_volume', '0.5'); } catch {}
        }
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
            {/* Video element */}
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
                    style={{ objectFit: 'cover', objectPosition: 'center', zIndex: 1 }}
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
                    <div
                        className="w-[60px] h-[60px] rounded-full flex items-center justify-center"
                        style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(4px)' }}
                    >
                        <VideoPlaySmIcon />
                    </div>
                </div>
            )}

            {/* Volume control - only show when active */}
            {isActive && (
                <div className="absolute top-3.5 right-3.5 flex items-center gap-2 z-20 bg-black/40 backdrop-blur-md p-2 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.05"
                        value={muted ? 0 : volume}
                        onChange={handleVolumeChange}
                        onClick={(e) => e.stopPropagation()}
                        className="w-16 h-1 accent-white cursor-pointer"
                    />
                    <button
                        onClick={toggleMute}
                        className="text-white border-none bg-transparent cursor-pointer text-lg p-0 flex items-center justify-center"
                    >
                        {muted || volume === 0 ? '🔇' : volume < 0.5 ? '🔉' : '🔊'}
                    </button>
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
                    className="absolute bottom-5 left-1/2 -translate-x-1/2 bg-black/70 text-white text-[10px] font-body px-1.5 py-0.5 rounded opacity-0 group-hover/bar:opacity-100 transition-opacity pointer-events-none whitespace-nowrap"
                >
                    {fmtTime(currentSec)} / {fmtTime(duration)}
                </div>

                {/* Track */}
                <div
                    ref={progressBarRef}
                    className="absolute bottom-0 left-0 right-0"
                    style={{
                        height: dragging ? 6 : 3,
                        background: 'rgba(255,255,255,0.15)',
                        transition: 'height 0.15s ease',
                    }}
                >
                    <div
                        style={{
                            height: '100%',
                            width: `${progress}%`,
                            background: 'rgba(255,255,255,0.75)',
                            transition: dragging ? 'none' : 'width 0.1s linear',
                        }}
                    />
                    {/* Thumb */}
                    <div
                        style={{
                            position: 'absolute',
                            top: '50%',
                            left: `${progress}%`,
                            transform: 'translate(-50%, -50%)',
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            background: 'white',
                            boxShadow: '0 0 4px rgba(0,0,0,0.5)',
                            opacity: dragging ? 1 : 0,
                            transition: 'opacity 0.15s ease',
                            pointerEvents: 'none',
                        }}
                        className="group-hover/bar:!opacity-100"
                    />
                </div>
            </div>
        </div>
    );
}