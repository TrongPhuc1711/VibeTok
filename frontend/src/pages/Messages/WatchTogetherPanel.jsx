import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    WatchTogetherIcon, PlayIcon, PauseIcon,
    LinkIcon, CloseIcon, ExpandIcon, ShrinkIcon, DragHandleIcon,
} from '../../icons/MessageIcons';

function detectPlatform(url) {
    if (!url) return 'direct';
    try {
        const u = new URL(url);
        const host = u.hostname.replace('www.', '').replace('m.', '');
        if (host.includes('youtube.com') || host.includes('youtu.be')) return 'youtube';
        if (host.includes('tiktok.com')) return 'tiktok';
        if (host.includes('facebook.com') || host.includes('fb.watch')) return 'facebook';
        if (host.includes('vimeo.com')) return 'vimeo';
        if (host.includes('dailymotion.com') || host.includes('dai.ly')) return 'dailymotion';
    } catch { /* */ }
    return 'direct';
}

function getYouTubeId(url) {
    if (!url) return null;
    try {
        const u = new URL(url);
        const host = u.hostname.replace('www.', '').replace('m.', '');
        if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0];
        if (u.searchParams.has('v')) return u.searchParams.get('v');
        if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2];
        if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
        if (u.pathname.startsWith('/live/')) return u.pathname.split('/')[2];
    } catch { /* */ }
    return null;
}

function getEmbedUrl(url, platform) {
    switch (platform) {
        case 'youtube': {
            const id = getYouTubeId(url);
            if (!id) return null;
            return `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1&origin=${window.location.origin}`;
        }
        case 'tiktok': {
            try {
                const u = new URL(url);
                const parts = u.pathname.split('/');
                const videoIdx = parts.indexOf('video');
                if (videoIdx !== -1 && parts[videoIdx + 1]) {
                    return `https://www.tiktok.com/embed/v2/${parts[videoIdx + 1]}`;
                }
            } catch { /* */ }
            return null;
        }
        case 'facebook':
            return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`;
        case 'vimeo': {
            try {
                const u = new URL(url);
                const id = u.pathname.split('/').filter(Boolean)[0];
                if (id && /^\d+$/.test(id)) return `https://player.vimeo.com/video/${id}?autoplay=1`;
            } catch { /* */ }
            return null;
        }
        case 'dailymotion': {
            try {
                const u = new URL(url);
                const host = u.hostname.replace('www.', '');
                let id = null;
                if (host === 'dai.ly') {
                    id = u.pathname.slice(1);
                } else {
                    const parts = u.pathname.split('/');
                    const videoIdx = parts.indexOf('video');
                    if (videoIdx !== -1 && parts[videoIdx + 1]) id = parts[videoIdx + 1];
                }
                if (id) return `https://www.dailymotion.com/embed/video/${id}?autoplay=1`;
            } catch { /* */ }
            return null;
        }
        default:
            return null;
    }
}

function getPlatformLabel(platform) {
    const labels = {
        youtube: '▶ YouTube',
        tiktok: '♪ TikTok',
        facebook: 'f Facebook',
        vimeo: '▷ Vimeo',
        dailymotion: '▶ Dailymotion',
        direct: '🎬 Video',
    };
    return labels[platform] || 'Video';
}

/* ═══════════════════════════════════════════
   YouTube IFrame API loader
   ═══════════════════════════════════════════ */

let ytApiLoaded = false;
let ytApiLoading = false;
const ytApiCallbacks = [];

function loadYouTubeApi() {
    return new Promise((resolve) => {
        if (ytApiLoaded && window.YT?.Player) { resolve(); return; }
        ytApiCallbacks.push(resolve);
        if (ytApiLoading) return;
        ytApiLoading = true;
        const existingCb = window.onYouTubeIframeAPIReady;
        window.onYouTubeIframeAPIReady = () => {
            ytApiLoaded = true;
            ytApiLoading = false;
            existingCb?.();
            ytApiCallbacks.forEach(cb => cb());
            ytApiCallbacks.length = 0;
        };
        if (!document.querySelector('script[src*="youtube.com/iframe_api"]')) {
            const s = document.createElement('script');
            s.src = 'https://www.youtube.com/iframe_api';
            document.head.appendChild(s);
        }
    });
}

