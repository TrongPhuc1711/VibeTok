import React, { useEffect, useState } from 'react';
import { MsgAvatar } from './ConversationSidebar';
import {
    PhoneOffIcon, MicIcon, MicOffIcon,
    VideoIcon, VideoOffIcon, SpeakerIcon,
    ScreenShareIcon, ScreenShareOffIcon,
    WatchTogetherIcon, FilterIcon,
} from '../../icons/MessageIcons';
import FilterPanel from './FilterPanel';
import WatchTogetherPanel from './WatchTogetherPanel';

/* ── Timer display ── */
function CallTimer({ duration }) {
    return (
        <span className="text-[#aaa] text-[14px] font-body font-mono tracking-wider">
            {duration}
        </span>
    );
}

/* ── Control Button ── */
function CallBtn({ onClick, children, variant = 'default', label, pulse = false }) {
    const base = 'flex flex-col items-center gap-1.5 cursor-pointer';
    const btnBase = 'w-14 h-14 rounded-full flex items-center justify-center border-none transition-all active:scale-95';
    const variants = {
        default: 'bg-white/10 hover:bg-white/20',
        danger:  'bg-red-500 hover:bg-red-600',
        accept:  'bg-emerald-500 hover:bg-emerald-600',
        active:  'bg-[#ff2d78]/20 hover:bg-[#ff2d78]/30 border border-[#ff2d78]/40',
        screen:  'bg-blue-500/20 hover:bg-blue-500/30 border border-blue-400/40',
        watch:   'bg-amber-500/20 hover:bg-amber-500/30 border border-amber-400/40',
    };

    return (
        <div className={base}>
            <button onClick={onClick} className={`${btnBase} ${variants[variant]} ${pulse ? 'animate-pulse' : ''}`}>
                {children}
            </button>
            {label && <span className="text-[10px] text-[#666] font-body">{label}</span>}
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
    // Screen sharing
    isScreenSharing,
    onToggleScreenShare,
    // Watch Together
    watchTogether,
    onStartWatchTogether,
    onSyncWatchTogether,
    onEndWatchTogether,
    watchVideoRef,
    // Face Filters
    faceFilter,
}) {
    const [showWatchInput, setShowWatchInput] = useState(false);
    const [moreControlsOpen, setMoreControlsOpen] = useState(false);

    // Prevent scroll when overlay is open
    useEffect(() => {
        document.body.style.overflow = 'hidden';
        return () => { document.body.style.overflow = ''; };
    }, []);

    const statusText = {
        calling:   'Đang gọi...',
        ringing:   'Đang đổ chuông...',
        connected: '',
        ended:     'Cuộc gọi đã kết thúc',
    }[callState] || '';

    const isConnected = callState === 'connected';
    const isVideo = callType === 'video';

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#070710] animate-fade-in">

            {/* ── Video streams (video call only) ── */}
            {isVideo && (
                <>
                    {/* Remote - full background on mobile, contained on web */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay playsInline
                        className="absolute inset-0 w-full h-full object-cover md:object-contain"
                        style={{ filter: callState !== 'connected' ? 'blur(20px) brightness(0.3)' : 'none', transition: 'filter 0.5s' }}
                    />
                    {/* Local - picture-in-picture */}
                    <video
                        ref={localVideoRef}
                        autoPlay playsInline muted
                        className={`absolute bottom-28 right-4 md:bottom-8 md:right-8 w-28 h-44 md:w-48 md:h-72 object-cover rounded-2xl border-2 border-white/10 shadow-2xl z-10 transition-opacity
                            ${isCameraOff ? 'opacity-0' : 'opacity-100'}`}
                    />
                    {/* Screen sharing indicator */}
                    {isScreenSharing && (
                        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2 bg-blue-500/20 backdrop-blur-xl border border-blue-400/30 rounded-full px-4 py-1.5 shadow-lg">
                            <ScreenShareIcon size={14} color="#60a5fa" />
                            <span className="text-blue-300 text-xs font-body">Đang chia sẻ màn hình</span>
                            <span className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                        </div>
                    )}
                </>
            )}

            {/*Voice call background overlay + hidden audio for remote stream */}
            {callType === 'voice' && (
                <>
                    <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d20] via-[#0a0a18] to-[#080810]" />
                    {/* Audio element for remote audio playback (voice calls have no <video>) */}
                    <audio ref={remoteVideoRef} autoPlay />
                </>
            )}

            {/* ── Top: partner info ── */}
            <div className="relative z-10 flex flex-col items-center pt-16 gap-4">
                <div className={`rounded-full p-1 ${callState === 'connected' ? 'ring-2 ring-[#ff2d78]/50 ring-offset-2 ring-offset-[#070710]' : ''}`}
                    style={{ animation: callState === 'calling' || callState === 'ringing' ? 'pulse 2s infinite' : 'none' }}>
                    <MsgAvatar user={partnerInfo || {}} size="lg" />
                </div>

                <div className="text-center">
                    <p className="text-white text-[20px] font-semibold font-display">
                        {partnerInfo?.partnerFullname || partnerInfo?.fullName || partnerInfo?.username || 'Đang kết nối...'}
                    </p>
                    <p className="text-[#666] text-[12px] font-body mt-0.5">
                        {isVideo ? '🎥 Gọi video' : '📞 Gọi thoại'}
                        {isScreenSharing && ' • 🖥️ Chia sẻ MH'}
                        {watchTogether && ' • 📺 Xem cùng nhau'}
                    </p>
                    <div className="mt-2">
                        {callState === 'connected'
                            ? <CallTimer duration={formattedDuration} />
                            : <span className="text-[#555] text-[13px] font-body">{statusText}</span>
                        }
                    </div>
                </div>
            </div>

            {/* ── Waveform animation (voice call, connected) ── */}
            {callType === 'voice' && callState === 'connected' && (
                <div className="relative z-10 flex items-center gap-1 h-12">
                    {[...Array(7)].map((_, i) => (
                        <div key={i}
                            className="w-1 bg-[#ff2d78]/60 rounded-full"
                            style={{
                                height: 8 + Math.random() * 24,
                                animation: `soundBar 0.8s ease-in-out ${i * 0.1}s infinite alternate`,
                            }}
                        />
                    ))}
                    <style>{`@keyframes soundBar { from { height: 8px } to { height: 32px } }`}</style>
                </div>
            )}

            {/* ── Watch Together Panel ── */}
            {(showWatchInput || watchTogether) && isConnected && (
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
                />
            )}

            {/* ── Filter Panel ── */}
            {faceFilter?.filterPanelOpen && isVideo && isConnected && (
                <FilterPanel
                    activeFilter={faceFilter.activeFilter}
                    setActiveFilter={faceFilter.setActiveFilter}
                    activeSticker={faceFilter.activeSticker}
                    setActiveSticker={faceFilter.setActiveSticker}
                    onClose={() => faceFilter.setFilterPanelOpen(false)}
                />
            )}

            {/* ── More controls row (only when connected) ── */}
            {isConnected && moreControlsOpen && (
                <div className="relative z-10 flex items-center justify-center gap-4 animate-fade-in">
                    {/* Screen Share (video calls only) */}
                    {isVideo && (
                        <CallBtn
                            onClick={onToggleScreenShare}
                            variant={isScreenSharing ? 'screen' : 'default'}
                            label={isScreenSharing ? 'Dừng chia sẻ' : 'Chia sẻ MH'}
                        >
                            {isScreenSharing
                                ? <ScreenShareOffIcon size={22} color="#60a5fa" />
                                : <ScreenShareIcon size={22} color="#fff" />
                            }
                        </CallBtn>
                    )}

                    {/* Watch Together */}
                    <CallBtn
                        onClick={() => {
                            if (watchTogether) {
                                onEndWatchTogether();
                            } else {
                                setShowWatchInput(prev => !prev);
                            }
                        }}
                        variant={watchTogether ? 'watch' : 'default'}
                        label={watchTogether ? 'Dừng xem' : 'Xem cùng'}
                    >
                        <WatchTogetherIcon size={22} color={watchTogether ? '#f59e0b' : '#fff'} />
                    </CallBtn>

                    {/* Face Filters (video calls only) */}
                    {isVideo && (
                        <CallBtn
                            onClick={() => faceFilter?.toggleFilterPanel()}
                            variant={faceFilter?.filterPanelOpen ? 'active' : 'default'}
                            label="Bộ lọc"
                        >
                            <FilterIcon size={22} color={faceFilter?.filterPanelOpen ? '#ff2d78' : '#fff'} />
                        </CallBtn>
                    )}
                </div>
            )}

            {/* ── Bottom: controls ── */}
            <div className="relative z-10 flex flex-col items-center gap-3 pb-14">
                {/* More toggle */}
                {isConnected && (
                    <button
                        onClick={() => setMoreControlsOpen(prev => !prev)}
                        className="text-[11px] text-[#666] hover:text-[#aaa] font-body bg-transparent border-none cursor-pointer transition-colors mb-1"
                    >
                        {moreControlsOpen ? '▼ Ẩn bớt' : '▲ Thêm tính năng'}
                    </button>
                )}

                <div className="flex items-center justify-center gap-6">
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
                            {isCameraOff
                                ? <VideoOffIcon size={22} color="#ff2d78" />
                                : <VideoIcon size={22} color="#fff" />
                            }
                        </CallBtn>
                    )}

                    {/* Speaker (voice only) */}
                    {callType === 'voice' && (
                        <CallBtn onClick={() => {}} variant="default" label="Loa ngoài">
                            <SpeakerIcon size={22} color="#fff" />
                        </CallBtn>
                    )}
                </div>
            </div>

            {/* ── Active filter/sticker badges ── */}
            {isVideo && isConnected && (faceFilter?.activeFilter !== 'none' || faceFilter?.activeSticker !== 'none') && (
                <div className="absolute bottom-4 left-4 z-20 flex gap-1.5">
                    {faceFilter.activeFilter !== 'none' && (
                        <span className="text-[9px] px-2 py-0.5 bg-[#ff2d78]/20 border border-[#ff2d78]/30 rounded-full text-[#ff2d78] font-body backdrop-blur-sm">
                            {FILTERS_MAP[faceFilter.activeFilter] || faceFilter.activeFilter}
                        </span>
                    )}
                    {faceFilter.activeSticker !== 'none' && (
                        <span className="text-[9px] px-2 py-0.5 bg-[#ff6b35]/20 border border-[#ff6b35]/30 rounded-full text-[#ff6b35] font-body backdrop-blur-sm">
                            {STICKERS_MAP[faceFilter.activeSticker] || faceFilter.activeSticker}
                        </span>
                    )}
                </div>
            )}
        </div>
    );
}

/* Quick lookup maps for badge labels */
const FILTERS_MAP = {
    beauty: '✨ Làm đẹp',
    cool: '❄️ Lạnh',
    warm: '🔥 Ấm',
    vintage: '📷 Cổ điển',
    neon: '💜 Neon',
    galaxy: '🌌 Galaxy',
    anime: '🎨 Anime',
    bw: '🖤 B&W',
    dreamy: '🌸 Dreamy',
};

const STICKERS_MAP = {
    hearts: '💕 Tim',
    stars: '⭐ Sao',
    snow: '❄️ Tuyết',
    fire: '🔥 Lửa',
    bubbles: '🫧 Bóng',
    confetti: '🎉 Hoa giấy',
};
