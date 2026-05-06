/*
 useCall.js — WebRTC Voice & Video Call Hook
 *
 Flow:
  Caller:  startCall() → getUserMedia → createOffer → emit call_offer
 Callee:  socket 'call_incoming' → acceptCall() → getUserMedia → createAnswer → emit call_answer
 Both:    exchange ICE candidates via socket
 End:     endCall() | rejectCall() → emit call_end | call_reject
 */
import { useState, useEffect, useRef, useCallback } from 'react';
import { getSharedSocket } from './useMessages';
import { getStoredUser } from '../utils/helpers';

// Google public STUN server (free, works for most networks)
const ICE_SERVERS = [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
];

/**
 * @param {object} params
 * @param {string} params.partnerId      — userId của đối phương
 * @param {object} params.partnerInfo    — { partnerFullname, partnerAvatar, partnerInitials }
 * @param {function} params.onCallEnd    — callback khi cuộc gọi kết thúc
 * @param {function} params.onCallLog    — callback lưu log cuộc gọi (chỉ caller gọi)
 */
export function useCall({ partnerId, partnerInfo, onCallEnd, onCallLog } = {}) {
    const me = getStoredUser();

    // ── State ──
    const [callState, setCallState]     = useState('idle');
    // 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'
    const [callType, setCallType]       = useState('voice'); // 'voice' | 'video'
    const [isMuted, setIsMuted]         = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [incomingCall, setIncomingCall] = useState(null);
    // { fromUserId, callerInfo, offer, callType }

    // ── Refs ──
    const pcRef          = useRef(null);   // RTCPeerConnection
    const localStreamRef = useRef(null);   // MediaStream (local)
    const remoteStreamRef = useRef(null);  // MediaStream (remote)
    const localVideoRef  = useRef(null);   // <video> element
    const remoteVideoRef = useRef(null);   // <video> element
    const timerRef       = useRef(null);
    const mountedRef     = useRef(true);
    const onCallLogRef   = useRef(onCallLog);
    const callTypeRef    = useRef('voice');

    useEffect(() => { onCallLogRef.current = onCallLog; }, [onCallLog]);

    // ── Socket listener cho incoming call ──
    useEffect(() => {
        mountedRef.current = true;
        const socket = getSharedSocket();

        const onIncoming = ({ fromUserId, offer, callType: ct, callerInfo }) => {
            if (!mountedRef.current) return;
            setIncomingCall({ fromUserId, offer, callType: ct || 'voice', callerInfo });
        };

        const onAnswered = async ({ answer }) => {
            if (!mountedRef.current || !pcRef.current) return;
            try {
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
            } catch (e) {
                console.error('[Call] setRemoteDescription error:', e);
            }
        };

        const onIceCandidate = async ({ candidate }) => {
            if (!mountedRef.current || !pcRef.current || !candidate) return;
            try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('[Call] addIceCandidate error:', e);
            }
        };

        const onRejected = () => {
            if (!mountedRef.current) return;
            onCallLogRef.current?.(`Cuộc gọi ${callTypeRef.current} bị từ chối`, 'call');
            cleanup();
            setCallState('ended');
            setTimeout(() => { if (mountedRef.current) setCallState('idle'); }, 2000);
        };

        const onEnded = () => {
            if (!mountedRef.current) return;
            // Callee (B) nhận được onEnded thì không cần log, chỉ Caller (A) mới chủ động log lúc bấm kết thúc,
            // trừ khi đang kết nối mà B kết thúc thì A cũng log? Tốt nhất để người chủ động kết thúc sẽ log.
            cleanup();
            setCallState('ended');
            onCallEnd?.();
            setTimeout(() => { if (mountedRef.current) setCallState('idle'); }, 2000);
        };

        const onRinging = () => {
            if (!mountedRef.current) return;
            setCallState('calling'); // người kia đang đổ chuông
        };

        socket.on('call_incoming',      onIncoming);
        socket.on('call_answered',      onAnswered);
        socket.on('call_ice_candidate', onIceCandidate);
        socket.on('call_rejected',      onRejected);
        socket.on('call_ended',         onEnded);
        socket.on('call_ringing',       onRinging);

        return () => {
            mountedRef.current = false;
            socket.off('call_incoming',      onIncoming);
            socket.off('call_answered',      onAnswered);
            socket.off('call_ice_candidate', onIceCandidate);
            socket.off('call_rejected',      onRejected);
            socket.off('call_ended',         onEnded);
            socket.off('call_ringing',       onRinging);
        };
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Helpers ──

    const createPeerConnection = useCallback((onTrack) => {
        const pc = new RTCPeerConnection({ iceServers: ICE_SERVERS });

        pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
                getSharedSocket().emit('call_ice_candidate', {
                    toUserId: partnerId || incomingCall?.fromUserId,
                    candidate,
                });
            }
        };

        pc.onconnectionstatechange = () => {
            if (pc.connectionState === 'connected') {
                setCallState('connected');
                startTimer();
            }
            if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                cleanup();
                setCallState('ended');
                onCallEnd?.();
                setTimeout(() => { if (mountedRef.current) setCallState('idle'); }, 2000);
            }
        };

        pc.ontrack = (event) => {
            const [stream] = event.streams;
            remoteStreamRef.current = stream;
            if (remoteVideoRef.current) remoteVideoRef.current.srcObject = stream;
            onTrack?.(stream);
        };

        return pc;
    }, [partnerId, incomingCall?.fromUserId, onCallEnd]); // eslint-disable-line

    const getMedia = useCallback(async (type) => {
        const constraints = {
            audio: true,
            video: type === 'video' ? { facingMode: 'user', width: 1280, height: 720 } : false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        if (localVideoRef.current) localVideoRef.current.srcObject = stream;
        return stream;
    }, []);

    const startTimer = useCallback(() => {
        setCallDuration(0);
        timerRef.current = setInterval(() => {
            setCallDuration(d => d + 1);
        }, 1000);
    }, []);

    const cleanup = useCallback(() => {
        clearInterval(timerRef.current);
        setCallDuration(0);
        if (localStreamRef.current) {
            localStreamRef.current.getTracks().forEach(t => t.stop());
            localStreamRef.current = null;
        }
        remoteStreamRef.current = null;
        if (pcRef.current) {
            pcRef.current.close();
            pcRef.current = null;
        }
        if (localVideoRef.current)  localVideoRef.current.srcObject = null;
        if (remoteVideoRef.current) remoteVideoRef.current.srcObject = null;
        setIsMuted(false);
        setIsCameraOff(false);
    }, []);

    // ── Actions ──

    const startCall = useCallback(async (type = 'voice') => {
        if (callState !== 'idle' || !partnerId) return;
        setCallType(type);
        callTypeRef.current = type;
        setCallState('calling');

        try {
            const stream = await getMedia(type);
            const pc = createPeerConnection();
            pcRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            getSharedSocket().emit('call_offer', {
                toUserId:   partnerId,
                offer,
                callType:   type,
                callerInfo: {
                    fullName: me?.fullName || me?.username,
                    avatar:   me?.anh_dai_dien,
                    initials: me?.initials || 'U',
                },
            });
        } catch (e) {
            console.error('[Call] startCall error:', e);
            cleanup();
            setCallState('idle');
        }
    }, [callState, partnerId, getMedia, createPeerConnection, cleanup, me]);

    const acceptCall = useCallback(async () => {
        if (!incomingCall) return;
        const { fromUserId, offer, callType: ct } = incomingCall;
        setCallType(ct);
        callTypeRef.current = ct;
        setCallState('ringing');
        setIncomingCall(null);

        try {
            const stream = await getMedia(ct);
            const pc = createPeerConnection();
            pcRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            getSharedSocket().emit('call_answer', { toUserId: fromUserId, answer });
        } catch (e) {
            console.error('[Call] acceptCall error:', e);
            cleanup();
            setCallState('idle');
        }
    }, [incomingCall, getMedia, createPeerConnection, cleanup]);

    const rejectCall = useCallback(() => {
        if (!incomingCall) return;
        getSharedSocket().emit('call_reject', { toUserId: incomingCall.fromUserId });
        setIncomingCall(null);
        setCallState('idle');
    }, [incomingCall]);

    const endCall = useCallback(() => {
        const toId = partnerId || incomingCall?.fromUserId;
        if (toId) getSharedSocket().emit('call_end', { toUserId: toId });
        
        // Log the call based on state
        if (callState === 'calling' || callState === 'ringing') {
            onCallLogRef.current?.(`Cuộc gọi ${callType} nhỡ`, 'call');
        } else if (callState === 'connected') {
            const m = Math.floor(callDuration / 60).toString().padStart(2, '0');
            const s = (callDuration % 60).toString().padStart(2, '0');
            onCallLogRef.current?.(`Cuộc gọi ${callType} kết thúc (${m}:${s})`, 'call');
        }

        cleanup();
        setCallState('ended');
        onCallEnd?.();
        setTimeout(() => { if (mountedRef.current) setCallState('idle'); }, 2000);
    }, [partnerId, incomingCall, cleanup, onCallEnd, callState, callType, callDuration]);

    const toggleMute = useCallback(() => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getAudioTracks().forEach(t => { t.enabled = !t.enabled; });
        setIsMuted(m => !m);
    }, []);

    const toggleCamera = useCallback(() => {
        if (!localStreamRef.current) return;
        localStreamRef.current.getVideoTracks().forEach(t => { t.enabled = !t.enabled; });
        setIsCameraOff(c => !c);
    }, []);

    // Format duration MM:SS
    const formatDuration = (secs) => {
        const m = Math.floor(secs / 60).toString().padStart(2, '0');
        const s = (secs % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    };

    return {
        // State
        callState,
        callType,
        isMuted,
        isCameraOff,
        callDuration,
        formattedDuration: formatDuration(callDuration),
        incomingCall,
        // Video refs (attach to <video ref={...}>)
        localVideoRef,
        remoteVideoRef,
        // Actions
        startCall,
        acceptCall,
        rejectCall,
        endCall,
        toggleMute,
        toggleCamera,
    };
}
