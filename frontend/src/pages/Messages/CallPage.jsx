import React, { useEffect, useRef } from 'react';
import { useCallContext } from '../../contexts/CallContext';
import * as msgSvc from '../../services/messageService';
import { SpinnerCenter } from '../../components/ui/Spinner';

export default function CallPage() {
    const call = useCallContext();
    const hasInitialized = useRef(false);

    useEffect(() => {
        if (hasInitialized.current) return;
        hasInitialized.current = true;

        const params = new URLSearchParams(window.location.search);
        const mode = params.get('mode');

        if (mode === 'outbound') {
            const type = params.get('type') || 'voice';
            const partnerId = params.get('partnerId');
            const partnerName = decodeURIComponent(params.get('partnerName') || '');
            const partnerAvatar = decodeURIComponent(params.get('partnerAvatar') || '');
            const partnerUsername = params.get('partnerUsername') || '';

            if (partnerId) {
                console.log('[CallPage] Initializing outbound call to:', partnerId);
                call.startCall(
                    partnerId,
                    { partnerFullname: partnerName, partnerAvatar, partnerUsername, partnerId },
                    type,
                    async (msg) => {
                        try {
                            await msgSvc.sendMessage(partnerUsername, msg, 'call');
                        } catch (e) {
                            console.error('[CallPage] Failed to send call log message:', e);
                        }
                    }
                );
            } else {
                console.error('[CallPage] Missing partnerId for outbound call');
                window.close();
            }
        } else if (mode === 'inbound') {
            console.log('[CallPage] Initializing inbound call');
            const stored = localStorage.getItem('vibetok_incoming_call');
            const storedCandidates = localStorage.getItem('vibetok_incoming_ice_candidates');
            if (stored) {
                try {
                    const incomingCall = JSON.parse(stored);
                    let iceCandidates = null;
                    if (storedCandidates) {
                        iceCandidates = JSON.parse(storedCandidates);
                    }
                    
                    call.acceptCall(incomingCall, iceCandidates);
                    
                    // Dọn dẹp localStorage sau khi đã đọc xong
                    localStorage.removeItem('vibetok_incoming_call');
                    localStorage.removeItem('vibetok_incoming_ice_candidates');
                } catch (e) {
                    console.error('[CallPage] Failed to parse stored incoming call/candidates', e);
                    window.close();
                }
            } else {
                console.error('[CallPage] No incoming call data found in localStorage');
                window.close();
            }
        } else {
            console.error('[CallPage] Invalid call mode:', mode);
            window.close();
        }
    }, [call]);

    // Tự động kết thúc cuộc gọi nếu đóng cửa sổ trình duyệt đột ngột
    useEffect(() => {
        const handleUnload = () => {
            console.log('[CallPage] Window is unloading, ending call cleanly');
            call.endCall();
        };
        window.addEventListener('beforeunload', handleUnload);
        return () => {
            window.removeEventListener('beforeunload', handleUnload);
        };
    }, [call]);

    // Lắng nghe các ICE candidates đến trong quá trình Tab mới đang khởi động và chưa kết nối socket
    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'vibetok_incoming_ice_candidates' && e.newValue) {
                try {
                    const candidates = JSON.parse(e.newValue);
                    if (candidates && Array.isArray(candidates) && candidates.length > 0) {
                        console.log('[CallPage] Received real-time ICE candidates via localStorage:', candidates.length);
                        candidates.forEach(c => {
                            call.addIncomingIceCandidate(c);
                        });
                        localStorage.removeItem('vibetok_incoming_ice_candidates');
                    }
                } catch (err) {
                    console.error('[CallPage] Failed to parse ICE candidates from storage', err);
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [call]);

    // Tự động đóng tab khi cuộc gọi kết thúc và quay lại trạng thái idle
    useEffect(() => {
        if (hasInitialized.current && call.callState === 'idle') {
            console.log('[CallPage] Call state is idle, closing window in 1.5s');
            const timer = setTimeout(() => {
                window.close();
            }, 1500);
            return () => clearTimeout(timer);
        }
    }, [call.callState]);

    return (
        <div className="fixed inset-0 bg-[#070710] flex items-center justify-center z-50">
            <div className="text-center flex flex-col items-center gap-4">
                <SpinnerCenter text="Đang chuẩn bị cuộc gọi..." />
                <p className="text-[#666] font-body text-xs mt-2 animate-pulse">
                    Vui lòng cho phép quyền truy cập Camera/Microphone nếu được yêu cầu.
                </p>
            </div>
        </div>
    );
}
