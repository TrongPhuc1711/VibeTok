import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../../components/layout/Sidebar/AdminLayout';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import AdminBtn from './components/AdminBtn';
import { BounceDots } from '../../components/ui/Spinner';
import Avatar from '../../components/common/Avatar/avatar';
import { getSharedSocket } from '../../hooks/useMessages';
import {
    getStats, getTopCreators,
    getSearchTrends, getAdminOnlineUsers
} from '../../services/adminService';

const fmt = (n) => {
    n = Number(n) || 0;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
};

/* ── SVG Icons ── */
function SearchTrendIcon() {
    return (
        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#ff2d78" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
            <path d="M11 8v6M8 11h6" />
        </svg>
    );
}

function FireIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="#ff6b35">
            <path d="M12 23c-4.97 0-9-3.8-9-8.5C3 8.35 8.7 3.2 9.5 2.5a1 1 0 0 1 1.6.4c.5 1.5 1.3 3.3 2.4 4.5.3-1.1.8-2.3 1.5-3.3a1 1 0 0 1 1.7.2C18.2 8.4 21 11.8 21 14.5c0 4.7-4.03 8.5-9 8.5zm0-15c-1.8 2.2-3 4.5-3 6.5 0 2.8 2.2 5 5 5s5-2.2 5-5c0-1.8-1.5-4.1-3.2-5.7-.6.7-1.4 1.3-2.3 1.7-.6.3-1.5.1-1.8-.5-.3-.7 0-1.5.3-2z" />
        </svg>
    );
}

function EyeMiniIcon() {
    return (
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
            <circle cx="12" cy="12" r="3" />
        </svg>
    );
}

function HeartMiniIcon() {
    return (
        <svg width="11" height="11" viewBox="0 0 24 24" fill="#ff2d78">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
    );
}

function VideoPlayIcon() {
    return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
            <polygon points="5 3 19 12 5 21 5 3" />
        </svg>
    );
}

