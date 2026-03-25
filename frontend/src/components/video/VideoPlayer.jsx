//video player với controls
import React, { useRef, useState, useEffect } from 'react';
import { formatDuration } from '../../utils/formatters';

export default function VideoPlayer({ src, poster, autoPlay = false, className = '' }) {
    const videoRef = useRef(null);
    const [playing, setPlaying] = useState(false);
    const [progress, setProgress] = useState(0);
    const [duration, setDuration] = useState(0);
    const [muted, setMuted] = useState(false);

    useEffect(() => {
        const v = videoRef.current;
        if (!v) return;
        const onTime = () => setProgress(v.duration ? v.currentTime / v.duration : 0);
        const onLoad = () => setDuration(v.duration || 0);
        v.addEventListener('timeupdate', onTime);
        v.addEventListener('loadedmetadata', onLoad);
        return () => { v.removeEventListener('timeupdate', onTime); v.removeEventListener('loadedmetadata', onLoad); };
    }, []);

    const toggle = () => {
        const v = videoRef.current;
        if (!v) return;
        if (v.paused) { v.play(); setPlaying(true); }
        else { v.pause(); setPlaying(false); }
    };

    const seek = (e) => {
        const v = videoRef.current;
        if (!v || !v.duration) return;
        const rect = e.currentTarget.getBoundingClientRect();
        v.currentTime = ((e.clientX - rect.left) / rect.width) * v.duration;
    };

    const currentTime = videoRef.current?.currentTime ?? 0;

    return (
        <div className={`relative bg-black rounded-xl overflow-hidden group ${className}`}>
            {src ? (
                <video
                    ref={videoRef}
                    src={src}
                    poster={poster}
                    autoPlay={autoPlay}
                    muted={muted}
                    loop
                    className="w-full h-full object-cover"
                    onClick={toggle}
                />
            ) : (
                /* placeholder khi chưa có src */
                <div className="w-full h-full bg-gradient-to-br from-[#1a0a2e] to-[#0a1a2e] flex items-center justify-center cursor-pointer" onClick={toggle}>
                    <div className="w-16 h-16 rounded-full bg-white/10 flex items-center justify-center">
                        <PlayIcon />
                    </div>
                </div>
            )}

            {/* Controls overlay */}
            <div className="absolute bottom-0 left-0 right-0 p-3 opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ background: 'linear-gradient(to top,rgba(0,0,0,.7),transparent)' }}>
                {/* Progress bar */}
                <div className="h-1 bg-white/20 rounded cursor-pointer mb-2" onClick={seek}>
                    <div className="h-full bg-primary rounded transition-all" style={{ width: `${progress * 100}%` }} />
                </div>
                <div className="flex items-center gap-3">
                    <button onClick={toggle} className="bg-transparent border-none cursor-pointer text-white p-0">
                        {playing ? <PauseIcon /> : <PlayIcon />}
                    </button>
                    <span className="text-white/70 text-xs font-body">
                        {formatDuration(currentTime)} / {formatDuration(duration)}
                    </span>
                    <button
                        onClick={() => { setMuted(m => !m); if (videoRef.current) videoRef.current.muted = !muted; }}
                        className="ml-auto bg-transparent border-none cursor-pointer text-white p-0"
                    >
                        {muted ? <MuteIcon /> : <VolumeIcon />}
                    </button>
                </div>
            </div>
        </div>
    );
}

function PlayIcon() {
    return <svg width="20" height="20" viewBox="0 0 20 20" fill="rgba(255,255,255,.9)">
        <path d="M4 3l13 7-13 7V3z" />
    </svg>;
}
function PauseIcon() {
    return <svg width="20" height="20" viewBox="0 0 20 20" fill="rgba(255,255,255,.9)">
        <rect x="4" y="3" width="4" height="14" rx="1" /><rect x="12" y="3" width="4" height="14" rx="1" />
    </svg>;
}
function VolumeIcon() {
    return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.2">
        <path d="M3 6H1v4h2l4 3V3L3 6z" />
        <path d="M11 5c1 .8 1.5 1.8 1.5 3s-.5 2.2-1.5 3" />
    </svg>;
}
function MuteIcon() {
    return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="rgba(255,255,255,.8)" strokeWidth="1.2">
        <path d="M3 6H1v4h2l4 3V3L3 6z" /><path d="M13 5l-4 4M9 5l4 4" />
    </svg>;
}