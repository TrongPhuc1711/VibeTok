import { useState, useEffect, useRef, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { getSharedSocket } from './useMessages';
import { useAuthContext } from '../contexts/AuthContext';
import { useToast } from '../components/ui/Toast';

// Dynamic ICE Servers
let cachedIceServers = null;
const getIceServers = async () => {
    if (cachedIceServers) return cachedIceServers;
    try {
        const response = await fetch("https://vibetok.metered.live/api/v1/turn/credentials?apiKey=9ce594d0a3fc0100ff7cf5a05af3219f01f4");
        const iceServers = await response.json();
        if (iceServers && iceServers.length > 0) {
            cachedIceServers = iceServers;
            return iceServers;
        }
    } catch (e) {
        console.error("[Call] Failed to fetch TURN credentials", e);
    }
    // Fallback
    return [{ urls: 'stun:stun.l.google.com:19302' }];
};

export function useCall() {
    const { user: me } = useAuthContext();
    const toast = useToast();

    // ── State ──
    const [callState, setCallState] = useState('idle');
    // 'idle' | 'calling' | 'ringing' | 'connected' | 'ended'
    const [callType, setCallType] = useState('voice'); // 'voice' | 'video'
    const [isMuted, setIsMuted] = useState(false);
    const [isCameraOff, setIsCameraOff] = useState(false);
    const [callDuration, setCallDuration] = useState(0);
    const [incomingCall, setIncomingCall] = useState(null);
    // { fromUserId, callerInfo, offer, callType }

    const [currentPartnerId, setCurrentPartnerId] = useState(null);
    const [currentPartnerInfo, setCurrentPartnerInfo] = useState(null);

    // ── Refs ──
    const pcRef = useRef(null);   // RTCPeerConnection
    const localStreamRef = useRef(null);   // MediaStream (local)
    const remoteStreamRef = useRef(null);  // MediaStream (remote)
    const localVideoElementRef = useRef(null);   // <video> element internal
    const remoteVideoElementRef = useRef(null);  // <video> element internal
    const iceCandidateQueueRef = useRef([]);

    const localVideoRef = useCallback((node) => {
        localVideoElementRef.current = node;
        if (node && localStreamRef.current && node.srcObject !== localStreamRef.current) {
            node.srcObject = localStreamRef.current;
        }
    }, []);

    const remoteVideoRef = useCallback((node) => {
        remoteVideoElementRef.current = node;
        if (node && remoteStreamRef.current && node.srcObject !== remoteStreamRef.current) {
            node.srcObject = remoteStreamRef.current;
        }
    }, []);
    const timerRef = useRef(null);
    const mountedRef = useRef(true);
    const onCallLogRef = useRef(null);
    const callTypeRef = useRef('voice');

    // ── Socket listener cho incoming call ──
    useEffect(() => {
        if (!me?.id) return;
        mountedRef.current = true;
        const socket = getSharedSocket();
        const myId = String(me.id);

        const ensureJoin = () => {
            try {
                console.log('[Call][Socket] ensure join_user_room', { myId, connected: socket.connected });
                socket.emit('join_user_room', myId);
            } catch (e) {
                console.warn('[Call][Socket] ensureJoin failed', e);
            }
        };

        // Join immediately (if already connected) and also on every reconnect.
        if (socket.connected) ensureJoin();
        socket.on('connect', ensureJoin);
        socket.on('reconnect', ensureJoin);

        const onIncoming = ({ fromUserId, offer, callType: ct, callerInfo }) => {
            if (!mountedRef.current) return;
            console.log('[Call][Socket] call_incoming', { fromUserId, callType: ct, hasOffer: !!offer });
            setIncomingCall({ fromUserId, offer, callType: ct || 'voice', callerInfo });
        };
        const retryTimer = setTimeout(() => {
            if (socket.connected) ensureJoin();
        }, 1000);
        const onAnswered = async ({ answer }) => {
            if (!mountedRef.current || !pcRef.current) return;
            
            // Prevent DOMException: Called in wrong state: stable
            if (pcRef.current.signalingState !== 'have-local-offer') {
                console.warn('[Call] Ignoring duplicate answer, state is:', pcRef.current.signalingState);
                return;
            }

            try {
                console.log('[Call][Socket] call_answered', { hasAnswer: !!answer });
                await pcRef.current.setRemoteDescription(new RTCSessionDescription(answer));
                
                // Flush queue
                while (iceCandidateQueueRef.current.length > 0) {
                    const c = iceCandidateQueueRef.current.shift();
                    await pcRef.current.addIceCandidate(new RTCIceCandidate(c));
                }
            } catch (e) {
                console.error('[Call] setRemoteDescription error:', e);
            }
        };

        const onIceCandidate = async ({ candidate }) => {
            if (!mountedRef.current || !candidate) return;
            console.log('[Call][Socket] call_ice_candidate received', { hasCandidate: !!candidate });
            
            if (!pcRef.current || !pcRef.current.remoteDescription) {
                console.log('[Call][Socket] queuing ice candidate');
                iceCandidateQueueRef.current.push(candidate);
                return;
            }

            try {
                await pcRef.current.addIceCandidate(new RTCIceCandidate(candidate));
            } catch (e) {
                console.error('[Call] addIceCandidate error:', e);
            }
        };

        const onUserOffline = ({ toUserId, lastSeen }) => {
            if (!mountedRef.current) return;
            console.warn('[Call][Socket] call_user_offline', { toUserId, lastSeen });
            toast?.showError?.('Người dùng đang offline', 'Không thể thực hiện cuộc gọi lúc này.');
            cleanup();
            setCallState('idle');
            setCurrentPartnerId(null);
            setCurrentPartnerInfo(null);
            onCallLogRef.current?.('Người nhận đang offline', 'call');
        };

        const onRejected = () => {
            if (!mountedRef.current) return;
            console.log('[Call][Socket] call_rejected');
            onCallLogRef.current?.(`Cuộc gọi ${callTypeRef.current} bị từ chối`, 'call');
            cleanup();
            setCallState('ended');
            setTimeout(() => {
                if (mountedRef.current) {
                    setCallState('idle');
                    setCurrentPartnerId(null);
                    setCurrentPartnerInfo(null);
                }
            }, 2000);
        };

        const onEnded = () => {
            if (!mountedRef.current) return;
            console.log('[Call][Socket] call_ended');
            // Callee (B) nhận được onEnded thì không cần log, chỉ Caller (A) mới chủ động log lúc bấm kết thúc,
            // trừ khi đang kết nối mà B kết thúc thì A cũng log? Tốt nhất để người chủ động kết thúc sẽ log.
            cleanup();
            setCallState('ended');
            setTimeout(() => {
                if (mountedRef.current) {
                    setCallState('idle');
                    setCurrentPartnerId(null);
                    setCurrentPartnerInfo(null);
                }
            }, 2000);
        };

        const onRinging = () => {
            if (!mountedRef.current) return;
            console.log('[Call][Socket] call_ringing');
            setCallState('calling'); // người kia đang đổ chuông
        };

        socket.on('call_incoming', onIncoming);
        socket.on('call_answered', onAnswered);
        socket.on('call_ice_candidate', onIceCandidate);
        socket.on('call_user_offline', onUserOffline);
        socket.on('call_rejected', onRejected);
        socket.on('call_ended', onEnded);
        socket.on('call_ringing', onRinging);

        return () => {
            mountedRef.current = false;
            socket.off('connect', ensureJoin);
            socket.off('reconnect', ensureJoin);  
            socket.off('call_incoming', onIncoming);
            socket.off('call_answered', onAnswered);
            socket.off('call_ice_candidate', onIceCandidate);
            socket.off('call_user_offline', onUserOffline);
            socket.off('call_rejected', onRejected);
            socket.off('call_ended', onEnded);
            socket.off('call_ringing', onRinging);
            clearTimeout(retryTimer);
        };
    }, [me?.id]); // eslint-disable-line react-hooks/exhaustive-deps

    // ── Helpers ──

    const createPeerConnection = useCallback(async (targetId, onTrack) => {
        const iceServers = await getIceServers();
        const pc = new RTCPeerConnection({ iceServers });
        console.log('[Call][WebRTC] createPeerConnection', { targetId: String(targetId) });

        pc.onicecandidate = ({ candidate }) => {
            if (candidate) {
                console.log('[Call][WebRTC] onicecandidate -> emit', { targetId: String(targetId) });
                getSharedSocket().emit('call_ice_candidate', {
                    toUserId: targetId,
                    candidate,
                });
            }
        };

        pc.onconnectionstatechange = () => {
            console.log('[Call][WebRTC] connectionState', pc.connectionState);
            if (pc.connectionState === 'connected') {
                setCallState('connected');
                startTimer();
            }
            if (['disconnected', 'failed', 'closed'].includes(pc.connectionState)) {
                cleanup();
                setCallState('ended');
                setTimeout(() => {
                    if (mountedRef.current) {
                        setCallState('idle');
                        setCurrentPartnerId(null);
                        setCurrentPartnerInfo(null);
                    }
                }, 2000);
            }
        };

        pc.ontrack = (event) => {
            const [stream] = event.streams;
            console.log('[Call][WebRTC] ontrack', { hasStream: !!stream, tracks: stream?.getTracks?.().length });
            remoteStreamRef.current = stream;
            if (remoteVideoElementRef.current) remoteVideoElementRef.current.srcObject = stream;
            onTrack?.(stream);
        };

        return pc;
    }, []);

    const getMedia = useCallback(async (type) => {
        const constraints = {
            audio: true,
            video: type === 'video' ? { facingMode: 'user', width: 1280, height: 720 } : false,
        };
        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        localStreamRef.current = stream;
        if (localVideoElementRef.current) localVideoElementRef.current.srcObject = stream;
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
        if (localVideoElementRef.current) localVideoElementRef.current.srcObject = null;
        if (remoteVideoElementRef.current) remoteVideoElementRef.current.srcObject = null;
        setIsMuted(false);
        setIsCameraOff(false);
        iceCandidateQueueRef.current = [];
    }, []);

    // ── Actions ──

    const startCall = useCallback(async (targetId, targetInfo, type = 'voice', onLog = null) => {
        if (callState !== 'idle' || !targetId) return;
        console.log('[Call] startCall', { fromUserId: me?.id, toUserId: targetId, type });

        // flushSync forces synchronous re-render so CallOverlay mounts
        // BEFORE getMedia() tries to attach stream to video/audio elements
        flushSync(() => {
            setCallType(type);
            callTypeRef.current = type;
            setCurrentPartnerId(targetId);
            setCurrentPartnerInfo(targetInfo);
            onCallLogRef.current = onLog;
            setCallState('calling');
        });

        try {
            const stream = await getMedia(type);
            const pc = await createPeerConnection(targetId);
            pcRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            const offer = await pc.createOffer();
            await pc.setLocalDescription(offer);

            console.log('[Call] emit call_offer', { toUserId: targetId, type, hasOffer: !!offer });
            getSharedSocket().emit('call_offer', {
                toUserId: targetId,
                offer,
                callType: type,
                callerInfo: {
                    fullName: me?.fullName || me?.username,
                    avatar: me?.anh_dai_dien,
                    initials: me?.initials || 'U',
                },
            });
        } catch (e) {
            console.error('[Call] startCall error:', e);
            toast?.showError('Lỗi cuộc gọi', 'Không thể truy cập Camera/Mic. Vui lòng cấp quyền hoặc dùng HTTPS.');
            cleanup();
            setCallState('idle');
            setCurrentPartnerId(null);
            setCurrentPartnerInfo(null);
        }
    }, [callState, getMedia, createPeerConnection, cleanup, me, toast]);

    const acceptCall = useCallback(async () => {
        if (!incomingCall) return;
        const { fromUserId, offer, callType: ct, callerInfo } = incomingCall;
        console.log('[Call] acceptCall', { fromUserId, callType: ct, hasOffer: !!offer });

        // flushSync forces synchronous re-render so CallOverlay mounts
        // BEFORE getMedia() tries to attach stream to video/audio elements
        flushSync(() => {
            setCallType(ct);
            callTypeRef.current = ct;
            setCurrentPartnerId(fromUserId);
            setCurrentPartnerInfo(callerInfo);
            setCallState('ringing');
            setIncomingCall(null);
        });

        try {
            const stream = await getMedia(ct);
            const pc = await createPeerConnection(fromUserId);
            pcRef.current = pc;

            stream.getTracks().forEach(track => pc.addTrack(track, stream));

            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            
            // Flush queue
            while (iceCandidateQueueRef.current.length > 0) {
                const c = iceCandidateQueueRef.current.shift();
                await pc.addIceCandidate(new RTCIceCandidate(c));
            }

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);

            console.log('[Call] emit call_answer', { toUserId: fromUserId, hasAnswer: !!answer });
            getSharedSocket().emit('call_answer', { toUserId: fromUserId, answer });
        } catch (e) {
            console.error('[Call] acceptCall error:', e);
            toast?.showError('Lỗi cuộc gọi', 'Không thể truy cập Camera/Mic. Vui lòng cấp quyền hoặc dùng HTTPS.');
            cleanup();
            setCallState('idle');
            setCurrentPartnerId(null);
            setCurrentPartnerInfo(null);
        }
    }, [incomingCall, getMedia, createPeerConnection, cleanup, toast]);

    const rejectCall = useCallback(() => {
        if (!incomingCall) return;
        getSharedSocket().emit('call_reject', { toUserId: incomingCall.fromUserId });
        setIncomingCall(null);
        setCallState('idle');
    }, [incomingCall]);

    const endCall = useCallback(() => {
        const toId = currentPartnerId || incomingCall?.fromUserId;
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
        setTimeout(() => {
            if (mountedRef.current) {
                setCallState('idle');
                setCurrentPartnerId(null);
                setCurrentPartnerInfo(null);
                onCallLogRef.current = null;
            }
        }, 2000);
    }, [currentPartnerId, incomingCall, cleanup, callState, callType, callDuration]);

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
        currentPartnerId,
        currentPartnerInfo,
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
