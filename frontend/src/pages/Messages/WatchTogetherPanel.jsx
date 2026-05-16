import React, { useState, useRef, useEffect } from 'react';
import {
    WatchTogetherIcon, PlayIcon, PauseIcon,
    LinkIcon, CloseIcon,
} from '../../icons/MessageIcons';

export default function WatchTogetherPanel({
    watchTogether,        // { videoUrl, isPlaying, currentTime }
    onStartWatch,         // (url) => void
    onSyncWatch,          // (action, currentTime) => void
    onEndWatch,           // () => void
    watchVideoRef,        // callback ref for <video>
}) {
    const [urlInput, setUrlInput] = useState('');
    const [showInput, setShowInput] = useState(!watchTogether);
    const videoRef = useRef(null);
    const isSyncingRef = useRef(false);

    // Sync video state when watchTogether changes
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !watchTogether) return;

        isSyncingRef.current = true;

        // Seek if diff > 2s
        if (Math.abs(video.currentTime - watchTogether.currentTime) > 2) {
            video.currentTime = watchTogether.currentTime;
        }

        if (watchTogether.isPlaying && video.paused) {
            video.play().catch(() => {});
        } else if (!watchTogether.isPlaying && !video.paused) {
            video.pause();
        }

        setTimeout(() => { isSyncingRef.current = false; }, 300);
    }, [watchTogether?.isPlaying, watchTogether?.currentTime]);

    // Set source when videoUrl changes
    useEffect(() => {
        const video = videoRef.current;
        if (!video || !watchTogether?.videoUrl) return;
        if (video.src !== watchTogether.videoUrl) {
            video.src = watchTogether.videoUrl;
            video.load();
        }
    }, [watchTogether?.videoUrl]);

    const handleSubmitUrl = (e) => {
        e.preventDefault();
        const url = urlInput.trim();
        if (!url) return;
        onStartWatch(url);
        setShowInput(false);
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

    // Not started yet — show url input
    if (!watchTogether) {
        return (
            <div className="absolute inset-x-4 bottom-32 md:bottom-24 z-30 animate-fade-in">
                <div className="bg-black/80 backdrop-blur-xl rounded-2xl border border-white/10 p-4 shadow-2xl max-w-md mx-auto">
                    <div className="flex items-center gap-2 mb-3">
                        <WatchTogetherIcon size={18} color="#ff2d78" />
                        <span className="text-white text-sm font-semibold font-body">Xem video cùng nhau</span>
                    </div>
                    <form onSubmit={handleSubmitUrl} className="flex gap-2">
                        <div className="flex-1 flex items-center gap-2 bg-white/10 rounded-xl px-3 py-2 border border-white/5">
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
                            className="px-4 py-2 bg-gradient-to-r from-[#ff2d78] to-[#ff6b35] text-white text-sm font-semibold rounded-xl border-none cursor-pointer hover:opacity-90 transition-opacity"
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
        <div className="absolute inset-x-2 bottom-32 md:bottom-24 z-30 animate-fade-in">
            <div className="bg-black/85 backdrop-blur-xl rounded-2xl border border-white/10 shadow-2xl max-w-lg mx-auto overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between px-3 py-2 border-b border-white/5">
                    <div className="flex items-center gap-2">
                        <WatchTogetherIcon size={14} color="#ff2d78" />
                        <span className="text-white/70 text-xs font-body">Đang xem cùng nhau</span>
                        <span className="w-2 h-2 bg-emerald-400 rounded-full animate-pulse" />
                    </div>
                    <button
                        onClick={onEndWatch}
                        className="w-6 h-6 flex items-center justify-center bg-white/10 hover:bg-red-500/30 rounded-full border-none cursor-pointer transition-colors"
                    >
                        <CloseIcon size={10} color="#fff" />
                    </button>
                </div>

                {/* Video */}
                <div className="relative aspect-video bg-black">
                    <video
                        ref={setRef}
                        className="w-full h-full object-contain"
                        onPlay={handlePlay}
                        onPause={handlePause}
                        onSeeked={handleSeek}
                        playsInline
                        controls={false}
                    />
                    {/* Centered play/pause overlay */}
                    <button
                        onClick={() => {
                            if (watchTogether.isPlaying) handlePause();
                            else handlePlay();
                        }}
                        className="absolute inset-0 flex items-center justify-center bg-transparent border-none cursor-pointer group"
                    >
                        <div className="w-14 h-14 rounded-full bg-black/50 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            {watchTogether.isPlaying
                                ? <PauseIcon size={22} color="#fff" />
                                : <PlayIcon size={22} color="#fff" />
                            }
                        </div>
                    </button>
                </div>

                {/* Controls */}
                <div className="flex items-center gap-3 px-3 py-2">
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
                    <div className="flex-1 text-[10px] text-[#888] font-body truncate">
                        {watchTogether.videoUrl?.split('/').pop()?.substring(0, 40) || 'Video'}
                    </div>
                    <span className="text-[10px] text-[#ff2d78] font-mono">
                        LIVE SYNC
                    </span>
                </div>
            </div>
        </div>
    );
}
