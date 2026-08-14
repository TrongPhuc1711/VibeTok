import React, { useEffect, useState, useRef } from 'react';
import { MsgAvatar } from './ConversationSidebar';
import {
    PhoneOffIcon, MicIcon, MicOffIcon,
    VideoIcon, VideoOffIcon, SpeakerIcon,
    ScreenShareIcon, ScreenShareOffIcon,
    WatchTogetherIcon, DotsHorizontalIcon,
} from '../../icons/MessageIcons';
import WatchTogetherPanel from './WatchTogetherPanel';

/* ── Control Button ── */
function CallBtn({ onClick, children, variant = 'default', label, extraContent }) {
    const variants = {
        default: 'bg-white/10 hover:bg-white/[.18]',
        danger:  'bg-red-500 hover:bg-red-600 shadow-[0_4px_20px_rgba(239,68,68,.35)]',
        active:  'bg-[#ff2d78]/15 border border-[#ff2d78]/35 hover:bg-[#ff2d78]/25',
    };

    return (
        <div className="relative flex flex-col items-center gap-1.5 cursor-pointer">
            <button
                onClick={onClick}
                className={`w-14 h-14 rounded-full flex items-center justify-center border-none cursor-pointer transition-all duration-200 active:scale-[.93] ${variants[variant] || variants.default}`}
            >
                {children}
            </button>
            {label && <span className="text-[10px] text-[#666] font-body whitespace-nowrap">{label}</span>}
            {extraContent}
        </div>
    );
}

