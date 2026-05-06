import React, { useMemo } from 'react';
import { formatTimeAgo } from '../../utils/formatters';
import { SearchSmIcon } from '../../icons/MessageIcons';
import { useOnlineStatus } from '../../hooks/useOnlineStatus';

/* ── Avatar ── */
export function MsgAvatar({ user = {}, size = 'md', online = false }) {
    const sz = size === 'sm'
        ? 'w-8 h-8 text-[10px]'
        : size === 'lg'
            ? 'w-12 h-12 text-sm'
            : 'w-10 h-10 text-[11px]';
    const dotSz = size === 'sm'
        ? 'w-2 h-2 border'
        : size === 'lg'
            ? 'w-3.5 h-3.5 border-[2.5px]'
            : 'w-2.5 h-2.5 border-2';
    const nameStr = user.partnerFullname || user.fullName || user.partnerUsername || user.username || user.ten_dang_nhap || 'U';
    const initials = user.initials || user.partnerInitials || nameStr.charAt(0).toUpperCase();
    const avatar = user.avatar || user.partnerAvatar || user.anh_dai_dien;

    return (
        <div className="relative shrink-0">
            <div className={`${sz} rounded-full bg-gradient-to-br from-[#ff2d78] to-[#ff6b35] flex items-center justify-center font-bold text-white overflow-hidden`}>
                {avatar ? <img src={avatar} alt="" className="w-full h-full object-cover" /> : initials}
            </div>
            {online && (
                <span className={`absolute bottom-0 right-0 ${dotSz} bg-emerald-400 rounded-full border-[#111118]`}
                    style={{ boxShadow: '0 0 4px rgba(52,211,153,0.5)' }} />
            )}
        </div>
    );
}

/* ── ConversationItem ── */
function ConversationItem({ conv, active, onClick, myId, isOnline, lastSeenText }) {
    const isUnread = conv.unreadCount > 0;
    const isMine = String(conv.lastSenderId) === String(myId);
    const lastText = conv.lastRecalled
        ? (isMine ? 'Bạn đã thu hồi một tin nhắn' : 'Tin nhắn đã được thu hồi')
        : conv.lastContent;

    return (
        <button
            onClick={onClick}
            className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition-all border-none cursor-pointer border-b border-[#1a1a2a] last:border-0
                ${active ? 'bg-[#ff2d78]/10' : 'bg-transparent hover:bg-white/[0.03]'}`}
        >
            <MsgAvatar user={conv} online={isOnline} />
            <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                        <span className={`text-[13px] text-white font-body truncate ${isUnread ? 'font-semibold' : 'font-medium'}`}>
                            {conv.partnerFullname || conv.partnerUsername}
                        </span>
                        {isOnline && (
                            <span className="shrink-0 text-[9px] text-emerald-400 font-body font-medium">●</span>
                        )}
                    </div>
                    <span className="text-[10px] text-[#888] font-body shrink-0 ml-2">
                        {conv.lastTime ? formatTimeAgo(conv.lastTime) : ''}
                    </span>
                </div>
                <div className="flex items-center justify-between">
                    <span className={`text-[12px] font-body truncate max-w-[160px] italic-if-recalled
                        ${conv.lastRecalled ? 'text-[#555] italic' : isUnread ? 'text-[#aaa]' : 'text-[#888]'}`}>
                        {!conv.lastRecalled && isMine && <span className="text-[#888]">Bạn: </span>}
                        {lastText || ''}
                    </span>
                    <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        {!isOnline && lastSeenText && (
                            <span className="text-[9px] text-[#888] font-body truncate max-w-[80px]" title={lastSeenText}>
                                {lastSeenText}
                            </span>
                        )}
                        {isUnread && (
                            <span className="min-w-[18px] h-[18px] bg-[#ff2d78] rounded-full text-white text-[9px] font-bold flex items-center justify-center px-1">
                                {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                            </span>
                        )}
                    </div>
                </div>
            </div>
        </button>
    );
}

/* ── ConversationSidebar ── */
export default function ConversationSidebar({
    conversations,
    loading,
    activeUsername,
    myId,
    onSelect,
    searchQuery,
    onSearchChange,
}) {
    const filtered = searchQuery.trim()
        ? conversations.filter(c =>
            c.partnerUsername?.toLowerCase().includes(searchQuery.toLowerCase()) ||
            c.partnerFullname?.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : conversations;

    // Lấy danh sách partnerId để theo dõi online status
    const partnerIds = useMemo(
        () => conversations.map(c => c.partnerId).filter(Boolean),
        [conversations]
    );
    const { isOnline, formatLastSeen } = useOnlineStatus(partnerIds);

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="px-5 py-4 border-b border-[#1a1a2a] shrink-0">
                <h2 className="text-white font-bold text-[17px] font-display mb-3">Tin nhắn</h2>
                <div className="flex items-center gap-2 bg-[#1a1a2e] rounded-xl px-3.5 py-2.5 border border-[#1e1e2e] focus-within:border-[#ff2d78]/30 transition-colors">
                    <SearchSmIcon size={13} color="#444" />
                    <input
                        type="text"
                        value={searchQuery}
                        onChange={e => onSearchChange(e.target.value)}
                        placeholder="Tìm kiếm..."
                        className="flex-1 bg-transparent border-none outline-none text-white text-[12px] font-body placeholder:text-[#333]"
                    />
                </div>
            </div>

            {/* List */}
            <div className="flex-1 overflow-auto">
                {loading ? (
                    <div className="flex items-center justify-center py-10">
                        <div className="w-5 h-5 rounded-full border-2 border-[#ff2d78]/30 border-t-[#ff2d78] animate-spin" />
                    </div>
                ) : filtered.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-10 gap-2 text-[#333]">
                        <p className="text-[12px] font-body text-center px-4">
                            {searchQuery ? `Không tìm thấy "${searchQuery}"` : 'Chưa có tin nhắn nào.'}
                        </p>
                    </div>
                ) : (
                    filtered.map(conv => (
                        <ConversationItem
                            key={conv.partnerId}
                            conv={conv}
                            active={activeUsername === conv.partnerUsername}
                            myId={myId}
                            isOnline={isOnline(conv.partnerId)}
                            lastSeenText={formatLastSeen(conv.partnerId)}
                            onClick={() => onSelect(conv.partnerUsername)}
                        />
                    ))
                )}
            </div>
        </div>
    );
}
