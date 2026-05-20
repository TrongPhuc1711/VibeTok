import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
    WatchTogetherIcon, PlayIcon, PauseIcon,
    LinkIcon, CloseIcon,
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
    } catch {
        // Not a valid URL
    }
    return 'direct';
}

/**
 * Extracts YouTube video ID from various URL formats.
 */
function getYouTubeId(url) {
    if (!url) return null;
    try {
        const u = new URL(url);
        const host = u.hostname.replace('www.', '').replace('m.', '');
        // youtu.be/VIDEO_ID
        if (host === 'youtu.be') return u.pathname.slice(1).split('/')[0];
        // youtube.com/watch?v=VIDEO_ID
        if (u.searchParams.has('v')) return u.searchParams.get('v');
        // youtube.com/embed/VIDEO_ID
        if (u.pathname.startsWith('/embed/')) return u.pathname.split('/')[2];
        // youtube.com/shorts/VIDEO_ID
        if (u.pathname.startsWith('/shorts/')) return u.pathname.split('/')[2];
        // youtube.com/live/VIDEO_ID
        if (u.pathname.startsWith('/live/')) return u.pathname.split('/')[2];
    } catch { /* ignore */ }
    return null;
}

/**
 * Builds the embed URL for the detected platform.
 * Returns null if the URL cannot be embedded (falls back to direct).
 */
function getEmbedUrl(url, platform) {
    switch (platform) {
        case 'youtube': {
            const id = getYouTubeId(url);
            if (!id) return null;
            return `https://www.youtube.com/embed/${id}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`;
        }
        case 'tiktok': {
            // TikTok embed format: https://www.tiktok.com/embed/v2/VIDEO_ID
            try {
                const u = new URL(url);
                // Extract video ID from path like /@user/video/1234567890
                const parts = u.pathname.split('/');
                const videoIdx = parts.indexOf('video');
                if (videoIdx !== -1 && parts[videoIdx + 1]) {
                    return `https://www.tiktok.com/embed/v2/${parts[videoIdx + 1]}`;
                }
            } catch { /* ignore */ }
            return null;
        }
        case 'facebook': {
            return `https://www.facebook.com/plugins/video.php?href=${encodeURIComponent(url)}&show_text=false&autoplay=true`;
        }
        case 'vimeo': {
            try {
                const u = new URL(url);
                const id = u.pathname.split('/').filter(Boolean)[0];
                if (id && /^\d+$/.test(id)) {
                    return `https://player.vimeo.com/video/${id}?autoplay=1`;
                }
            } catch { /* ignore */ }
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
                    // dailymotion.com/video/VIDEO_ID
                    const parts = u.pathname.split('/');
                    const videoIdx = parts.indexOf('video');
                    if (videoIdx !== -1 && parts[videoIdx + 1]) {
                        id = parts[videoIdx + 1];
                    }
                }
                if (id) return `https://www.dailymotion.com/embed/video/${id}?autoplay=1`;
            } catch { /* ignore */ }
            return null;
        }
        default:
            return null;
    }
}

/**
 * Returns a human-readable label for the platform.
 */
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


export default function WatchTogetherPanel({
    watchTogether,        // { videoUrl, isPlaying, currentTime }
    onStartWatch,         // (url) => void
    onSyncWatch,          // (action, currentTime) => void
    onEndWatch,           // () => void
    watchVideoRef,        // callback ref for <video>
}) {
    const [urlInput, setUrlInput] = useState('');
    const videoRef = useRef(null);
    const isSyncingRef = useRef(false);

    // Detect platform
    const platform = detectPlatform(watchTogether?.videoUrl);
    const isEmbed = platform !== 'direct';
    const embedUrl = isEmbed ? getEmbedUrl(watchTogether?.videoUrl, platform) : null;
    // If the URL looks like a platform URL but we can't build an embed URL, fall back to direct
    const useIframe = isEmbed && embedUrl;

    // Sync video state when watchTogether changes (only for direct <video>)
    useEffect(() => {
        if (useIframe) return; // iframe handles its own playback
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
    }, [watchTogether?.isPlaying, watchTogether?.currentTime, useIframe]);

   
    useEffect(() => {
        if (useIframe) return;
        const video = videoRef.current;
        if (!video || !watchTogether?.videoUrl) return;
        if (video.src !== watchTogether.videoUrl) {
            video.src = watchTogether.videoUrl;
            video.load();
        }
    }, [watchTogether?.videoUrl, useIframe]);

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

    // Not started yet — show URL input
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

    // Active — show player
    return (
        <div className="w-full max-w-lg animate-fade-in">
            <div className="bg-black/85 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/[.06]">
                    <div className="flex items-center gap-1.5">
                        <WatchTogetherIcon size={14} color="#ff2d78" />
                        <span className="text-white/60 text-xs font-body">Đang xem cùng nhau</span>
                        <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                    </div>
                    <button
                        onClick={onEndWatch}
                        className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-red-500/30 rounded-full border-none cursor-pointer transition-colors"
                    >
                        <CloseIcon size={10} color="#fff" />
                    </button>
                </div>

                {/* Video / Iframe */}
                <div className="relative aspect-video bg-black">
                    {useIframe ? (
                        /* ── Embedded player (YouTube, TikTok, etc.) ── */
                        <iframe
                            src={embedUrl}
                            className="w-full h-full border-none"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            referrerPolicy="no-referrer-when-downgrade"
                            title="Watch Together"
                        />
                    ) : (
                        /* ── Direct video player ── */
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
                    {!useIframe && (
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
                        {useIframe && (
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
