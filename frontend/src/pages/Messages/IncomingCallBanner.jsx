import React, { useEffect, useRef } from 'react';
import { MsgAvatar } from './ConversationSidebar';
import { PhoneIncomingIcon, PhoneDeclineIcon, VideoCallIcon } from '../../icons/MessageIcons';

export default function IncomingCallBanner({ incomingCall, onAccept, onReject }) {
    const audioRef = useRef(null);

    useEffect(() => {
        if (!incomingCall) return;
        // Ringtone — dùng oscillator đơn giản không cần file
        const AudioCtx = window.AudioContext || window.webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();

        const playRing = () => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 440;
            osc.type = 'sine';
            gain.gain.setValueAtTime(0.3, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.5);
        };

        playRing();
        const interval = setInterval(playRing, 1500);
        audioRef.current = { ctx, interval };

        return () => {
            clearInterval(interval);
            ctx.close();
        };
    }, [incomingCall]);

    if (!incomingCall) return null;

    const { callerInfo, callType } = incomingCall;
    const isVideo = callType === 'video';

    return (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] animate-fade-in">
            <div className="flex items-center gap-3 bg-[#1a1a2e]/95 backdrop-blur-xl border border-[#252540] rounded-2xl px-4 py-3 shadow-2xl min-w-[320px] max-w-[400px]">
                {/* Avatar */}
                <div className="relative shrink-0">
                    <MsgAvatar user={callerInfo || {}} size="md" />
                    {/* Pulse ring */}
                    <div className="absolute inset-0 rounded-full border-2 border-[#ff2d78]/50 animate-ping" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-[13px] font-body truncate">
                        {callerInfo?.fullName || 'Ai đó'}
                    </p>
                    <p className="text-[#666] text-[11px] font-body flex items-center gap-1">
                        {isVideo
                            ? <><VideoCallIcon size={11} color="#666" /> Đang gọi video cho bạn...</>
                            : <><PhoneIncomingIcon size={11} color="#666" /> Đang gọi thoại cho bạn...</>
                        }
                    </p>
                </div>

                {/* Buttons */}
                <div className="flex items-center gap-2 shrink-0">
                    {/* Reject */}
                    <button
                        onClick={onReject}
                        className="w-10 h-10 rounded-full bg-red-500 hover:bg-red-600 flex items-center justify-center border-none cursor-pointer transition-all active:scale-95"
                        title="Từ chối"
                    >
                        <PhoneDeclineIcon size={16} color="#fff" />
                    </button>
                    {/* Accept */}
                    <button
                        onClick={onAccept}
                        className="w-10 h-10 rounded-full bg-emerald-500 hover:bg-emerald-600 flex items-center justify-center border-none cursor-pointer transition-all active:scale-95"
                        title="Trả lời"
                    >
                        <PhoneIncomingIcon size={16} color="#fff" />
                    </button>
                </div>
            </div>
        </div>
    );
}
