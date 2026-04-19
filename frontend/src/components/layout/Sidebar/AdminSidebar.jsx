import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthContext } from '../../../contexts/AuthContext';
import {
    DashIcon, ChartLineIcon, UsersAdminIcon, VideoAdminIcon,
    ShieldAdminIcon, SettingsAdminIcon, MusicAdminIcon,
} from '../../../icons/AdminIcons';
import { getSidebarCounts } from '../../../services/adminService';

const fmt = (n) => {
    n = Number(n) || 0;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
};

export default function AdminSidebar() {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const { user } = useAuthContext();
    const [counts, setCounts] = useState({ users: 0, videos: 0, hidden: 0 });

    useEffect(() => {
        getSidebarCounts().then(setCounts).catch(() => { });
    }, []);

    const initials = (user?.fullName || user?.username || 'SA')
        .trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'SA';

    const NAV = [
        { path: '/admin', label: 'Dashboard', Icon: DashIcon, badge: null },
        { path: '/admin/analytics', label: 'Analytics', Icon: ChartLineIcon, badge: null },
        { path: '/admin/users', label: 'Người dùng', Icon: UsersAdminIcon, badge: fmt(counts.users) },
        { path: '/admin/videos', label: 'Video', Icon: VideoAdminIcon, badge: fmt(counts.videos) },
        { path: '/admin/music', label: 'Âm nhạc', Icon: MusicAdminIcon, badge: null },
        { path: '/admin/moderation', label: 'Kiểm duyệt', Icon: ShieldAdminIcon, badge: counts.hidden > 0 ? String(counts.hidden) : null, danger: counts.hidden > 0 },
        { path: '/admin/settings', label: 'Cài đặt', Icon: SettingsAdminIcon, badge: null },
    ];

    return (
        <aside className="flex flex-col h-screen w-[120px] min-w-[120px] bg-[#08080f] border-r border-[#1a1a2a] sticky top-0 shrink-0">
            {/* Logo */}
            <div className="flex flex-col items-center py-4 border-b border-[#1a1a2a] gap-0.5 cursor-pointer"
                onClick={() => navigate('/admin')}>
                <span className="font-display font-extrabold text-[17px] text-primary tracking-tight leading-none">VibeTok</span>
                <span className="text-[9px] font-body text-primary/50 tracking-[1.5px] uppercase">Admin</span>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-auto py-2">
                {NAV.map(({ path, label, Icon, badge, danger }) => {
                    const active = pathname === path || (path !== '/admin' && pathname.startsWith(path));
                    return (
                        <button key={path} onClick={() => navigate(path)}
                            className={`relative flex flex-col items-center gap-1.5 w-full px-2 py-3 border-none cursor-pointer transition-all
                                ${active ? 'bg-primary/10 text-primary' : 'bg-transparent text-[#555] hover:text-[#888] hover:bg-white/[0.03]'}`}>
                            {active && <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-8 bg-primary rounded-r-full" />}
                            <div className="relative">
                                <Icon active={active} />
                                {badge && (
                                    <span className={`absolute -top-1.5 -right-2.5 text-[8px] font-bold px-1 py-px rounded-full leading-none
                                        ${danger ? 'bg-red-500/90 text-white' : 'bg-[#1e1e2e] text-[#888]'}`}>
                                        {badge}
                                    </span>
                                )}
                            </div>
                            <span className={`text-[10px] font-body font-medium ${active ? 'text-primary' : ''}`}>{label}</span>
                        </button>
                    );
                })}
            </nav>

            {/* Footer user*/}
            <div className="border-t border-[#1a1a2a] p-3 flex flex-col items-center gap-1">
                <div className="w-8 h-8 rounded-full bg-brand-gradient flex items-center justify-center text-[10px] font-bold text-white">{initials}</div>
                <p className="text-[10px] font-body text-[#555] leading-tight text-center">{user?.fullName || 'Admin'}</p>
                <p className="text-[9px] font-body text-[#333] leading-tight truncate max-w-full">{user?.email || ''}</p>
            </div>
        </aside>
    );
}