import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useChat } from '../../hooks/useMessages';
import { useCallContext } from '../../contexts/CallContext';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';
import { useToast } from '../../components/ui/Toast';
import { useTheme } from '../../contexts/ThemeContext';
import { getStoredUser } from '../../utils/helpers';
import { SpinnerCenter } from '../../components/ui/Spinner';
import MessageBubble from './MessageBubble';
import MessageInput from './MessageInput';
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
            <div className="rounded-2xl rounded-bl-sm px-4 py-3 flex gap-1 items-center" style={{ background: 'var(--vt-msg-theirs)' }}>
                {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full"
                        style={{ background: 'var(--vt-text-disabled)', animation: `bounce 1.2s ease-in-out ${i * 0.2}s infinite` }} />
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
        <div className="flex items-center gap-2 px-4 py-2.5" style={{ background: 'var(--color-surface)', borderBottom: '1px solid var(--vt-divider)' }}>
            <SearchSmIcon size={13} color="var(--vt-text-bright)" />
            <input
                autoFocus
                type="text"
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Tìm trong cuộc trò chuyện..."
                className="flex-1 bg-transparent border-none outline-none text-[13px] font-body"
                style={{ color: 'var(--vt-text-bright)' }}
            />
            {loading && <div className="w-3.5 h-3.5 rounded-full border-2 border-[var(--vt-accent)]/30 border-t-[var(--vt-accent)] animate-spin shrink-0" />}
            {results.length > 0 && (
                <span className="text-[10px] font-body shrink-0" style={{ color: 'var(--vt-text-ghost)' }}>
                    {idx + 1}/{results.length}
                </span>
            )}
            <button onClick={() => navigate(-1)} disabled={results.length === 0}
                className="bg-transparent border-none cursor-pointer hover:text-[var(--vt-text-bright)] transition-colors disabled:opacity-30 p-0.5"
                style={{ color: 'var(--vt-text-disabled)' }}>
                <ChevronUpIcon size={13} />
            </button>
            <button onClick={() => navigate(1)} disabled={results.length === 0}
                className="bg-transparent border-none cursor-pointer hover:text-[var(--vt-text-bright)] transition-colors disabled:opacity-30 p-0.5"
                style={{ color: 'var(--vt-text-disabled)' }}>
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
    const { isDark } = useTheme();
    const me = getStoredUser();
    const {
        messages, loading, sending, isTyping, error,
        send, recall, react, unreact,
        emitTyping, emitStopTyping,
        partnerId: fallbackPartnerId,
    } = useChat(partnerUsername);

    // Online status tracking
    const activePartnerId = partnerInfo?.partnerId || fallbackPartnerId;
    const partnerIds = activePartnerId ? [activePartnerId] : [];
    const { isOnline, formatLastSeen } = useOnlineStatus(partnerIds);
    const partnerOnline = activePartnerId ? isOnline(activePartnerId) : false;
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

    // Call hook global
    const call = useCallContext();
    const getCallUrl = (type) => {
        if (!activePartnerId) return '#';
        const partnerName = partnerInfo?.partnerFullname || partnerInfo?.fullName || partnerInfo?.username || partnerUsername;
        const partnerAvatar = partnerInfo?.partnerAvatar || partnerInfo?.anh_dai_dien || '';
        return `/call/active?mode=outbound&type=${type}&partnerId=${activePartnerId}&partnerName=${encodeURIComponent(partnerName)}&partnerAvatar=${encodeURIComponent(partnerAvatar)}&partnerUsername=${partnerUsername}`;
    };

    const handleStartCall = (type) => {
        if (!activePartnerId) return;
        if (call.callState !== 'idle') return;
        const callUrl = getCallUrl(type);
        console.log('[ChatWindow] Redialing, opening call in standalone window:', callUrl);
        const w = window.open(callUrl, '_blank', 'width=1000,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes');
        if (w) w.focus();
    };

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

    return (
        <div className="flex-1 flex flex-col overflow-hidden relative">

            {/* ── Header ── */}
            <div className="flex items-center gap-3 px-5 py-3.5 shrink-0"
                style={{ borderBottom: '1px solid var(--vt-divider)', background: isDark ? '#0d0d18' : '#fafafe' }}>
                {/* Back (mobile) */}
                <button onClick={onBack}
                    className="bg-transparent border-none cursor-pointer hover:text-white transition-colors mr-1 md:hidden"
                    style={{ color: 'var(--vt-text-disabled)' }}>
                    <BackChevronIcon size={16} />
                </button>

                <MsgAvatar user={partnerInfo || { partnerUsername }} size="md"  />

                <div className="flex-1 min-w-0">
                    <p className="font-semibold text-[14px] font-body m-0 leading-tight" style={{ color: 'var(--vt-text-bright)' }}>
                        {partnerInfo?.partnerFullname || partnerUsername}
                    </p>
                    <p className={`text-[11px] font-body m-0 flex items-center gap-1 ${partnerOnline ? 'text-emerald-400' : ''}`}
                        style={{ color: partnerOnline ? undefined : 'var(--vt-text-disabled)' }}>
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
                        className={`w-9 h-9 rounded-full flex items-center justify-center border-none cursor-pointer transition-all bg-transparent`}
                        style={{ color: showSearch ? 'var(--vt-accent)' : 'var(--vt-text-disabled)', background: showSearch ? 'var(--vt-hover)' : 'transparent' }}
                        onMouseEnter={(e) => { if (!showSearch) e.currentTarget.style.color = 'var(--vt-text-bright)'; }}
                        onMouseLeave={(e) => { if (!showSearch) e.currentTarget.style.color = 'var(--vt-text-disabled)'; }}
                        title="Tìm kiếm tin nhắn"
                    >
                        <SearchSmIcon size={15} color="currentColor" />
                    </button>

                    {/* Voice call */}
                    <a
                        href={getCallUrl('voice')}
                        onClick={(e) => {
                            e.preventDefault();
                            if (!activePartnerId || call.callState !== 'idle') return;
                            const callUrl = getCallUrl('voice');
                            console.log('[ChatWindow] Opening voice call in standalone window:', callUrl);
                            const w = window.open(callUrl, '_blank', 'width=1000,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes');
                            if (w) w.focus();
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer transition-all bg-transparent ${(!activePartnerId || call.callState !== 'idle') ? 'opacity-30 pointer-events-none' : ''}`}
                        style={{ color: 'var(--vt-text-caption)', textDecoration: 'none' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--vt-hover)'; e.currentTarget.style.color = 'var(--vt-text-bright)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--vt-text-caption)'; }}
                        title="Gọi thoại"
                    >
                        <PhoneCallIcon size={20} color="currentColor" />
                    </a>

                    {/* Video call */}
                    <a
                        href={getCallUrl('video')}
                        onClick={(e) => {
                            e.preventDefault();
                            if (!activePartnerId || call.callState !== 'idle') return;
                            const callUrl = getCallUrl('video');
                            console.log('[ChatWindow] Opening video call in standalone window:', callUrl);
                            const w = window.open(callUrl, '_blank', 'width=1000,height=800,menubar=no,toolbar=no,location=no,status=no,resizable=yes');
                            if (w) w.focus();
                        }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center border-none cursor-pointer transition-all bg-transparent ${(!activePartnerId || call.callState !== 'idle') ? 'opacity-30 pointer-events-none' : ''}`}
                        style={{ color: 'var(--vt-text-caption)', textDecoration: 'none' }}
                        onMouseEnter={(e) => { e.currentTarget.style.background = 'var(--vt-hover)'; e.currentTarget.style.color = 'var(--vt-text-bright)'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--vt-text-caption)'; }}
                        title="Gọi video"
                    >
                        <VideoCallIcon size={20} color="currentColor" />
                    </a>
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
                    <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: 'var(--vt-text-ghost)' }}>
                        <p className="text-[13px] font-body text-center">
                            Bắt đầu cuộc trò chuyện với <span style={{ color: 'var(--vt-text-bright)' }}>@{partnerUsername}</span>
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
                                        onCallClick={(type) => handleStartCall(type)}
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
        </div>
    );
}
