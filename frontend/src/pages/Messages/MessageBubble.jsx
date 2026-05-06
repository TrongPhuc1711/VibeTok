import React, { useState, useRef, useEffect } from 'react';
import { formatTimeAgo } from '../../utils/formatters';
import { MsgAvatar } from './ConversationSidebar';
import {
    UnsendIcon, CopyIcon, RecalledIcon,
    CheckIcon, DoubleCheckIcon,
    VideoIcon, PhoneIcon,
    CallIncomingArrowIcon, CallOutgoingArrowIcon
} from '../../icons/MessageIcons';

const QUICK_REACTIONS = ['❤️', '😂', '😮', '😢', '👍', '🔥'];

/* Context Menu*/
function ContextMenu({ x, y, isMine, recalled, onRecall, onCopy, onReact, onClose }) {
    const ref = useRef(null);

    useEffect(() => {
        const handler = (e) => {
            if (ref.current && !ref.current.contains(e.target)) onClose();
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, [onClose]);

    // Clamp to viewport
    const left = Math.min(x, window.innerWidth - 200);
    const top  = Math.min(y, window.innerHeight - 220);

    return (
        <div
            ref={ref}
            className="fixed z-50 bg-[#1a1a2e] border border-[#252540] rounded-2xl shadow-2xl overflow-hidden min-w-[180px]"
            style={{ left, top }}
        >
            {/* Quick reactions */}
            <div className="flex items-center gap-1 px-3 py-2.5 border-b border-[#252535]">
                {QUICK_REACTIONS.map(emoji => (
                    <button key={emoji}
                        onClick={() => { onReact(emoji); onClose(); }}
                        className="text-[20px] hover:scale-125 transition-transform cursor-pointer bg-transparent border-none p-0.5 leading-none"
                    >
                        {emoji}
                    </button>
                ))}
            </div>

            {/* Actions */}
            {!recalled && (
                <button onClick={() => { onCopy(); onClose(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-[#ccc] hover:bg-white/5 bg-transparent border-none cursor-pointer text-left transition-colors">
                    <CopyIcon size={14} color="#888" />
                    Sao chép
                </button>
            )}

            {isMine && !recalled && (
                <button onClick={() => { onRecall(); onClose(); }}
                    className="w-full flex items-center gap-2.5 px-4 py-2.5 text-[13px] text-red-400 hover:bg-red-500/10 bg-transparent border-none cursor-pointer text-left transition-colors">
                    <UnsendIcon size={14} color="#f87171" />
                    Thu hồi
                </button>
            )}
        </div>
    );
}

/* ── Reactions Bar ── */
function ReactionsBar({ reactions, myId, onReact, onUnreact }) {
    if (!reactions || reactions.length === 0) return null;

    // Group by emoji
    const grouped = reactions.reduce((acc, r) => {
        if (!acc[r.emoji]) acc[r.emoji] = [];
        acc[r.emoji].push(r);
        return acc;
    }, {});

    const myReaction = reactions.find(r => String(r.userId) === String(myId));

    return (
        <div className="flex items-center gap-1 mt-1 flex-wrap">
            {Object.entries(grouped).map(([emoji, list]) => (
                <button key={emoji}
                    onClick={() => myReaction?.emoji === emoji ? onUnreact() : onReact(emoji)}
                    className={`flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] border transition-all cursor-pointer
                        ${myReaction?.emoji === emoji
                            ? 'bg-[#ff2d78]/20 border-[#ff2d78]/50 text-white'
                            : 'bg-[#1a1a2e] border-[#252535] text-[#aaa] hover:border-[#ff2d78]/40'
                        }`}
                    title={list.map(r => r.username).join(', ')}
                >
                    <span>{emoji}</span>
                    {list.length > 1 && <span>{list.length}</span>}
                </button>
            ))}
        </div>
    );
}

/* ── Highlight Helper ── */
function HighlightedText({ text, highlight }) {
    if (!highlight || !highlight.trim() || !text) return text;
    const parts = text.split(new RegExp(`(${highlight})`, 'gi'));
    return (
        <span>
            {parts.map((part, i) =>
                part.toLowerCase() === highlight.toLowerCase()
                    ? <mark key={i} className="bg-[#fff] text-[#ff2d78] px-0.5 rounded-sm">{part}</mark>
                    : part
            )}
        </span>
    );
}

/* ── Call Bubble Content ── */
function CallBubbleContent({ msg, isMine, onCallClick }) {
    const content = msg.content || '';
    const isVideo = content.toLowerCase().includes('video');
    const typeStr = isVideo ? 'video' : 'thoại';
    const isMissed = content.toLowerCase().includes('nhỡ');
    const isRejected = content.toLowerCase().includes('từ chối');
    
    let title = '';
    let durationStr = '';
    let iconType = ''; // 'incoming' | 'outgoing' | 'missed'
    
    if (isMissed) {
        title = `Cuộc gọi ${typeStr} nhỡ`;
        durationStr = 'Bị nhỡ';
        iconType = 'missed';
    } else if (isRejected) {
        title = `Cuộc gọi ${typeStr} bị từ chối`;
        durationStr = 'Bị từ chối';
        iconType = 'missed';
    } else {
        title = isMine ? `Cuộc gọi ${typeStr} đi` : `Cuộc gọi ${typeStr} đến`;
        iconType = isMine ? 'outgoing' : 'incoming';
        
        // Extract duration e.g. "Cuộc gọi video kết thúc (00:34)"
        const match = content.match(/\((.*?)\)/);
        if (match) {
            const parts = match[1].split(':');
            if (parts.length === 2) {
                durationStr = `${parseInt(parts[0], 10)} phút ${parseInt(parts[1], 10)} giây`;
            } else if (parts.length === 3) {
                durationStr = `${parseInt(parts[0], 10)} giờ ${parseInt(parts[1], 10)} phút ${parseInt(parts[2], 10)} giây`;
            }
        } else {
            durationStr = 'Đã kết thúc';
        }
    }
    
    const iconColor = iconType === 'missed' ? '#ef4444' : '#777';

    return (
        <div className="flex flex-col w-full">
            <div className="p-3 flex flex-col gap-2">
                <span className="text-white font-semibold text-[14px] leading-tight">{title}</span>
                <div className="flex items-center gap-2">
                    <div className="relative w-4 h-4 shrink-0 flex items-center justify-center">
                        {isVideo ? (
                            <VideoIcon size={16} color={iconColor} />
                        ) : (
                            <PhoneIcon size={14} color={iconColor} />
                        )}
                        {iconType === 'incoming' && (
                            <CallIncomingArrowIcon className="absolute -top-0.5 -left-1" size={10} color="#4ade80" />
                        )}
                        {iconType === 'outgoing' && (
                            <CallOutgoingArrowIcon className="absolute -top-0.5 -right-1" size={10} color="#888" />
                        )}
                    </div>
                    <span className="text-[#999] text-[13px] font-normal tracking-wide">{durationStr}</span>
                </div>
            </div>
            <div className="h-[1px] bg-[#2a2c33] w-11/12 mx-auto" />
            <button 
                onClick={(e) => { e.stopPropagation(); onCallClick && onCallClick(isVideo ? 'video' : 'voice'); }}
                className="py-2 text-center text-[#3b82f6] font-medium text-[14px] hover:bg-white/5 transition-colors cursor-pointer border-none bg-transparent w-full"
            >
                Gọi lại
            </button>
        </div>
    );
}

/* ── MessageBubble ── */
export default function MessageBubble({ msg, isMine, showAvatar, prevIsMine, myId, onRecall, onReact, onUnreact, searchQuery, onCallClick }) {
    const [menu, setMenu] = useState(null); // { x, y }
    const [showTime, setShowTime] = useState(false);

    const handleContextMenu = (e) => {
        e.preventDefault();
        setMenu({ x: e.clientX, y: e.clientY });
    };

    const handleCopy = () => {
        if (msg.content) navigator.clipboard.writeText(msg.content).catch(() => {});
    };

    const groupSpacing = prevIsMine === isMine ? 'mt-0.5' : 'mt-4';
    const isCallMsg = !msg.recalled && (msg.type === 'call' || msg.content?.startsWith('Cuộc gọi '));

    let bubbleClass = `rounded-2xl text-[14px] font-body leading-relaxed break-words cursor-default transition-opacity `;
    
    if (isCallMsg) {
        bubbleClass += `bg-[#22242a] border border-[#2a2c33] p-0 w-[200px] shadow-sm `;
        bubbleClass += isMine ? 'rounded-br-sm ' : 'rounded-bl-sm ';
    } else {
        bubbleClass += `px-4 py-2.5 select-text `;
        bubbleClass += isMine
            ? 'bg-gradient-to-br from-[#ff2d78] to-[#e0266b] text-white rounded-br-sm '
            : 'bg-[#1e1e2e] text-[#eee] rounded-bl-sm ';
    }

    bubbleClass += msg.pending ? 'opacity-60 ' : 'opacity-100 ';
    bubbleClass += msg.recalled ? 'opacity-50 ' : '';

    return (
        <>
            <div
                className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'} ${groupSpacing}`}
                onContextMenu={handleContextMenu}
            >
                {/* Avatar */}
                {!isMine && (
                    <div className="w-6 shrink-0">
                        {showAvatar && <MsgAvatar user={msg.sender} size="sm" />}
                    </div>
                )}

                <div className={`flex flex-col gap-0 max-w-[70%] ${isMine ? 'items-end' : 'items-start'}`}>
                    {/* Bubble */}
                    <div
                        onClick={() => setShowTime(s => !s)}
                        className={bubbleClass}
                    >
                        {msg.recalled ? (
                            <span className="flex items-center gap-1.5 italic text-[13px] opacity-70">
                                <RecalledIcon size={13} color="currentColor" />
                                {isMine ? 'Bạn đã thu hồi tin nhắn này' : 'Tin nhắn đã được thu hồi'}
                            </span>
                        ) : isCallMsg ? (
                            <CallBubbleContent msg={msg} isMine={isMine} onCallClick={onCallClick} />
                        ) : (
                            <HighlightedText text={msg.content} highlight={searchQuery} />
                        )}
                    </div>

                    {/* Reactions */}
                    <ReactionsBar
                        reactions={msg.reactions}
                        myId={myId}
                        onReact={(emoji) => onReact?.(msg.id, emoji)}
                        onUnreact={() => onUnreact?.(msg.id)}
                    />

                    {/* Timestamp + read status */}
                    {(showAvatar || showTime) && (
                        <div className={`flex items-center gap-1 px-1 mt-0.5 ${isMine ? 'flex-row-reverse' : ''}`}>
                            <span className="text-[10px] text-[#444] font-body">
                                {formatTimeAgo(msg.createdAt)}
                            </span>
                            {isMine && !msg.pending && (
                                msg.read
                                    ? <DoubleCheckIcon size={12} color="#ff2d78" />
                                    : <CheckIcon size={12} color="#555" />
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Context Menu */}
            {menu && (
                <ContextMenu
                    x={menu.x} y={menu.y}
                    isMine={isMine}
                    recalled={msg.recalled}
                    onRecall={() => onRecall?.(msg.id)}
                    onCopy={handleCopy}
                    onReact={(emoji) => onReact?.(msg.id, emoji)}
                    onClose={() => setMenu(null)}
                />
            )}
        </>
    );
}
