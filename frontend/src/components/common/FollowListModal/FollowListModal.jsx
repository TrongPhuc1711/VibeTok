import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { followUser, unfollowUser } from '../../../services/userService';
import { getStoredUser } from '../../../utils/helpers';
import { formatCount } from '../../../utils/formatters';
import api from '../../../api/api';

/**
 * FollowListModal — modal kiểu TikTok hiển thị followers / following
 *
 * Props:
 *  username    – string (username của profile đang xem)
 *  type        – 'followers' | 'following'
 *  onClose     – () => void
 *  onTabChange – (type) => void
 */
export default function FollowListModal({ username, type, onClose, onTabChange }) {
    const navigate = useNavigate();
    const me = getStoredUser();

    // Có phải đang xem profile của chính mình không?
    const isMyProfile =
        me && (me.username === username || me.ten_dang_nhap === username);

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [followStates, setFollowStates] = useState({});
    const [loadingStates, setLoadingStates] = useState({});

    const [counts, setCounts] = useState({ followers: 0, following: 0, friends: 0 });

    const fetchList = useCallback(async (t) => {
        setLoading(true);
        setUsers([]);
        try {
            const res = await api.get(`/users/${username}/${t}`, { params: { limit: 50 } });
            const list = res.data.users || [];
            setUsers(list);
            
            setCounts(prev => ({ ...prev, [t]: res.data.total || list.length }));

            // ⭐ KEY FIX:
            // Tab "following" của chính mình → tất cả users đều đang được follow (= true)
            // Vì backend không có verifyToken nên isFollowing luôn false từ API
            // Tab "followers" hoặc xem profile người khác → dùng isFollowing từ API
            const states = {};
            list.forEach(u => {
                if (t === 'following' && isMyProfile) {
                    states[u.id] = true;
                } else if (t === 'friends' && isMyProfile) {
                    states[u.id] = true;
                } else {
                    states[u.id] = u.isFollowing ?? false;
                }
            });
            setFollowStates(states);
        } catch {
            setUsers([]);
        } finally {
            setLoading(false);
        }
    }, [username, isMyProfile]);

    useEffect(() => {
        fetchList(type);
    }, [fetchList, type]);

    // Đóng khi nhấn Escape
    useEffect(() => {
        const handler = (e) => { if (e.key === 'Escape') onClose(); };
        document.addEventListener('keydown', handler);
        return () => document.removeEventListener('keydown', handler);
    }, [onClose]);

    const handleFollowToggle = async (user) => {
        if (!me) return;
        if (loadingStates[user.id]) return;

        const wasFollowing = followStates[user.id];
        // Optimistic update
        setFollowStates(s => ({ ...s, [user.id]: !wasFollowing }));
        setLoadingStates(s => ({ ...s, [user.id]: true }));

        try {
            if (wasFollowing) {
                await unfollowUser(user.username);
            } else {
                await followUser(user.username);
            }
        } catch {
            // Rollback
            setFollowStates(s => ({ ...s, [user.id]: wasFollowing }));
        } finally {
            setLoadingStates(s => ({ ...s, [user.id]: false }));
        }
    };

    const handleGoProfile = (uname) => {
        onClose();
        navigate(`/profile/${uname}`);
    };

    const filtered = search.trim()
        ? users.filter(u =>
            u.username?.toLowerCase().includes(search.toLowerCase()) ||
            u.fullName?.toLowerCase().includes(search.toLowerCase())
        )
        : users;

    const tabs = [
        { key: 'following', label: `Đã follow ${counts.following > 0 ? counts.following : ''}`.trim() },
        { key: 'followers', label: `Follower ${counts.followers > 0 ? counts.followers : ''}`.trim() },
        { key: 'friends', label: `Bạn bè ${counts.friends > 0 ? counts.friends : ''}`.trim() },
    ];

    return (
        <div
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
        >
            <div className="w-full sm:w-[500px] bg-[#111118] rounded-t-2xl sm:rounded-2xl border border-[#1e1e2e] shadow-2xl flex flex-col"
                style={{ maxHeight: '85vh', height: '600px' }}>
                
                {/* Header Profile Title */}
                <div className="relative flex items-center justify-center py-4 border-b border-transparent">
                    <h2 className="text-white text-lg font-bold m-0">{username}</h2>
                    <button
                        onClick={onClose}
                        className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-transparent border-none text-white text-xl cursor-pointer flex items-center justify-center hover:bg-white/10 transition-colors"
                    >
                        ✕
                    </button>
                </div>

                {/* Header tabs */}
                <div className="flex items-center border-b border-[#1e1e2e] relative px-2">
                    {tabs.map(tab => (
                        <button
                            key={tab.key}
                            onClick={() => onTabChange(tab.key)}
                            className={`flex-1 py-3 text-[15px] font-semibold font-body border-none bg-transparent cursor-pointer transition-all relative whitespace-nowrap
                                ${type === tab.key ? 'text-white' : 'text-[#888] hover:text-[#bbb]'}`}
                        >
                            {tab.label}
                            {type === tab.key && (
                                <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white rounded-t" />
                            )}
                        </button>
                    ))}
                </div>

                {/* Search */}
                <div className="px-4 py-3 border-b border-[#1e1e2e]">
                    <div className="flex items-center gap-2.5 bg-[#1a1a26] rounded-xl px-3.5 py-2.5">
                        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#555" strokeWidth="1.3" strokeLinecap="round">
                            <circle cx="6" cy="6" r="4.5" />
                            <path d="M9.5 9.5L13 13" />
                        </svg>
                        <input
                            type="text"
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Tìm kiếm..."
                            className="flex-1 bg-transparent border-none outline-none text-white text-sm font-body placeholder:text-[#444]"
                        />
                        {search && (
                            <button onClick={() => setSearch('')} className="bg-transparent border-none text-[#555] cursor-pointer text-base hover:text-white">×</button>
                        )}
                    </div>
                </div>

                {/* List */}
                <div className="flex-1 overflow-auto">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-12 gap-2 text-[#444]">
                            <span className="text-3xl">
                                {search ? '🔍' : type === 'followers' ? '👤' : '🫂'}
                            </span>
                            <p className="text-sm font-body text-center px-6">
                                {search
                                    ? `Không tìm thấy "${search}"`
                                    : type === 'followers'
                                        ? 'Chưa có ai theo dõi'
                                        : 'Chưa theo dõi ai'
                                }
                            </p>
                        </div>
                    ) : (
                        <div className="py-2">
                            {filtered.map(user => {
                                const isSelf = me && (String(me.id) === String(user.id) || me.username === user.username);
                                const isFollowing = followStates[user.id] ?? user.isFollowing;
                                const isLoadingThis = loadingStates[user.id] ?? false;

                                return (
                                    <div
                                        key={user.id}
                                        className="flex items-center gap-3 px-4 py-3 hover:bg-white/[0.03] transition-colors"
                                    >
                                        {/* Avatar */}
                                        <div
                                            className="w-11 h-11 rounded-full bg-gradient-to-br from-[#ff2d78] to-[#ff6b35] flex items-center justify-center text-sm font-bold text-white shrink-0 cursor-pointer"
                                            onClick={() => handleGoProfile(user.username)}
                                        >
                                            {user.anh_dai_dien ? (
                                                <img src={user.anh_dai_dien} alt={user.username} className="w-full h-full rounded-full object-cover" />
                                            ) : (
                                                user.initials
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div
                                            className="flex-1 min-w-0 cursor-pointer"
                                            onClick={() => handleGoProfile(user.username)}
                                        >
                                            <p className="text-white text-[14px] font-semibold font-body m-0 leading-tight truncate">
                                                {user.fullName || user.username}
                                                {user.isCreator && (
                                                    <span className="ml-1.5 text-[10px] bg-gradient-to-r from-[#ff2d78] to-[#ff6b35] bg-clip-text text-transparent font-bold">✦</span>
                                                )}
                                            </p>
                                            <p className="text-[#666] text-[12px] font-body m-0 leading-tight">
                                                @{user.username}
                                                <span className="mx-1.5 text-[#333]">·</span>
                                                <span className="text-[#555]">{formatCount(user.followers)} followers</span>
                                            </p>
                                        </div>

                                        {/* Follow / Đang follow button */}
                                        {!isSelf && me && (
                                            <button
                                                onClick={() => {
                                                    if (user.isMutual && type === 'friends') {
                                                        // Nếu là tab bạn bè, nút sẽ là "Tin nhắn" -> chuyển sang chat
                                                        onClose();
                                                        navigate(`/messages?u=${user.username}`);
                                                    } else {
                                                        // Ở tab khác, nút là "Bạn bè" -> bấm để huỷ follow
                                                        handleFollowToggle(user);
                                                    }
                                                }}
                                                disabled={isLoadingThis}
                                                className={`shrink-0 text-[14px] font-semibold font-body px-5 py-2 rounded-lg border transition-all cursor-pointer
                                                    disabled:opacity-50 disabled:cursor-not-allowed
                                                    ${isFollowing
                                                        ? (user.isMutual
                                                            ? 'bg-[#333] border-[#333] text-white hover:bg-[#444]'
                                                            : 'bg-[#333] border-[#333] text-white hover:bg-[#444]')
                                                        : 'bg-[#ff2d78] border-[#ff2d78] text-white hover:bg-[#e0266b]'
                                                    }`}
                                            >
                                                {isFollowing 
                                                    ? (user.isMutual 
                                                        ? (type === 'friends' ? 'Tin nhắn' : 'Bạn bè') 
                                                        : 'Đang follow') 
                                                    : (type === 'followers' ? 'Follow lại' : 'Follow')}
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}