/* ═══════════════════════════════════════════
   Draggable hook
   ═══════════════════════════════════════════ */

function useDraggable() {
    const [pos, setPos] = useState({ x: 0, y: 0 });
    const dragging = useRef(false);
    const offset = useRef({ x: 0, y: 0 });

    const onMouseDown = useCallback((e) => {
        // Only left mouse button
        if (e.button !== 0) return;
        dragging.current = true;
        offset.current = { x: e.clientX - pos.x, y: e.clientY - pos.y };
        e.preventDefault();
    }, [pos]);

    useEffect(() => {
        const onMouseMove = (e) => {
            if (!dragging.current) return;
            setPos({
                x: e.clientX - offset.current.x,
                y: e.clientY - offset.current.y,
            });
        };
        const onMouseUp = () => { dragging.current = false; };
        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
        return () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };
    }, []);

    return { pos, onMouseDown, resetPos: () => setPos({ x: 0, y: 0 }) };
}


/* ═══════════════════════════════════════════
   WatchTogetherPanel
   ═══════════════════════════════════════════ */

export default function WatchTogetherPanel({
    watchTogether,        // { videoUrl, isPlaying, currentTime }
    onStartWatch,         // (url) => void
    onSyncWatch,          // (action, currentTime) => void
    onEndWatch,           // () => void
    watchVideoRef,        // callback ref for <video>
    localVideoRef,        // ref for local webcam <video>
    remoteVideoRef,       // ref for remote webcam <video>
}) {
    const [urlInput, setUrlInput] = useState('');
    const videoRef = useRef(null);
    const isSyncingRef = useRef(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const { pos, onMouseDown, resetPos } = useDraggable();

    // YouTube player ref
    const ytPlayerRef = useRef(null);
    const ytContainerRef = useRef(null);
    const ytSyncingRef = useRef(false);

    // Detect platform
    const platform = detectPlatform(watchTogether?.videoUrl);
    const isYouTube = platform === 'youtube';
    const isEmbed = platform !== 'direct';
    const embedUrl = isEmbed ? getEmbedUrl(watchTogether?.videoUrl, platform) : null;
    const useIframe = isEmbed && embedUrl && !isYouTube; // non-YT iframes
    const useYTPlayer = isYouTube && embedUrl;

    /* ── YouTube Player setup ── */
    useEffect(() => {
        if (!useYTPlayer || !watchTogether?.videoUrl) return;
        let cancelled = false;

        const initPlayer = async () => {
            await loadYouTubeApi();
            if (cancelled || !ytContainerRef.current) return;

            // Destroy previous player if exists
            if (ytPlayerRef.current) {
                try { ytPlayerRef.current.destroy(); } catch { /* */ }
                ytPlayerRef.current = null;
            }

            const videoId = getYouTubeId(watchTogether.videoUrl);
            if (!videoId) return;

            ytPlayerRef.current = new window.YT.Player(ytContainerRef.current, {
                videoId,
                playerVars: {
                    autoplay: 1,
                    rel: 0,
                    modestbranding: 1,
                    enablejsapi: 1,
                    origin: window.location.origin,
                    playsinline: 1,
                },
                events: {
                    onStateChange: (event) => {
                        if (ytSyncingRef.current) return;
                        const state = event.data;
                        const time = ytPlayerRef.current?.getCurrentTime?.() || 0;
                        // YT.PlayerState: PLAYING=1, PAUSED=2, BUFFERING=3
                        if (state === window.YT.PlayerState.PLAYING) {
                            onSyncWatch('play', time);
                        } else if (state === window.YT.PlayerState.PAUSED) {
                            onSyncWatch('pause', time);
                        }
                    },
                    onReady: () => {
                        // Apply initial state
                        if (watchTogether?.isPlaying) {
                            ytPlayerRef.current?.playVideo?.();
                        }
                        if (watchTogether?.currentTime > 0) {
                            ytPlayerRef.current?.seekTo?.(watchTogether.currentTime, true);
                        }
                    },
                },
            });
        };

        initPlayer();
        return () => {
            cancelled = true;
            // Destroy player when switching views or unmounting
            if (ytPlayerRef.current) {
                try { ytPlayerRef.current.destroy(); } catch { /* */ }
                ytPlayerRef.current = null;
            }
        };
    }, [useYTPlayer, watchTogether?.videoUrl, isExpanded]); // Reinit on expand/collapse too

    /* ── YouTube sync from remote ── */
    useEffect(() => {
        if (!useYTPlayer || !ytPlayerRef.current) return;
        const player = ytPlayerRef.current;
        if (!player.getPlayerState) return; // player not ready

        ytSyncingRef.current = true;

        try {
            const playerTime = player.getCurrentTime?.() || 0;
            const targetTime = watchTogether?.currentTime || 0;

            // Seek if difference > 2s
            if (Math.abs(playerTime - targetTime) > 2) {
                player.seekTo?.(targetTime, true);
            }

            const state = player.getPlayerState?.();
            if (watchTogether?.isPlaying && state !== window.YT?.PlayerState?.PLAYING) {
                player.playVideo?.();
            } else if (!watchTogether?.isPlaying && state === window.YT?.PlayerState?.PLAYING) {
                player.pauseVideo?.();
            }
        } catch { /* player may not be ready */ }

        setTimeout(() => { ytSyncingRef.current = false; }, 500);
    }, [watchTogether?.isPlaying, watchTogether?.currentTime, useYTPlayer]);

    /* ── Cleanup YT player on unmount or URL change ── */
    useEffect(() => {
        return () => {
            if (ytPlayerRef.current) {
                try { ytPlayerRef.current.destroy(); } catch { /* */ }
                ytPlayerRef.current = null;
            }
        };
    }, []);

    /* ── Direct <video> sync ── */
    useEffect(() => {
        if (useIframe || useYTPlayer) return;
        const video = videoRef.current;
        if (!video || !watchTogether) return;

        isSyncingRef.current = true;

        if (Math.abs(video.currentTime - watchTogether.currentTime) > 2) {
            video.currentTime = watchTogether.currentTime;
        }

        if (watchTogether.isPlaying && video.paused) {
            video.play().catch(() => {});
        } else if (!watchTogether.isPlaying && !video.paused) {
            video.pause();
        }

        setTimeout(() => { isSyncingRef.current = false; }, 300);
    }, [watchTogether?.isPlaying, watchTogether?.currentTime, useIframe, useYTPlayer]);

    /* ── Direct video source ── */
    useEffect(() => {
        if (useIframe || useYTPlayer) return;
        const video = videoRef.current;
        if (!video || !watchTogether?.videoUrl) return;
        if (video.src !== watchTogether.videoUrl) {
            video.src = watchTogether.videoUrl;
            video.load();
        }
    }, [watchTogether?.videoUrl, useIframe, useYTPlayer]);

    const handleSubmitUrl = (e) => {
        e.preventDefault();
        let url = urlInput.trim();
        if (!url) return;
        onStartWatch(url);
    };

    const handlePlay = () => {
        if (isSyncingRef.current) return;
        onSyncWatch('play', videoRef.current?.currentTime || 0);
    };

    const handlePause = () => {
        if (isSyncingRef.current) return;
        onSyncWatch('pause', videoRef.current?.currentTime || 0);
    };

    const handleSeek = () => {
        if (isSyncingRef.current) return;
        onSyncWatch('seek', videoRef.current?.currentTime || 0);
    };

    const setRef = (node) => {
        videoRef.current = node;
        watchVideoRef?.(node);
    };

    const toggleExpand = () => {
        setIsExpanded(prev => !prev);
        resetPos();
    };

    
    if (!watchTogether) {
        return (
            <div className="w-full max-w-md animate-fade-in">
                <div className="bg-black/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                    <div className="flex items-center gap-2 px-4 pt-3.5 pb-1.5">
                        <WatchTogetherIcon size={18} color="#ff2d78" />
                        <span className="text-white text-sm font-semibold font-body">Xem video cùng nhau</span>
                    </div>
                    <form onSubmit={handleSubmitUrl} className="flex gap-2 px-4 pb-4">
                        <div className="flex-1 flex items-center gap-2 bg-white/[.08] rounded-xl px-3 py-2 border border-white/[.06] focus-within:border-[#ff2d78]/30 transition-colors">
                            <LinkIcon size={14} color="#666" />
                            <input
                                type="url"
                                value={urlInput}
                                onChange={e => setUrlInput(e.target.value)}
                                placeholder="Dán link video (MP4, YouTube…)"
                                className="flex-1 bg-transparent text-white text-sm font-body outline-none placeholder:text-[#555] border-none"
                            />
                        </div>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-brand-gradient text-white text-sm font-semibold font-body rounded-xl border-none cursor-pointer hover:opacity-85 transition-opacity"
                        >
                            Bắt đầu
                        </button>
                    </form>
                </div>
            </div>
        );
    }

    
    if (isExpanded) {
        return (
            <div className="fixed inset-0 z-[200] bg-black flex flex-col animate-fade-in">
                {/* Header bar */}
                <div className="flex items-center justify-between px-4 py-2.5 bg-black/90 border-b border-white/[.06] shrink-0 z-10">
                    <div className="flex items-center gap-2">
                        <WatchTogetherIcon size={14} color="#ff2d78" />
                        <span className="text-white/60 text-xs font-body">Đang xem cùng nhau</span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    </div>
                    <div className="flex items-center gap-2">
                        {useYTPlayer && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-white/50 shrink-0">
                                {getPlatformLabel(platform)}
                            </span>
                        )}
                        <span className="text-[10px] text-[#ff2d78] font-mono tracking-wide shrink-0">LIVE</span>
                        <button
                            onClick={toggleExpand}
                            className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full border-none cursor-pointer transition-colors"
                            title="Thu nhỏ"
                        >
                            <ShrinkIcon size={12} color="#fff" />
                        </button>
                        <button
                            onClick={onEndWatch}
                            className="w-7 h-7 flex items-center justify-center bg-white/10 hover:bg-red-500/30 rounded-full border-none cursor-pointer transition-colors"
                            title="Kết thúc"
                        >
                            <CloseIcon size={10} color="#fff" />
                        </button>
                    </div>
                </div>

                {/* Video area - full screen */}
                <div className="flex-1 relative bg-black flex items-center justify-center overflow-hidden">
                    {useYTPlayer ? (
                        <div className="w-full h-full">
                            <div ref={ytContainerRef} className="w-full h-full" />
                        </div>
                    ) : useIframe ? (
                        <iframe
                            src={embedUrl}
                            className="w-full h-full border-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Watch Together"
                        />
                    ) : (
                        <>
                            <video
                                ref={setRef}
                                className="w-full h-full object-contain"
                                onPlay={handlePlay}
                                onPause={handlePause}
                                onSeeked={handleSeek}
                                playsInline
                                controls
                            />
                        </>
                    )}

                    {/* ── Split webcam PiP (top-right) ── */}
                    <div
                        className="absolute top-3 right-3 z-30 flex rounded-xl overflow-hidden border border-white/15 shadow-[0_8px_32px_rgba(0,0,0,.7)] backdrop-blur-sm"
                        style={{ width: 240, height: 90 }}
                    >
                        {/* Remote video (left half) */}
                        <div className="relative w-1/2 h-full bg-[#111] overflow-hidden">
                            <video
                                ref={pipRemoteRef}
                                autoPlay playsInline
                                className="w-full h-full object-cover"
                            />
                            <div className="absolute bottom-0.5 left-1 text-[8px] text-white/50 font-body bg-black/40 px-1 rounded">Bạn bè</div>
                        </div>
                        {/* Divider */}
                        <div className="w-[1px] bg-white/20 shrink-0" />
                        {/* Local video (right half) */}
                        <div className="relative w-1/2 h-full bg-[#111] overflow-hidden">
                            <video
                                ref={pipLocalRef}
                                autoPlay playsInline muted
                                className="w-full h-full object-cover"
                                style={{ transform: 'scaleX(-1)' }}
                            />
                            <div className="absolute bottom-0.5 left-1 text-[8px] text-white/50 font-body bg-black/40 px-1 rounded">Bạn</div>
                        </div>
                    </div>

                    {/* Play/Pause overlay for direct video */}
                    {!useIframe && !useYTPlayer && (
                        <button
                            onClick={() => {
                                if (watchTogether.isPlaying) handlePause();
                                else handlePlay();
                            }}
                            className="absolute inset-0 flex items-center justify-center bg-transparent border-none cursor-pointer group"
                            style={{ zIndex: 5 }}
                        >
                            <div className="w-16 h-16 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                {watchTogether.isPlaying
                                    ? <PauseIcon size={28} color="#fff" />
                                    : <PlayIcon size={28} color="#fff" />
                                }
                            </div>
                        </button>
                    )}
                </div>
            </div>
        );
    }

    /* 
       Normal (draggable popup)
        */
    return (
        <div
            className="w-full max-w-lg animate-fade-in"
            style={{
                transform: `translate(${pos.x}px, ${pos.y}px)`,
                transition: 'none',
                userSelect: 'none',
            }}
        >
            <div className="bg-black/85 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Header — draggable */}
                <div
                    className="flex items-center justify-between px-3 py-2 border-b border-white/[.06] cursor-grab active:cursor-grabbing select-none"
                    onMouseDown={onMouseDown}
                >
                    <div className="flex items-center gap-1.5">
                        <DragHandleIcon size={12} color="#555" />
                        <WatchTogetherIcon size={14} color="#ff2d78" />
                        <span className="text-white/60 text-xs font-body">Đang xem cùng nhau</span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            onClick={toggleExpand}
                            className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full border-none cursor-pointer transition-colors"
                            title="Mở rộng"
                        >
                            <ExpandIcon size={10} color="#fff" />
                        </button>
                        <button
                            onClick={onEndWatch}
                            className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-red-500/30 rounded-full border-none cursor-pointer transition-colors"
                        >
                            <CloseIcon size={10} color="#fff" />
                        </button>
                    </div>
                </div>

                {/* Video / Iframe / YouTube Player */}
                <div className="relative aspect-video bg-black">
                    {useYTPlayer ? (
                        <div className="w-full h-full">
                            <div ref={ytContainerRef} className="w-full h-full" />
                        </div>
                    ) : useIframe ? (
                        <iframe
                            src={embedUrl}
                            className="w-full h-full border-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Watch Together"
                        />
                    ) : (
                        <>
                            <video
                                ref={setRef}
                                className="w-full h-full object-contain"
                                onPlay={handlePlay}
                                onPause={handlePause}
                                onSeeked={handleSeek}
                                playsInline
                                controls={false}
                            />
                            <button
                                onClick={() => {
                                    if (watchTogether.isPlaying) handlePause();
                                    else handlePlay();
                                }}
                                className="absolute inset-0 flex items-center justify-center bg-transparent border-none cursor-pointer group"
                            >
                                <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur-sm flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    {watchTogether.isPlaying
                                        ? <PauseIcon size={22} color="#fff" />
                                        : <PlayIcon size={22} color="#fff" />
                                    }
                                </div>
                            </button>
                        </>
                    )}
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 px-3 py-2">
                    {!useIframe && !useYTPlayer && (
                        <button
                            onClick={() => {
                                if (watchTogether.isPlaying) handlePause();
                                else handlePlay();
                            }}
                            className="w-8 h-8 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-full border-none cursor-pointer transition-colors"
                        >
                            {watchTogether.isPlaying
                                ? <PauseIcon size={14} color="#fff" />
                                : <PlayIcon size={14} color="#fff" />
                            }
                        </button>
                    )}
                    <div className="flex-1 flex items-center gap-2 text-[10px] text-[#888] font-body truncate">
                        {(useIframe || useYTPlayer) && (
                            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded bg-white/10 text-white/50 shrink-0">
                                {getPlatformLabel(platform)}
                            </span>
                        )}
                        <span className="truncate">
                            {watchTogether.videoUrl?.split('/').pop()?.substring(0, 40) || 'Video'}
                        </span>
                    </div>
                    <span className="text-[10px] text-[#ff2d78] font-mono tracking-wide shrink-0">LIVE</span>
                </div>
            </div>
        </div>
    );
}