export default function DashboardPage() {
    const navigate = useNavigate();
    const [stats, setStats] = useState([]);
    const [creators, setCreators] = useState([]);
    const [searchTrends, setSearchTrends] = useState({ keywords: [], videos: [] });
    const [onlineUsers, setOnlineUsers] = useState([]);
    const [onlineCount, setOnlineCount] = useState(0);
    const [loading, setLoading] = useState(true);
    const [previewVideo, setPreviewVideo] = useState(null);

    useEffect(() => {
        Promise.all([
            getStats().catch(() => []),
            getTopCreators().catch(() => []),
            getSearchTrends(10).catch(() => ({ keywords: [], videos: [] })),
            getAdminOnlineUsers().catch(() => ({ totalOnline: 0, users: [] })),
        ]).then(([s, cr, st, onl]) => {
            setStats(s);
            setCreators(cr);
            setSearchTrends(st || { keywords: [], videos: [] });
            if (onl) {
                setOnlineUsers(onl.users || []);
                setOnlineCount(onl.totalOnline || 0);
            }
        }).finally(() => setLoading(false));
    }, []);

    // ── Realtime Socket Online Status ──
    useEffect(() => {
        const socket = getSharedSocket();
        if (!socket) return;

        const refreshFromSocket = () => {
            socket.emit('admin_get_online_users', (data) => {
                if (data) {
                    setOnlineUsers(data.users || []);
                    setOnlineCount(data.totalOnline || 0);
                }
            });
        };

        if (socket.connected) {
            refreshFromSocket();
        } else {
            socket.once('connect', refreshFromSocket);
        }

        const handleUserOnline = (data) => {
            if (!data?.user) return;
            setOnlineUsers(prev => {
                const existingIndex = prev.findIndex(u => String(u.id) === String(data.user.id));
                if (existingIndex >= 0) {
                    const updated = [...prev];
                    updated[existingIndex] = { ...updated[existingIndex], ...data.user };
                    return updated;
                }
                return [data.user, ...prev];
            });
            if (data.totalOnline !== undefined) {
                setOnlineCount(data.totalOnline);
            } else {
                setOnlineCount(c => c + 1);
            }
        };

        const handleUserOffline = (data) => {
            if (!data?.userId) return;
            setOnlineUsers(prev => prev.filter(u => String(u.id) !== String(data.userId)));
            if (data.totalOnline !== undefined) {
                setOnlineCount(data.totalOnline);
            } else {
                setOnlineCount(c => Math.max(0, c - 1));
            }
        };

        socket.on('admin_user_online', handleUserOnline);
        socket.on('admin_user_offline', handleUserOffline);

        return () => {
            socket.off('admin_user_online', handleUserOnline);
            socket.off('admin_user_offline', handleUserOffline);
            socket.off('connect', refreshFromSocket);
        };
    }, []);

    const rankColors = [
        { bg: 'rgba(255, 45, 120, 0.15)', text: '#ff2d78', border: 'rgba(255, 45, 120, 0.35)' },
        { bg: 'rgba(255, 107, 53, 0.15)', text: '#ff6b35', border: 'rgba(255, 107, 53, 0.35)' },
        { bg: 'rgba(124, 58, 237, 0.15)', text: '#a855f7', border: 'rgba(124, 58, 237, 0.35)' },
        { bg: 'rgba(6, 182, 212, 0.15)',  text: '#06b6d4', border: 'rgba(6, 182, 212, 0.35)' },
        { bg: 'rgba(255, 255, 255, 0.06)', text: '#888', border: 'rgba(255, 255, 255, 0.12)' },
    ];

    if (loading) {
        return (
            <AdminLayout title="Dashboard" subtitle="Tổng quan hệ thống VibeTok">
                <div className="flex items-center justify-center h-64"><BounceDots /></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout title="Dashboard" subtitle="Tổng quan hệ thống VibeTok">

            {/* ── 4 stat cards ── */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                {stats.map(s => (
                    <StatCard key={s.key} label={s.label} value={fmt(s.value)}
                        change={s.change} positive={s.positive} accent={s.key === 'totalUsers'} />
                ))}
            </div>

            {/* ── LIVE REAL-TIME ACTIVE USERS (SOCKET) ── */}
            <div className="rounded-xl p-4 mb-6 transition-all" style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                        <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                        </span>
                        <div>
                            <span className="text-[13px] font-semibold font-body" style={{ color: 'var(--color-text-primary)' }}>
                                Người dùng đang Online trực tiếp
                            </span>
                            <span className="text-[12px] font-body ml-2 font-mono px-2 py-0.5 rounded-full" style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.25)' }}>
                                {onlineCount} đang online
                            </span>
                        </div>
                    </div>
                </div>

                {onlineUsers.length > 0 ? (
                    <div className="flex items-center gap-3 overflow-x-auto pb-1 pt-1 no-scrollbar">
                        {onlineUsers.map((u) => (
                            <div
                                key={u.id}
                                onClick={() => navigate(`/admin/users?search=${encodeURIComponent(u.username.replace('@', ''))}`)}
                                className="flex items-center gap-2.5 px-3 py-2 rounded-lg transition-all cursor-pointer shrink-0 group hover:opacity-90"
                                style={{
                                    background: 'var(--vt-input)',
                                    border: '1px solid var(--color-border)',
                                }}
                                title={`Bấm để quản lý ${u.name}`}
                            >
                                <div className="relative">
                                    <Avatar user={{ ...u, fullName: u.name }} size="xs" className="!w-7 !h-7 !text-[10px]" />
                                    <span
                                        className="absolute bottom-0 right-0 w-2 h-2 rounded-full bg-emerald-500 ring-[1.5px]"
                                        style={{ ringColor: 'var(--vt-card)' }}
                                    />
                                </div>
                                <div className="min-w-0">
                                    <div className="flex items-center gap-1.5">
                                        <p
                                            className="text-[11px] font-semibold group-hover:text-[#ff2d78] transition-colors leading-tight m-0 max-w-[100px] truncate"
                                            style={{ color: 'var(--color-text-primary)' }}
                                        >
                                            {u.name}
                                        </p>
                                        {u.role === 'admin' ? (
                                            <span className="text-[8px] px-1 py-0.2 rounded font-bold uppercase" style={{ background: 'rgba(239, 68, 68, 0.15)', color: '#ef4444' }}>
                                                Admin
                                            </span>
                                        ) : u.role === 'creator' ? (
                                            <span className="text-[8px] px-1 py-0.2 rounded font-bold uppercase" style={{ background: 'rgba(168, 85, 247, 0.15)', color: '#a855f7' }}>
                                                Creator
                                            </span>
                                        ) : null}
                                    </div>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <p
                                            className="text-[10px] leading-tight m-0 truncate max-w-[90px]"
                                            style={{ color: 'var(--color-text-secondary)' }}
                                        >
                                            {u.username}
                                        </p>
                                        {u.tabsCount > 1 && (
                                            <span className="text-[8px] font-mono" style={{ color: 'var(--color-text-muted)' }}>
                                                ({u.tabsCount} tabs)
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="text-center py-3 text-[11px] font-body" style={{ color: 'var(--color-text-muted)' }}>
                        Hiện chưa có người dùng nào trực tuyến ngoài bạn
                    </div>
                )}
            </div>

            {/* ── SEARCH & TRENDING SECTION ── */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                {/* 🔍 Left Column: Top Search Keywords */}
                <div className="rounded-xl p-4 flex flex-col justify-between" style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}>
                    <div>
                        <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <div className="flex items-center gap-2">
                                <SearchTrendIcon />
                                <span className="text-[13px] font-semibold font-body" style={{ color: 'var(--color-text-primary)' }}>
                                    Top 10 Từ khóa tìm kiếm hot nhất
                                </span>
                            </div>
                            <span className="text-[10px] font-body px-2 py-0.5 rounded-full flex items-center gap-1" style={{ background: 'rgba(255, 45, 120, 0.1)', color: '#ff2d78', border: '1px solid rgba(255, 45, 120, 0.25)' }}>
                                <FireIcon /> Realtime
                            </span>
                        </div>

                        {searchTrends.keywords && searchTrends.keywords.length > 0 ? (
                            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                                {searchTrends.keywords.map((kw, i) => {
                                    const rankStyle = rankColors[i] || rankColors[4];
                                    return (
                                        <div key={kw.name + i} className="group transition-all">
                                            <div className="flex items-center justify-between mb-1.5 text-[11px] font-body">
                                                <div className="flex items-center gap-2">
                                                    <span
                                                        className="w-5 h-5 rounded-md flex items-center justify-center font-bold text-[10px] shrink-0"
                                                        style={{ background: rankStyle.bg, color: rankStyle.text, border: `1px solid ${rankStyle.border}` }}
                                                    >
                                                        {kw.rank}
                                                    </span>
                                                    <span className="font-medium hover:text-[#ff2d78] cursor-pointer transition-colors" style={{ color: 'var(--color-text-primary)' }}>
                                                        {kw.name}
                                                    </span>
                                                    {kw.type === 'search' && (
                                                        <span className="text-[9px] px-1.5 py-0.2 rounded font-body" style={{ background: 'var(--vt-hover)', color: 'var(--color-text-muted)' }}>
                                                            Tìm kiếm
                                                        </span>
                                                    )}
                                                </div>
                                                <span className="font-semibold text-[11px]" style={{ color: 'var(--color-text-secondary)' }}>
                                                    {kw.displayCount || kw.count} lượt
                                                </span>
                                            </div>
                                            {/* Progress Bar */}
                                            <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--vt-input)' }}>
                                                <div
                                                    className="h-full rounded-full transition-all duration-500"
                                                    style={{
                                                        width: `${kw.percent || 10}%`,
                                                        background: i === 0
                                                            ? 'linear-gradient(90deg, #ff2d78, #ff6b35)'
                                                            : i === 1
                                                            ? 'linear-gradient(90deg, #ff6b35, #f59e0b)'
                                                            : i === 2
                                                            ? 'linear-gradient(90deg, #7c3aed, #a855f7)'
                                                            : i === 3
                                                            ? 'linear-gradient(90deg, #06b6d4, #3b82f6)'
                                                            : 'linear-gradient(90deg, #64748b, #94a3b8)',
                                                    }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        ) : (
                            <p className="text-[11px] font-body text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Chưa có từ khóa tìm kiếm</p>
                        )}
                    </div>

                    <div className="pt-3 mt-3 flex items-center justify-between text-[10px] font-body" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                        <span>Dữ liệu tìm kiếm được cập nhật trực tiếp</span>
                        <button
                            onClick={() => navigate('/admin/settings')}
                            className="text-[10px] font-body text-[#ff2d78] hover:underline bg-transparent border-none cursor-pointer p-0"
                        >
                            Quản lý từ khóa cấm &rarr;
                        </button>
                    </div>
                </div>

                {/* Right Column: Top Searched / Trending Videos */}
                <div className="rounded-xl p-4 flex flex-col justify-between" style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}>
                    <div>
                        <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <div className="flex items-center gap-2">
                                <span className="w-2 h-2 rounded-full bg-[#10b981]" />
                                <span className="text-[13px] font-semibold font-body" style={{ color: 'var(--color-text-primary)' }}>
                                    Top 10 Video được quan tâm & tìm kiếm
                                </span>
                            </div>
                            <span className="text-[10px] font-body" style={{ color: 'var(--color-text-muted)' }}>
                                Sắp xếp theo tương tác
                            </span>
                        </div>

                        {searchTrends.videos && searchTrends.videos.length > 0 ? (
                            <div className="space-y-2.5 max-h-[500px] overflow-y-auto pr-1">
                                {searchTrends.videos.map((v) => (
                                    <div
                                        key={v.id}
                                        className="flex items-center justify-between p-2 rounded-lg transition-colors hover:bg-[var(--vt-hover)] group"
                                        style={{ border: '1px solid var(--vt-divider)' }}
                                    >
                                        <div className="flex items-center gap-3 min-w-0 flex-1">
                                            {/* Video Thumbnail with Play overlay */}
                                            <div
                                                onClick={() => setPreviewVideo(v)}
                                                className="relative w-12 h-14 rounded-md overflow-hidden bg-[#181820] shrink-0 cursor-pointer group/thumb"
                                            >
                                                {v.thumbnail ? (
                                                    <img src={v.thumbnail} alt="" className="w-full h-full object-cover group-hover/thumb:scale-105 transition-transform" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-[9px] text-[#666]">Video</div>
                                                )}
                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center transition-opacity">
                                                    <VideoPlayIcon />
                                                </div>
                                                <span className="absolute bottom-0.5 right-0.5 bg-black/70 text-[8px] font-mono px-1 rounded text-white">
                                                    {v.duration}
                                                </span>
                                            </div>

                                            {/* Info */}
                                            <div className="min-w-0 flex-1">
                                                <p
                                                    onClick={() => setPreviewVideo(v)}
                                                    className="text-[12px] font-medium font-body m-0 truncate group-hover:text-[#ff2d78] cursor-pointer transition-colors"
                                                    style={{ color: 'var(--color-text-primary)' }}
                                                    title={v.title}
                                                >
                                                    {v.title}
                                                </p>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <div className="flex items-center gap-1.5">
                                                        <Avatar user={{ ...v.creator, fullName: v.creator.name }} size="xs" className="!w-4 !h-4 !text-[8px]" />
                                                        <span className="text-[10px] font-body truncate" style={{ color: 'var(--color-text-secondary)' }}>
                                                            {v.creator.name}
                                                        </span>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-3 mt-1 text-[10px] font-body" style={{ color: 'var(--color-text-muted)' }}>
                                                    <span className="flex items-center gap-1">
                                                        <EyeMiniIcon /> {v.views}
                                                    </span>
                                                    <span className="flex items-center gap-1">
                                                        <HeartMiniIcon /> {v.likes}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Quick Action Button */}
                                        <button
                                            onClick={() => setPreviewVideo(v)}
                                            className="px-2.5 py-1 text-[11px] font-body rounded border border-transparent transition-all cursor-pointer shrink-0 ml-2"
                                            style={{
                                                background: 'rgba(255, 45, 120, 0.1)',
                                                color: '#ff2d78',
                                            }}
                                        >
                                            Xem
                                        </button>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <p className="text-[11px] font-body text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Chưa có video thịnh hành</p>
                        )}
                    </div>

                    <div className="pt-3 mt-3 flex items-center justify-between text-[10px] font-body" style={{ borderTop: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                        <span>Xem thêm chi tiết video trong trang Video</span>
                        <button
                            onClick={() => navigate('/admin/videos')}
                            className="text-[10px] font-body text-[#ff2d78] hover:underline bg-transparent border-none cursor-pointer p-0"
                        >
                            Quản lý video &rarr;
                        </button>
                    </div>
                </div>
            </div>

            {/* ── Top Creators table ── */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}>
                <div className="flex items-center justify-between px-5 py-3.5" style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <p className="text-[13px] font-semibold font-body m-0" style={{ color: 'var(--color-text-primary)' }}>Top Creators Nổi Bật</p>
                </div>
                {creators.length > 0 ? (
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                {['STT', 'Tên Người Dùng', 'Followers', 'Videos', 'Lượt thích', 'Trạng thái', 'Hành động'].map(h => (
                                    <th key={h} className="px-4 py-2.5 text-left text-[12px] font-body font-medium whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {creators.map((c, i) => (
                                <tr key={c.id} className="transition-colors hover:bg-[var(--vt-hover)]" style={{ borderBottom: '1px solid var(--vt-divider)' }}>
                                    <td className="px-4 py-3 text-[11px] font-body" style={{ color: 'var(--color-text-secondary)' }}>{c.rank}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <Avatar user={{ ...c, fullName: c.name }} size="xs" className="!w-7 !h-7 !text-[9px]" />
                                            <div>
                                                <p className="text-[12px] font-semibold font-body leading-tight m-0" style={{ color: 'var(--color-text-primary)' }}>{c.name}</p>
                                                <p className="text-[10px] font-body m-0" style={{ color: 'var(--color-text-secondary)' }}>{c.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-[11px] font-body" style={{ color: 'var(--color-text-secondary)' }}>{c.followers}</td>
                                    <td className="px-4 py-3 text-[11px] font-body" style={{ color: 'var(--color-text-secondary)' }}>{c.videos}</td>
                                    <td className="px-4 py-3 text-[11px] font-body" style={{ color: 'var(--color-text-secondary)' }}>{c.views}</td>
                                    <td className="px-4 py-3"><StatusBadge status={c.status} /></td>
                                    <td className="px-4 py-3">
                                        <AdminBtn
                                            label="Xem"
                                            onClick={() => navigate(`/admin/users?search=${encodeURIComponent(c.username.replace('@', ''))}`)}
                                        />
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                ) : (
                    <p className="text-[11px] font-body text-center py-8" style={{ color: 'var(--color-text-muted)' }}>Chưa có dữ liệu</p>
                )}
            </div>

            {/* ── VIDEO PREVIEW MODAL ── */}
            {previewVideo && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
                    onClick={() => setPreviewVideo(null)}
                >
                    <div
                        className="relative max-w-md w-full rounded-2xl overflow-hidden shadow-2xl p-4"
                        style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}
                        onClick={e => e.stopPropagation()}
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between pb-3 mb-3" style={{ borderBottom: '1px solid var(--color-border)' }}>
                            <div className="flex items-center gap-2">
                                <Avatar user={{ ...previewVideo.creator, fullName: previewVideo.creator.name }} size="xs" className="!w-6 !h-6" />
                                <div>
                                    <p className="text-[12px] font-semibold m-0 leading-tight" style={{ color: 'var(--color-text-primary)' }}>{previewVideo.creator.name}</p>
                                    <p className="text-[10px] m-0" style={{ color: 'var(--color-text-secondary)' }}>{previewVideo.creator.username}</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreviewVideo(null)}
                                className="w-7 h-7 rounded-full flex items-center justify-center border-none cursor-pointer hover:opacity-80 transition-opacity"
                                style={{ background: 'var(--vt-hover)', color: 'var(--color-text-primary)' }}
                            >
                                ✕
                            </button>
                        </div>

                        {/* Video Player */}
                        <div className="relative aspect-[9/16] max-h-[460px] w-full rounded-xl overflow-hidden bg-black mx-auto flex items-center justify-center">
                            {previewVideo.videoUrl ? (
                                <video
                                    src={previewVideo.videoUrl}
                                    controls
                                    autoPlay
                                    className="w-full h-full object-contain"
                                />
                            ) : (
                                <p className="text-xs" style={{ color: 'var(--color-text-muted)' }}>Không thể tải URL video</p>
                            )}
                        </div>

                        {/* Caption & Stats */}
                        <div className="mt-3">
                            <p className="text-[12px] font-body m-0 line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>{previewVideo.title}</p>
                            <div className="flex items-center gap-4 mt-2 text-[11px] font-body" style={{ color: 'var(--color-text-secondary)' }}>
                                <span className="flex items-center gap-1"><EyeMiniIcon /> {previewVideo.views} lượt xem</span>
                                <span className="flex items-center gap-1"><HeartMiniIcon /> {previewVideo.likes} yêu thích</span>
                                <span>💬 {previewVideo.comments} bình luận</span>
                            </div>
                        </div>
                    </div>
                </div>
            )}

        </AdminLayout>
    );
}

