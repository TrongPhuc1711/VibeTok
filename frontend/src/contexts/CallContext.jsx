import React, { createContext, useContext, useEffect } from 'react';
import { useCall } from '../hooks/useCall';
import IncomingCallBanner from '../pages/Messages/IncomingCallBanner';
import CallOverlay from '../pages/Messages/CallOverlay';

const CallContext = createContext(null);

export const useCallContext = () => {
    return useContext(CallContext);
};

export const CallProvider = ({ children }) => {
    const call = useCall();

    useEffect(() => {
        const handleStorage = (e) => {
            if (e.key === 'vibetok_call_action') {
                try {
                    const data = JSON.parse(e.newValue);
                    if (data && (data.action === 'accept' || data.action === 'reject')) {
                        // Clear incoming call banner on this tab
                        call.setIncomingCall(null);
                    }
                } catch (err) {
                    console.error('Failed to parse call action from storage:', err);
                }
            }
        };
        window.addEventListener('storage', handleStorage);
        return () => window.removeEventListener('storage', handleStorage);
    }, [call]);

    const isCallActive = ['calling', 'ringing', 'connected', 'ended'].includes(call.callState);
    const isCallPage = window.location.pathname === '/call/active';

    return (
        <CallContext.Provider value={call}>
            {children}
            {call.incomingCall && (
                <IncomingCallBanner
                    incomingCall={call.incomingCall}
                    onAccept={() => {
                        console.log('[CallContext] onAccept clicked, preparing storage and opening tab');
                        // 1. Save incoming call to localStorage
                        localStorage.setItem('vibetok_incoming_call', JSON.stringify(call.incomingCall));
                        // 2. Broadcast accept action to other tabs
                        localStorage.setItem('vibetok_call_action', JSON.stringify({ action: 'accept', timestamp: Date.now() }));
                        // 3. Open new tab/window for the call
                        window.open('/call/active?mode=inbound', '_blank');
                        // 4. Clear incoming call banner on this tab
                        call.setIncomingCall(null);
                    }}
                    onReject={() => {
                        // 1. Call rejectCall() which emits socket event
                        call.rejectCall();
                        // 2. Broadcast reject action to other tabs
                        localStorage.setItem('vibetok_call_action', JSON.stringify({ action: 'reject', timestamp: Date.now() }));
                    }}
                />
            )}
            {isCallActive && isCallPage && (
                <CallOverlay
                    callState={call.callState}
                    callType={call.callType}
                    partnerInfo={call.currentPartnerInfo}
                    formattedDuration={call.formattedDuration}
                    isMuted={call.isMuted}
                    isCameraOff={call.isCameraOff}
                    localVideoRef={call.localVideoRef}
                    remoteVideoRef={call.remoteVideoRef}
                    onEnd={call.endCall}
                    onToggleMute={call.toggleMute}
                    onToggleCamera={call.toggleCamera}
                    /* Screen sharing */
                    isScreenSharing={call.isScreenSharing}
                    onToggleScreenShare={call.toggleScreenShare}
                    /* Watch Together */
                    watchTogether={call.watchTogether}
                    onStartWatchTogether={call.startWatchTogether}
                    onSyncWatchTogether={call.syncWatchTogether}
                    onEndWatchTogether={call.endWatchTogether}
                    watchVideoRef={call.setWatchVideoRef}
                    /* Video element refs for Watch Together expanded PiP */
                    localVideoElementRef={call.localVideoElementRef}
                    remoteVideoElementRef={call.remoteVideoElementRef}
                />
            )}
        </CallContext.Provider>
    );
};

