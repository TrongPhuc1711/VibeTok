import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../../contexts/AuthContext';
import {
    DashIcon, ChartLineIcon, UsersAdminIcon, VideoAdminIcon,
    ShieldAdminIcon, SettingsAdminIcon, MusicAdminIcon, CollapseIcon,
} from '../../../icons/AdminIcons';
import { getSidebarCounts } from '../../../services/adminService';
import Avatar from '../../common/Avatar/avatar';

/* ── helpers ── */
const fmt = (n) => {
    n = Number(n) || 0;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
};

/* ── nav config ── */
const NAV_ITEMS = (counts) => [
    { path: '/admin', label: 'Dashboard', Icon: DashIcon, exact: true },
    { path: '/admin/analytics', label: 'Analytics', Icon: ChartLineIcon },
    { path: '/admin/users', label: 'Người dùng', Icon: UsersAdminIcon, badge: counts.users > 0 ? fmt(counts.users) : null, badgeColor: '#3b82f6' },
    { path: '/admin/videos', label: 'Video', Icon: VideoAdminIcon, badge: counts.videos > 0 ? fmt(counts.videos) : null, badgeColor: '#7c3aed' },
    { path: '/admin/music', label: 'Âm nhạc', Icon: MusicAdminIcon },
    { path: '/admin/moderation', label: 'Kiểm duyệt', Icon: ShieldAdminIcon, badge: counts.hidden > 0 ? String(counts.hidden) : null, badgeColor: '#ef4444', danger: counts.hidden > 0 },
    { path: '/admin/settings', label: 'Cài đặt', Icon: SettingsAdminIcon },
];

