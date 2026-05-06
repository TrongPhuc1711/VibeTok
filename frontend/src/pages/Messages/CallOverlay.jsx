import React, { useEffect } from 'react';
import { MsgAvatar } from './ConversationSidebar';
import {
    PhoneOffIcon, MicIcon, MicOffIcon,
    VideoIcon, VideoOffIcon, SpeakerIcon,
} from '../../icons/MessageIcons';

/* ── Timer display ── */
function CallTimer({ duration }) {
    return (
        <span className="text-[#aaa] text-[14px] font-body font-mono tracking-wider">
            {duration}
        </span>
    );
}

/* ── Control Button ── */
function CallBtn({ onClick, children, variant = 'default', label }) {
    const base = 'flex flex-col items-center gap-1.5 cursor-pointer';
    const btnBase = 'w-14 h-14 rounded-full flex items-center justify-center border-none transition-all active:scale-95';
    const variants = {
        default: 'bg-white/10 hover:bg-white/20',
        danger:  'bg-red-500 hover:bg-red-600',
        accept:  'bg-emerald-500 hover:bg-emerald-600',
        active:  'bg-[#ff2d78]/20 hover:bg-[#ff2d78]/30 border border-[#ff2d78]/40',
    };

    return (
        <div className={base}>
            <button onClick={onClick} className={`${btnBase} ${variants[variant]}`}>
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
}) {
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

    return (
        <div className="fixed inset-0 z-[100] flex flex-col items-center justify-between bg-[#070710] animate-fade-in">

            {/* ── Video streams (video call only) ── */}
            {callType === 'video' && (
                <>
                    {/* Remote - full background */}
                    <video
                        ref={remoteVideoRef}
                        autoPlay playsInline
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ filter: callState !== 'connected' ? 'blur(20px) brightness(0.3)' : 'none', transition: 'filter 0.5s' }}
                    />
                    {/* Local - picture-in-picture */}
                    <video
                        ref={localVideoRef}
                        autoPlay playsInline muted
                        className={`absolute bottom-28 right-4 w-28 h-44 object-cover rounded-2xl border-2 border-white/10 shadow-2xl z-10 transition-opacity
                            ${isCameraOff ? 'opacity-0' : 'opacity-100'}`}
                    />
                </>
            )}

            {/* ── Voice call background overlay ── */}
            {callType === 'voice' && (
                <div className="absolute inset-0 bg-gradient-to-b from-[#0d0d20] via-[#0a0a18] to-[#080810]" />
            )}

            {/* ── Top: partner info ── */}
            <div className="relative z-10 flex flex-col items-center pt-16 gap-4">
                <div className={`rounded-full p-1 ${callState === 'connected' ? 'ring-2 ring-[#ff2d78]/50 ring-offset-2 ring-offset-[#070710]' : ''}`}
                    style={{ animation: callState === 'calling' || callState === 'ringing' ? 'pulse 2s infinite' : 'none' }}>
                    <MsgAvatar user={partnerInfo || {}} size="lg" />
                </div>

                <div className="text-center">
                    <p className="text-white text-[20px] font-semibold font-display">
                        {partnerInfo?.partnerFullname || 'Đang kết nối...'}
                    </p>
                    <p className="text-[#666] text-[12px] font-body mt-0.5">
                        {callType === 'video' ? '🎥 Gọi video' : '📞 Gọi thoại'}
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

            {/* ── Bottom: controls ── */}
            <div className="relative z-10 flex items-center justify-center gap-6 pb-14">
                {/* Mic */}
                <CallBtn onClick={onToggleMute} variant={isMuted ? 'active' : 'default'} label={isMuted ? 'Bật mic' : 'Tắt mic'}>
                    {isMuted ? <MicOffIcon size={22} color="#ff2d78" /> : <MicIcon size={22} color="#fff" />}
                </CallBtn>

                {/* End Call */}
                <CallBtn onClick={onEnd} variant="danger" label="Kết thúc">
                    <PhoneOffIcon size={24} color="#fff" />
                </CallBtn>

                {/* Camera (video only) */}
                {callType === 'video' && (
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
    );
}
