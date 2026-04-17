import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import PageLayout from '../components/layout/PageLayout/PageLayout';
import { useInbox, useChat } from '../hooks/useMessages';
import { formatTimeAgo } from '../utils/formatters';
import { getStoredUser } from '../utils/helpers';
import { SpinnerCenter } from '../components/ui/Spinner';

/* ── Avatar helper ── */
function MsgAvatar({ user = {}, size = 'md', online = false }) {
    const sz = size === 'sm' ? 'w-8 h-8 text-[10px]' : size === 'lg' ? 'w-12 h-12 text-sm' : 'w-10 h-10 text-[11px]';
    const initials = user.initials || user.partnerInitials || (user.partnerFullname || user.fullName || 'U').charAt(0).toUpperCase();
    const avatar = user.avatar || user.partnerAvatar || user.anh_dai_dien;
    return (
        <div className="relative shrink-0">
            <div className={`${sz} rounded-full bg-gradient-to-br from-[#ff2d78] to-[#ff6b35] flex items-center justify-center font-bold text-white overflow-hidden`}>
                {avatar
                    ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                    : initials}
            </div>
            {online && <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-400 rounded-full border-2 border-[#111118]" />}
        </div>
    );
}

/* ── ConversationItem ── */
function ConversationItem({ conv, active, onClick, myId }) {
    const isUnread = conv.unreadCount > 0;
    const isMine = String(conv.lastSenderId) === String(myId);

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-none cursor-pointer border-b border-[#1a1a2a] last:border-0
                ${active ? 'bg-[#ff2d78]/8' : 'bg-transparent hover:bg-white/[0.03]'}`}
        >
            <MsgAvatar user={conv} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <span className={`text-[13px] font-body truncate ${isUnread ? 'text-white font-semibold' : 'text-[#ccc] font-medium'}`}>
                        {conv.partnerFullname || conv.partnerUsername}
                    </span>
                    <span className="text-[10px] text-[#444] font-body shrink-0 ml-2">
                        {conv.lastTime ? formatTimeAgo(conv.lastTime) : ''}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className={`text-[12px] font-body truncate max-w-[160px] ${isUnread ? 'text-[#aaa]' : 'text-[#555]'}`}>
                        {isMine ? <span className="text-[#444]">Bạn: </span> : null}
                        {conv.lastContent}
                    </span>
                    {isUnread && (
                        <span className="shrink-0 ml-2 min-w-[18px] h-[18px] bg-[#ff2d78] rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1">
                            {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                        </span>
                    )}
                </div>
            </div>
        </button>
    );
}

/* MessageBubble  */
function MessageBubble({ msg, isMine, showAvatar, prevIsMine }) {
    return (
        <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} ${prevIsMine === isMine ? 'mt-0.5' : 'mt-4'}`}>
            {/* Avatar người nhận */}
            {!isMine && (
                <div className="w-6 shrink-0">
                    {showAvatar && <MsgAvatar user={msg.sender} size="sm" />}
                </div>
            )}
            <div className={`flex flex-col gap-0.5 max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                <div
                    className={`px-4 py-2.5 rounded-2xl text-[14px] font-body leading-relaxed break-words
                        ${isMine
                            ? 'bg-gradient-to-br from-[#ff2d78] to-[#e0266b] text-white rounded-br-sm'
                            : 'bg-[#1e1e2e] text-[#eee] rounded-bl-sm'
                        }
                        ${msg.pending ? 'opacity-60' : 'opacity-100'}
                    `}
                    style={{ transition: 'opacity 0.2s' }}
                >
                    {msg.content}
                </div>
                {showAvatar && (
                    <span className="text-[10px] text-[#444] font-body px-1">
                        {formatTimeAgo(msg.createdAt)}
                    </span>
                )}
            </div>
        </div>
    );
}

/*  TypingIndicator  */
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

/* ChatWindow */
function ChatWindow({ partnerUsername, partnerInfo, onBack }) {
    const me = getStoredUser();
    const { messages, loading, sending, isTyping, error, send, emitTyping, emitStopTyping } = useChat(partnerUsername);
    const [input, setInput] = useState('');
    const bottomRef = useRef(null);
    const typingRef = useRef(null);

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isTyping]);

    const handleSend = async () => {
        if (!input.trim()) return;
        const txt = input;
        setInput('');
        clearTimeout(typingRef.current);
        if (partnerInfo?.partnerId) emitStopTyping(partnerInfo.partnerId);
        await send(txt);
    };

    const handleInput = (e) => {
        setInput(e.target.value);
        if (partnerInfo?.partnerId) {
            emitTyping(partnerInfo.partnerId);
            clearTimeout(typingRef.current);
            typingRef.current = setTimeout(() => emitStopTyping(partnerInfo.partnerId), 2000);
        }
    };

    const handleKey = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    if (loading) return (
        <div className="flex-1 flex items-center justify-center">
            <SpinnerCenter text="Đang tải tin nhắn..." />
        </div>
    );

    return (
        <div className="flex-1 flex flex-col overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-3 px-5 py-4 border-b border-[#1a1a2a] shrink-0 bg-[#0d0d18]">
                <button onClick={onBack} className="bg-transparent border-none text-[#555] cursor-pointer hover:text-white transition-colors mr-1 md:hidden">
                    <BackChevron />
                </button>
                <MsgAvatar user={partnerInfo} size="md" />
                <div className="flex-1 min-w-0">
                    <p className="text-white font-semibold text-[14px] font-body m-0 leading-tight">
                        {partnerInfo?.partnerFullname || partnerUsername}
                    </p>
                    <p className="text-[#555] text-[11px] font-body m-0">
                        @{partnerUsername}
                    </p>
                </div>                
            </div>

            {/* Messages */}
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
                            return (
                                <MessageBubble
                                    key={msg.id}
                                    msg={msg}
                                    isMine={isMine}
                                    showAvatar={showAvatar}
                                    prevIsMine={prevIsMine}
                                />
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

            {/* Input */}
            <div className="px-4 py-3.5 border-t border-[#1a1a2a] shrink-0 bg-[#0d0d18]">
                <div className="flex items-end gap-3 bg-[#1a1a2e] border border-[#252535] rounded-2xl px-4 py-2.5 focus-within:border-[#ff2d78]/40 transition-colors">
                    <textarea
                        value={input}
                        onChange={handleInput}
                        onKeyDown={handleKey}
                        placeholder={`Nhắn tin cho @${partnerUsername}...`}
                        rows={1}
                        className="flex-1 bg-transparent border-none outline-none text-white text-[14px] font-body resize-none placeholder:text-[#444] leading-relaxed"
                        style={{ maxHeight: 120, overflowY: 'auto' }}
                    />
                    <button
                        onClick={handleSend}
                        disabled={!input.trim() || sending}
                        className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-all disabled:opacity-30 disabled:cursor-not-allowed shrink-0 mb-0.5"
                        style={{
                            background: input.trim() ? 'linear-gradient(135deg,#ff2d78,#ff6b35)' : '#252535',
                        }}
                    >
                        <SendIcon active={!!input.trim()} />
                    </button>
                </div>
            </div>
        </div>
    );
}

/* ── EmptyState ── */
function EmptyState() {
    return (
        <div className="flex-1 flex flex-col items-center justify-center gap-4 text-[#333]">
            <div className="w-20 h-20 rounded-full bg-[#111120] border border-[#1e1e2e] flex items-center justify-center">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#444" strokeWidth="1.3" strokeLinecap="round">
                    <path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z" />
                </svg>
            </div>
            <div className="text-center">
                <p className="text-[#555] text-[14px] font-body font-semibold mb-1">Chọn một cuộc trò chuyện</p>
                <p className="text-[#333] text-[12px] font-body">hoặc bắt đầu chat từ trang hồ sơ của người dùng</p>
            </div>
        </div>
    );
}

/* ── Main MessagesPage ── */
export default function MessagesPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const me = getStoredUser();
    const { conversations, loading, refresh } = useInbox();
    const [activeUsername, setActiveUsername] = useState(searchParams.get('u') || null);
    const [searchQuery, setSearchQuery] = useState('');

    // Khi mở từ URL ?u=username
    useEffect(() => {
        const u = searchParams.get('u');
        if (u) setActiveUsername(u);
    }, [searchParams]);

    const activeConv = conversations.find(c => c.partnerUsername === activeUsername);

    const filtered = searchQuery.trim()
        ? conversations.filter(c =>
            c.partnerUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.partnerFullname?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : conversations;

    return (
        <PageLayout noPadding>
            <div className="flex h-full overflow-hidden">

                {/* ── Sidebar: Danh sách conversations ── */}
                <div className={`flex flex-col border-r border-[#1a1a2a] bg-[#0d0d18] transition-all shrink-0
                    ${activeUsername ? 'w-0 md:w-[320px] overflow-hidden' : 'w-full md:w-[320px]'}`}>

                    {/* Header */}
                    <div className="px-5 py-4 border-b border-[#1a1a2a]">
                        <h2 className="text-white font-bold text-[17px] font-display mb-3">Tin nhắn</h2>
                        {/* Search */}
                        <div className="flex items-center gap-2 bg-[#1a1a2e] rounded-xl px-3.5 py-2.5 border border-[#1e1e2e]">
                            <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#444" strokeWidth="1.2" strokeLinecap="round">
                                <circle cx="5.5" cy="5.5" r="4.5" /><path d="M9 9l3 3" />
                            </svg>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Tìm kiếm cuộc trò chuyện..."
                                className="flex-1 bg-transparent border-none outline-none text-white text-[12px] font-body placeholder:text-[#333]"
                            />
                        </div>
                    </div>

                    {/* List */}
                    <div className="flex-1 overflow-auto">
                        {loading ? (
                            <SpinnerCenter size="sm" />
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#333]">
                                
                                <p className="text-[12px] font-body text-center px-4">
                                    {searchQuery ? `Không tìm thấy "${searchQuery}"` : 'Chưa có tin nhắn nào.\nNhắn tin cho ai đó từ trang hồ sơ của họ!'}
                                </p>
                            </div>
                        ) : (
                            filtered.map(conv => (
                                <ConversationItem
                                    key={conv.partnerId}
                                    conv={conv}
                                    active={activeUsername === conv.partnerUsername}
                                    myId={me?.id}
                                    onClick={() => {
                                        setActiveUsername(conv.partnerUsername);
                                        refresh();
                                    }}
                                />
                            ))
                        )}
                    </div>
                </div>

                {/* ── Chat area ── */}
                <div className={`flex-1 flex flex-col overflow-hidden bg-[#08080f]
                    ${activeUsername ? 'flex' : 'hidden md:flex'}`}>
                    {activeUsername ? (
                        <ChatWindow
                            key={activeUsername}
                            partnerUsername={activeUsername}
                            partnerInfo={activeConv}
                            onBack={() => setActiveUsername(null)}
                        />
                    ) : (
                        <EmptyState />
                    )}
                </div>
            </div>
        </PageLayout>
    );
}

/* ── Icons ── */
function SendIcon({ active }) {
    return (
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none"
            stroke={active ? '#fff' : '#555'} strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M13 1L6 8M13 1L9 13L6 8L1 5L13 1Z" />
        </svg>
    );
}
function BackChevron() {
    return (
        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M10 13L5 8L10 3" />
        </svg>
    );
}