/* ── Watch Invite Banner ── */
function WatchInviteBanner({ invite, partnerName, onAccept, onDecline }) {
    const [countdown, setCountdown] = useState(30);
    const timerRef = useRef(null);

    // Auto-decline after 30s
    useEffect(() => {
        setCountdown(30);
        timerRef.current = setInterval(() => {
            setCountdown(prev => {
                if (prev <= 1) {
                    clearInterval(timerRef.current);
                    onDecline();
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [invite, onDecline]);

    // Detect platform label
    const getPlatform = (url) => {
        if (!url) return { label: '🎬 Video', color: '#ccc' };
        try {
            const host = new URL(url).hostname.replace('www.', '').replace('m.', '');
            if (host.includes('youtube') || host.includes('youtu.be')) return { label: '▶ YouTube', color: '#ff0000' };
            if (host.includes('tiktok')) return { label: '♪ TikTok', color: '#69c9d0' };
            if (host.includes('facebook') || host.includes('fb.watch')) return { label: 'f Facebook', color: '#1877f2' };
            if (host.includes('vimeo')) return { label: '▷ Vimeo', color: '#1ab7ea' };
        } catch { /* */ }
        return { label: '🎬 Video', color: '#ccc' };
    };

    const platform = getPlatform(invite?.videoUrl);
    const shortUrl = invite?.videoUrl?.replace(/^https?:\/\/(www\.)?/, '').substring(0, 45) || 'Video';

    return (
        <div className="w-full max-w-sm animate-fade-in">
            <div className="bg-black/80 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-[0_12px_40px_rgba(0,0,0,.5)] overflow-hidden">
                {/* Header */}
                <div className="flex items-center gap-2 px-4 pt-3.5 pb-1">
                    <WatchTogetherIcon size={16} color="#ff2d78" />
                    <span className="text-white text-sm font-semibold font-body flex-1">
                        Mời xem video cùng nhau
                    </span>
                    <span className="text-[10px] text-white/30 font-mono tabular-nums">
                        {countdown}s
                    </span>
                </div>

                {/* Info */}
                <div className="px-4 py-2">
                    <p className="text-white/50 text-xs font-body m-0 mb-1.5">
                        <span className="text-white/80 font-medium">{partnerName || 'Đối phương'}</span>
                        {' '}mời bạn xem video cùng:
                    </p>
                    <div className="flex items-center gap-2 bg-white/[.06] rounded-lg px-3 py-2 border border-white/[.04]">
                        <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md shrink-0"
                            style={{ background: `${platform.color}20`, color: platform.color }}>
                            {platform.label}
                        </span>
                        <span className="text-white/40 text-[11px] font-body truncate">{shortUrl}</span>
                    </div>
                </div>

                {/* Countdown bar */}
                <div className="h-[2px] bg-white/[.04] mx-4">
                    <div
                        className="h-full bg-gradient-to-r from-[#ff2d78] to-[#ff6b35] rounded-full transition-all duration-1000 ease-linear"
                        style={{ width: `${(countdown / 30) * 100}%` }}
                    />
                </div>

                {/* Buttons */}
                <div className="flex gap-2 px-4 py-3">
                    <button
                        onClick={onDecline}
                        className="flex-1 px-4 py-2.5 bg-white/[.08] hover:bg-white/[.12] text-white/60 hover:text-white/80 text-sm font-semibold font-body rounded-xl border border-white/[.06] cursor-pointer transition-all duration-200"
                    >
                        Từ chối
                    </button>
                    <button
                        onClick={onAccept}
                        className="flex-1 px-4 py-2.5 bg-brand-gradient text-white text-sm font-semibold font-body rounded-xl border-none cursor-pointer hover:opacity-85 transition-all duration-200 shadow-[0_4px_16px_rgba(255,45,120,.25)]"
                    >
                        🎬 Tham gia xem
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── CallOverlay ── */
export default function CallOverlay({
    callState,   // 'calling' | 'ringing' | 'connected' | 'ended'
    callType,    // 'voice' | 'video'
    partnerInfo,
    formattedDuration,
    isMuted,
    isCameraOff,
    localVideoRef,
    remoteVideoRef,
    onEnd,
    onToggleMute,
    onToggleCamera,
    isScreenSharing,
    onToggleScreenShare,
    watchTogether,
    onStartWatchTogether,
    onSyncWatchTogether,
    onEndWatchTogether,
    watchVideoRef,
    localVideoElementRef,
    remoteVideoElementRef,
    /* Watch invite (opt-in) */
    watchInvite,
    onAcceptWatchInvite,
    onDeclineWatchInvite,
}) {
    const [showWatchInput, setShowWatchInput] = useState(false);
    const [moreMenuOpen, setMoreMenuOpen] = useState(false);
    const menuRef = useRef(null);

    // Prevent body scroll
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    // Close menu on outside click
    useEffect(() => {
        if (!moreMenuOpen) return;
        const handler = (e) => {
            if (menuRef.current && !menuRef.current.contains(e.target)) {
                setMoreMenuOpen(false);
            }
        };
        document.addEventListener('pointerdown', handler);
        return () => document.removeEventListener('pointerdown', handler);
    }, [moreMenuOpen]);

    const statusText = {
        calling: 'Đang gọi...',
        ringing: 'Đang đổ chuông...',
        connected: '',
        ended: 'Cuộc gọi đã kết thúc',
    }[callState] || '';

    const isConnected = callState === 'connected';
    const isVideo = callType === 'video';

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#070710] animate-fade-in">

            {/* ── Video streams ── */}
            {isVideo && (
                <>
                    <video
                        ref={remoteVideoRef}
                        autoPlay playsInline
                        className="absolute inset-0 w-full h-full object-cover md:object-contain transition-all duration-500"
                        style={{ filter: !isConnected ? 'blur(20px) brightness(0.3)' : 'none' }}
                    />
                    <video
                        ref={localVideoRef}
                        autoPlay playsInline muted
                        className={`absolute bottom-28 right-4 md:bottom-8 md:right-8 w-[6.5rem] h-40 md:w-44 md:h-64 object-cover rounded-2xl border-2 border-white/10 shadow-2xl z-10 transition-opacity duration-300 ${isCameraOff ? 'opacity-0' : 'opacity-100'}`}
                    />
                    {isScreenSharing && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-blue-500/15 backdrop-blur-xl border border-blue-400/30 rounded-full px-4 py-1.5 shadow-lg">
                            <ScreenShareIcon size={14} color="#60a5fa" />
                            <span className="text-blue-300 text-xs font-body">Đang chia sẻ màn hình</span>
                            <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
                        </div>
                    )}
                </>
            )}

            {/* Voice call background */}
            {callType === 'voice' && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d20] via-[#0a0a18] to-[#080810]" />
                    <audio ref={remoteVideoRef} autoPlay />
                </>
            )}

            {/* ── Top: partner info ── */}
            <div className="relative z-10 flex flex-col items-center pt-16 gap-4 animate-fade-in">
                <div
                    className={`rounded-full p-[3px] relative ${isConnected ? 'shadow-[0_0_0_2px_rgba(255,45,120,.4),0_0_20px_rgba(255,45,120,.15)]' : ''}`}
                    style={{
                        animation: callState === 'calling' || callState === 'ringing' ? 'pulse 2s infinite' : 'none',
                    }}
                >
                    <MsgAvatar user={partnerInfo || {}} size="lg" />
                </div>

                <div className="text-center">
                    <p className="text-white text-xl font-semibold font-display m-0">
                        {partnerInfo?.partnerFullname || partnerInfo?.fullName || partnerInfo?.username || 'Đang kết nối...'}
                    </p>
                    <p className="text-[#666] text-xs font-body mt-0.5">
                        {isVideo ? '🎥 Gọi video' : '📞 Gọi thoại'}
                        {isScreenSharing && ' • 🖥️ Chia sẻ MH'}
                        {watchTogether && ' • 📺 Xem cùng nhau'}
                    </p>
                    <div className="mt-2">
                        {isConnected
                            ? <span className="text-[#aaa] text-sm font-body font-mono tracking-wider">{formattedDuration}</span>
                            : <span className="text-[#555] text-[13px] font-body">{statusText}</span>
                        }
                    </div>
                </div>
            </div>

            {/* ── Waveform (voice, connected) ── */}
            {callType === 'voice' && isConnected && (
                <div className="relative z-10 flex items-center gap-[3px] h-12">
                    {[...Array(7)].map((_, i) => (
                        <div
                            key={i}
                            className="w-[3px] bg-[#ff2d78]/50 rounded-full"
                            style={{
                                height: 6 + Math.random() * 22,
                                animation: `soundBar .8s ease-in-out ${i * 0.1}s infinite alternate`,
                            }}
                        />
                    ))}
                    <style>{`@keyframes soundBar { from { height: 6px } to { height: 28px } }`}</style>
                </div>
            )}

            {/* ── Watch Together Panel ── */}
            {(showWatchInput || watchTogether) && isConnected && (
                <div className="relative z-20 w-full flex justify-center px-4">
                    <WatchTogetherPanel
                        watchTogether={watchTogether}
                        onStartWatch={(url) => {
                            onStartWatchTogether(url);
                            setShowWatchInput(false);
                        }}
                        onSyncWatch={onSyncWatchTogether}
                        onEndWatch={() => {
                            onEndWatchTogether();
                            setShowWatchInput(false);
                        }}
                        watchVideoRef={watchVideoRef}
                        localVideoRef={localVideoElementRef}
                        remoteVideoRef={remoteVideoElementRef}
                    />
                </div>
            )}

            {/* ── Watch Invite Banner ── */}
            {watchInvite && !watchTogether && isConnected && (
                <div className="relative z-20 w-full flex justify-center px-4">
                    <WatchInviteBanner
                        invite={watchInvite}
                        partnerName={partnerInfo?.partnerFullname || partnerInfo?.fullName || partnerInfo?.username}
                        onAccept={onAcceptWatchInvite}
                        onDecline={onDeclineWatchInvite}
                    />
                </div>
            )}

            {/* ── Bottom: controls ── */}
            <div className="relative z-10 flex flex-col items-center gap-3 pb-14 animate-fade-in">
                <div className="flex items-center justify-center gap-5">
                    {/* Mic */}
                    <CallBtn onClick={onToggleMute} variant={isMuted ? 'active' : 'default'} label={isMuted ? 'Bật mic' : 'Tắt mic'}>
                        {isMuted ? <MicOffIcon size={22} color="#ff2d78" /> : <MicIcon size={22} color="#fff" />}
                    </CallBtn>

                    {/* End Call */}
                    <CallBtn onClick={onEnd} variant="danger" label="Kết thúc">
                        <PhoneOffIcon size={24} color="#fff" />
                    </CallBtn>

                    {/* Camera (video only) */}
                    {isVideo && (
                        <CallBtn onClick={onToggleCamera} variant={isCameraOff ? 'active' : 'default'} label={isCameraOff ? 'Bật cam' : 'Tắt cam'}>
                            {isCameraOff ? <VideoOffIcon size={22} color="#ff2d78" /> : <VideoIcon size={22} color="#fff" />}
                        </CallBtn>
                    )}

                    {/* Speaker (voice only) */}
                    {callType === 'voice' && (
                        <CallBtn onClick={() => {}} variant="default" label="Loa ngoài">
                            <SpeakerIcon size={22} color="#fff" />
                        </CallBtn>
                    )}

                    {/* More (3 dots) — only when connected */}
                    {isConnected && (
                        <CallBtn
                            onClick={() => setMoreMenuOpen(prev => !prev)}
                            variant={moreMenuOpen ? 'active' : 'default'}
                            label="Thêm"
                            extraContent={
                                moreMenuOpen && (
                                    <div
                                        ref={menuRef}
                                        className="absolute bottom-[calc(100%+.75rem)] right-1/2 translate-x-1/2 min-w-44 bg-[#14141e]/95 backdrop-blur-2xl border border-white/10 rounded-xl p-1 shadow-[0_12px_40px_rgba(0,0,0,.6)] animate-fade-in z-50"
                                    >
                                        {/* Triangle pointer */}
                                        <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 w-3 h-1.5 bg-[#14141e]/95" style={{ clipPath: 'polygon(0 0, 100% 0, 50% 100%)' }} />

                                        {/* Screen share (video only) */}
                                        {isVideo && (
                                            <>
                                                <button
                                                    className={`flex items-center gap-2.5 w-full px-3 py-2 bg-transparent border-none rounded-lg cursor-pointer transition-all text-left text-[13px] font-body ${isScreenSharing ? 'text-blue-400 hover:bg-blue-500/10' : 'text-[#ccc] hover:bg-white/[.08] hover:text-white'}`}
                                                    onClick={(e) => { e.stopPropagation(); onToggleScreenShare(); setMoreMenuOpen(false); }}
                                                >
                                                    {isScreenSharing
                                                        ? <ScreenShareOffIcon size={18} color="#60a5fa" />
                                                        : <ScreenShareIcon size={18} color="#999" />
                                                    }
                                                    {isScreenSharing ? 'Dừng chia sẻ MH' : 'Chia sẻ màn hình'}
                                                </button>
                                                <div className="h-px bg-white/[.06] mx-2 my-1" />
                                            </>
                                        )}

                                        {/* Watch Together */}
                                        <button
                                            className={`flex items-center gap-2.5 w-full px-3 py-2 bg-transparent border-none rounded-lg cursor-pointer transition-all text-left text-[13px] font-body ${watchTogether ? 'text-amber-400 hover:bg-amber-500/10' : 'text-[#ccc] hover:bg-white/[.08] hover:text-white'}`}
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                if (watchTogether) { onEndWatchTogether(); }
                                                else { setShowWatchInput(prev => !prev); }
                                                setMoreMenuOpen(false);
                                            }}
                                        >
                                            <WatchTogetherIcon size={18} color={watchTogether ? '#f59e0b' : '#999'} />
                                            {watchTogether ? 'Dừng xem cùng' : 'Xem video cùng nhau'}
                                        </button>
                                    </div>
                                )
                            }
                        >
                            <DotsHorizontalIcon size={22} color={moreMenuOpen ? '#ff2d78' : '#fff'} />
                        </CallBtn>
                    )}
                </div>
            </div>
        </div>
    );
}