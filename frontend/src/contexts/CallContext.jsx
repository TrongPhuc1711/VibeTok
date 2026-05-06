import React, { createContext, useContext } from 'react';
import { useCall } from '../hooks/useCall';
import IncomingCallBanner from '../pages/Messages/IncomingCallBanner';
import CallOverlay from '../pages/Messages/CallOverlay';

const CallContext = createContext(null);

export const useCallContext = () => {
    return useContext(CallContext);
};

export const CallProvider = ({ children }) => {
    const call = useCall();

    const isCallActive = ['calling', 'ringing', 'connected', 'ended'].includes(call.callState);

    return (
        <CallContext.Provider value={call}>
            {children}
            {call.incomingCall && (
                <IncomingCallBanner
                    incomingCall={call.incomingCall}
                    onAccept={call.acceptCall}
                    onReject={call.rejectCall}
                />
            )}
            {isCallActive && (
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
                />
            )}
        </CallContext.Provider>
    );
};
