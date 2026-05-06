import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../../hooks/useMessages';
import { useCall } from '../../hooks/useCall';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useToast } from '../../components/ui/Toast';
import { getStoredUser } from '../../utils/helpers';
import { SpinnerCenter } from '../../components/ui/Spinner';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
import CallOverlay from './CallOverlay';
import { MsgAvatar } from './ConversationSidebar';
import {
    BackChevronIcon, PhoneCallIcon, VideoCallIcon,
    SearchSmIcon, CloseIcon, ChevronUpIcon, ChevronDownIcon,
} from '../../icons/MessageIcons';
import * as msgSvc from '../../services/messageService';

/* ── Typing Indicator ── */
function TypingIndicator() {
    return (
        <div className="flex items-end gap-2 mt-4">
            <div className="w-6 shrink-0" />
            <div className="bg-[#1e1e2e] rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center">
                {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-[#555]"
                        style={{ animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
                ))}
                <style>{`@keyframes bounce{0%,60%,100%{transform:translateY(0)}30%{transform:translateY(-5px)}}`}</style>
            </div>
        </div>
    );
}

/* ── In-chat Search Bar ── */
function ChatSearchBar({ username, query, setQuery, onResults, onClose }) {
    const [results, setResults] = useState([]);
    const [idx, setIdx] = useState(0);
    const [loading, setLoading] = useState(false);
    const timerRef = useRef(null);

    useEffect(() => {
        if (!query.trim()) { setResults([]); onResults([]); return; }
        clearTimeout(timerRef.current);
        timerRef.current = setTimeout(async () => {
            setLoading(true);
            try {
                const res = await msgSvc.searchMessages(username, query);
                setResults(res);
                onResults(res);
                setIdx(0);
            } catch { setResults([]); }
            finally { setLoading(false); }
        }, 400);
        return () => clearTimeout(timerRef.current);
    }, [query, username, onResults]);

    const navigate = (dir) => {
        if (results.length === 0) return;
        setIdx(i => {
            const next = (i + dir + results.length) % results.length;
            onResults(results, next);
            return next;
        });
    };

    return (
        <div className="flex items-center gap-2 px-4 py-2.5 bg-[#0d0d18] border-b border-[#1a1a2a]">
            <SearchSmIcon size={13} color="#555" />
            <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Tìm trong cuộc trò chuyện..."
                className="flex-1 bg-transparent border-none outline-none text-white text-[13px] font-body placeholder:text-[#333]"
            />
            {loading && <div className="w-3.5 h-3.5 rounded-full border-2 border-[#ff2d78]/30 border-t-[#ff2d78] animate-spin shrink-0" />}
            {results.length > 0 && (
                <span className="text-[10px] text-[#444] font-body shrink-0">
                    {idx + 1}/{results.length}
                </span>
            )}
            <button onClick={() => navigate(-1)} disabled={results.length === 0}
                className="bg-transparent border-none cursor-pointer text-[#555] hover:text-white transition-colors disabled:opacity-30 p-0.5">
                <ChevronUpIcon size={13} />
            </button>
            <button onClick={() => navigate(1)} disabled={results.length === 0}
                className="bg-transparent border-none cursor-pointer text-[#555] hover:text-white transition-colors disabled:opacity-30 p-0.5">
                <ChevronDownIcon size={13} />
            </button>
            <button onClick={onClose}
                className="bg-transparent border-none cursor-pointer text-[#555] hover:text-[#ff2d78] transition-colors p-0.5 ml-1">
                <CloseIcon size={13} />
            </button>
        </div>
    );
}

/* ── ChatWindow ── */
export default function ChatWindow({ partnerUsername, partnerInfo, onBack }) {
    const me = getStoredUser();
    const {
        messages, loading, sending, isTyping, error,
        send, recall, react, unreact,
        emitTyping, emitStopTyping,
    } = useChat(partnerUsername);

    // Online status tracking
    const partnerIds = partnerInfo?.partnerId ? [partnerInfo.partnerId] : [];
    const { isOnline, formatLastSeen } = useOnlineStatus(partnerIds);
    const partnerOnline = partnerInfo?.partnerId ? isOnline(partnerInfo.partnerId) : false;
    const partnerStatus = partnerInfo?.partnerId ? formatLastSeen(partnerInfo.partnerId) : '';

    const { showInfo } = useToast();
    const prevOnlineRef = useRef(partnerOnline);

    useEffect(() => {
        if (prevOnlineRef.current && !partnerOnline) {
            showInfo('Ngoại tuyến', `${partnerInfo?.partnerFullname || partnerUsername} vừa mới offline.`);
        } else if (!prevOnlineRef.current && partnerOnline) {
            // Optional: Notify when online
            // showInfo('Trực tuyến', `${partnerInfo?.partnerFullname || partnerUsername} đang online.`);
        }
        prevOnlineRef.current = partnerOnline;
    }, [partnerOnline, partnerInfo, partnerUsername, showInfo]);

    const [input, setInput] = useState('');
    const [showSearch, setShowSearch] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState([]);
    const [highlightedId, setHighlightedId] = useState(null);

    const bottomRef   = useRef(null);
    const typingRef   = useRef(null);
    const msgRefs     = useRef({});

    // Call hook
    const call = useCall({
        partnerId: partnerInfo?.partnerId,
        partnerInfo,
        onCallLog: (msg) => send(msg, 'call'),
        onCallEnd: () => {},
    });

    // Auto scroll
    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    // Input handlers
    const handleSend = async () => {
        if (!input.trim()) return;
        const txt = input;
        setInput('');
        clearTimeout(typingRef.current);
        if (partnerInfo?.partnerId) emitStopTyping(partnerInfo.partnerId);
        await send(txt);
    };

    const handleInputChange = (val) => {
        setInput(val);
        if (partnerInfo?.partnerId) {
            emitTyping(partnerInfo.partnerId);
            clearTimeout(typingRef.current);
            typingRef.current = setTimeout(() => emitStopTyping(partnerInfo.partnerId), 2000);
        }
    };

    // Search results → scroll to highlighted message
    const handleSearchResults = useCallback((results, activeIdx = 0) => {
        setSearchResults(results);
        if (results.length > 0) {
            const target = results[activeIdx];
            setHighlightedId(String(target.id));
            const el = msgRefs.current[String(target.id)];
            el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        } else {
            setHighlightedId(null);
        }
    }, []);

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <SpinnerCenter text="Đang tải tin nhắn..." />
        </div>
    );

    const isCallActive = ['calling', 'ringing', 'connected', 'ended'].includes(call.callState);

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">

            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-5 py-3.5 border-b border-[#1a1a2a] shrink-0 bg-[#0d0d18]">
                {/* Back (mobile) */}
                <button onClick={onBack}
                    className="bg-transparent border-none text-[#555] cursor-pointer hover:text-white transition-colors mr-1 md:hidden">
                    <BackChevronIcon size={16} />
                </button>

                <MsgAvatar user={partnerInfo || { partnerUsername }} size="md" online={partnerOnline} />

                <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-[14px] font-body m-0 leading-tight">
                        {partnerInfo?.partnerFullname || partnerUsername}
                    </p>
                    <p className={`text-[11px] font-body m-0 flex items-center gap-1 ${partnerOnline ? 'text-emerald-400' : 'text-[#555]'}`}>
                        {isTyping ? (
                            <span className="text-[#ff2d78]">Đang nhập...</span>
                        ) : partnerStatus ? (
                            <>
                                {partnerOnline && (
                                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400" 
                                        style={{ boxShadow: '0 0 4px rgba(52,211,153,0.6)' }} />
                                )}
                                {partnerStatus}
                            </>
                        ) : (
                            <>@{partnerUsername}</>
                        )}
                    </p>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1">
                    {/* Search in chat */}
                    <button
                        onClick={() => setShowSearch(s => !s)}
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-all
                            ${showSearch ? 'bg-[#ff2d78]/20 text-[#ff2d78]' : 'bg-transparent text-[#555] hover:bg-white/5 hover:text-white'}`}
                        title="Tìm kiếm tin nhắn"
                    >
                        <SearchSmIcon size={15} color="currentColor" />
                    </button>

                    {/* Voice call */}
                    <button
                        onClick={() => call.startCall('voice')}
                        disabled={isCallActive}
                        className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer text-[#ccc] hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 bg-transparent"
                        title="Gọi thoại"
                    >
                        <PhoneCallIcon size={20} color="currentColor" />
                    </button>

                    {/* Video call */}
                    <button
                        onClick={() => call.startCall('video')}
                        disabled={isCallActive}
                        className="w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer text-[#ccc] hover:bg-white/10 hover:text-white transition-all disabled:opacity-30 bg-transparent"
                        title="Gọi video"
                    >
                        <VideoCallIcon size={20} color="currentColor" />
                    </button>
                </div>
            </div>

            {/* ── Search bar (inline) ── */}
            {showSearch && (
                <ChatSearchBar
                    username={partnerUsername}
                    query={searchQuery}
                    setQuery={setSearchQuery}
                    onResults={handleSearchResults}
                    onClose={() => { setShowSearch(false); setHighlightedId(null); setSearchResults([]); setSearchQuery(''); }}
                />
            )}

            {/* ── Messages ── */}
            <div className="flex-1 overflow-auto px-5 py-4" style={{ scrollBehavior: 'smooth' }}>
                {messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-3 text-[#444]">
                        <p className="text-[13px] font-body text-center">
                            Bắt đầu cuộc trò chuyện với <span className="text-white">@{partnerUsername}</span>
                        </p>
                    </div>
                ) : (
                    <>
                        {messages.map((msg, i) => {
                            const isMine = String(msg.senderId) === String(me?.id);
                            const prevMsg = messages[i - 1];
                            const nextMsg = messages[i + 1];
                            const prevIsMine = prevMsg ? String(prevMsg.senderId) === String(me?.id) : null;
                            const nextIsMine = nextMsg ? String(nextMsg.senderId) === String(me?.id) : null;
                            const showAvatar = !nextMsg || nextIsMine !== isMine;
                            const isHighlighted = highlightedId === String(msg.id);

                            return (
                                <div
                                    key={msg.id}
                                    ref={el => { msgRefs.current[String(msg.id)] = el; }}
                                    className={`transition-all rounded-xl ${isHighlighted ? 'bg-[#ff2d78]/10 px-2 -mx-2' : ''}`}
                                >
                                    <MessageBubble
                                        msg={msg}
                                        isMine={isMine}
                                        showAvatar={showAvatar}
                                        prevIsMine={prevIsMine}
                                        myId={me?.id}
                                        onRecall={recall}
                                        onReact={react}
                                        onUnreact={unreact}
                                        searchQuery={searchQuery}
                                        onCallClick={(type) => call.startCall(type)}
                                    />
                                </div>
                            );
                        })}
                        {isTyping && <TypingIndicator />}
                    </>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Error */}
            {error && (
                <p className="text-[#ff2d78] text-[11px] text-center font-body px-4 pb-1">{error}</p>
            )}

            {/* ── Input ── */}
            <MessageInput
                value={input}
                onChange={handleInputChange}
                onSend={handleSend}
                partnerUsername={partnerUsername}
                disabled={sending}
            />

            {/* ── Call Overlay ── */}
            {isCallActive && (
                <CallOverlay
                    callState={call.callState}
                    callType={call.callType}
                    partnerInfo={partnerInfo}
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
        </div>
    );
}