export default function AdminSidebar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { user } = useAuthContext();
    const [counts, setCounts] = useState({ users: 0, videos: 0, hidden: 0 });
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        getSidebarCounts().then(setCounts).catch(() => { });
    }, []);

    const initials = (user?.fullName || user?.username || 'SA')
        .trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'SA';

    const items = NAV_ITEMS(counts);

    return (
        <aside
            className="flex flex-col h-screen sticky top-0 shrink-0 transition-all duration-300"
            style={{ 
                width: collapsed ? 64 : 220,
                background: 'var(--vt-sidebar-bg)',
                borderRight: '1px solid var(--color-border)'
            }}
        >
            {/* ── Header: Logo + Collapse toggle ── */}
            <div className="flex items-center justify-between px-3" style={{ height: 56, borderBottom: '1px solid var(--color-border)' }}>
                {/* Logo */}
                <div className="cursor-pointer" onClick={() => navigate('/admin')}>
                    {collapsed ? (
                        <span
                            className="font-display font-extrabold text-[20px] leading-none"
                            style={{ background: 'linear-gradient(135deg,#ff2d78,#ff6b35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                        >
                            V
                        </span>
                    ) : (
                        <div>
                            <p
                                className="font-display font-extrabold text-[15px] leading-none m-0"
                                style={{ background: 'linear-gradient(135deg,#ff2d78,#ff6b35)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}
                            >
                                VibeTok
                            </p>
                            <p className="text-[9px] font-body tracking-[1.5px] uppercase leading-none mt-0.5 m-0 text-[#555]">
                                Admin
                            </p>
                        </div>
                    )}
                </div>

                {/* Collapse toggle */}
                <button
                    onClick={() => setCollapsed(c => !c)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg border-none cursor-pointer bg-transparent hover:bg-[var(--vt-hover)] transition-colors flex-shrink-0"
                    style={{ color: 'var(--color-text-secondary)' }}
                    title={collapsed ? 'Mở rộng' : 'Thu gọn'}
                >
                    <CollapseIcon collapsed={collapsed} />
                </button>
            </div>

            {/* ── Nav ── */}
            <nav className="flex-1 overflow-auto py-3 px-2" style={{ scrollbarWidth: 'none' }}>
                {!collapsed && (
                    <p className="text-[9px] font-body font-semibold tracking-[1.5px] uppercase px-2 mb-2" style={{ color: 'var(--color-text-muted)' }}>Menu</p>
                )}

                {items.map(({ path, label, Icon, badge, badgeColor, danger, exact }) => {
                    const active = exact
                        ? pathname === path
                        : pathname === path || (path !== '/admin' && pathname.startsWith(path));

                    return (
                        <button
                            key={path}
                            onClick={() => navigate(path)}
                            title={collapsed ? label : undefined}
                            className={`
                                group relative flex items-center w-full border-none cursor-pointer rounded-xl mb-0.5 transition-all duration-150
                                ${collapsed ? 'justify-center p-2.5' : 'gap-3 px-3 py-2.5'}
                                ${active
                                    ? 'bg-[#ff2d78]/12 text-[#ff2d78]'
                                    : 'bg-transparent text-[var(--color-text-secondary)] hover:bg-[var(--vt-hover)] hover:text-[var(--color-text-primary)]'}
                            `}
                        >
                            {active && (
                                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r-full bg-[#ff2d78]" />
                            )}

                            <div className={`
                                relative flex items-center justify-center flex-shrink-0 rounded-lg transition-all
                                ${collapsed ? 'w-8 h-8' : 'w-7 h-7'}
                                ${active ? 'bg-[#ff2d78]/18' : 'group-hover:bg-white/[0.06]'}
                            `}>
                                <Icon active={active} />

                                {collapsed && badge && (
                                    <span
                                        className="absolute -top-1 -right-1 text-white text-[8px] font-bold rounded-full flex items-center justify-center"
                                        style={{
                                            background: badgeColor || (danger ? '#ef4444' : '#555'),
                                            minWidth: 14, height: 14, padding: '0 2px',
                                            boxShadow: '0 0 0 2px #07070e',
                                        }}
                                    >
                                        {badge}
                                    </span>
                                )}
                            </div>

                            {!collapsed && (
                                <>
                                    <span className={`text-[13px] font-body font-medium flex-1 text-left transition-colors ${active ? 'font-semibold' : ''}`}>
                                        {label}
                                    </span>

                                    {badge && (
                                        <span
                                            className="text-[10px] font-bold font-body px-1.5 py-0.5 rounded-full leading-none"
                                            style={{
                                                background: danger ? '#ef444420' : `${badgeColor || '#555'}20`,
                                                color: danger ? '#ef4444' : (badgeColor || '#888'),
                                            }}
                                        >
                                            {badge}
                                        </span>
                                    )}

                                    {active && !badge && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#ff2d78] flex-shrink-0" />
                                    )}
                                </>
                            )}
                        </button>
                    );
                })}
            </nav>

            {/* ── User profile ── */}
            <div
                className="transition-all"
                style={{ 
                    padding: collapsed ? '12px 8px' : '12px 12px',
                    borderTop: '1px solid var(--color-border)'
                }}
            >
                {collapsed ? (
                    <div className="flex justify-center">
                        <Avatar
                            user={user}
                            className="!w-8 !h-8 !text-[10px] cursor-pointer"
                            onClick={() => navigate('/admin/settings')}
                        />
                    </div>
                ) : (
                    <div className="flex items-center gap-2.5 px-1">
                        <Avatar
                            user={user}
                            className="!w-8 !h-8 !text-[10px]"
                        />
                        <div className="flex-1 min-w-0">
                            <p className="text-[12px] font-semibold font-body leading-tight m-0 truncate" style={{ color: 'var(--color-text-primary)' }}>
                                {user?.fullName || 'Admin'}
                            </p>
                            <p className="text-[10px] font-body m-0 leading-tight truncate" style={{ color: 'var(--color-text-secondary)' }}>
                                {user?.email || 'admin@vibetok.com'}
                            </p>
                        </div>
                    </div>
                )}
            </div>
        </aside>
    );
}