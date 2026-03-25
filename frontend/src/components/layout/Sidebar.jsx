import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../utils/constants';

const NAV = [
    { path: ROUTES.HOME, label: 'Đề xuất', Icon: HomeIcon },
    { path: ROUTES.EXPLORE, label: 'Khám phá', Icon: CompassIcon },
    { path: ROUTES.FOLLOWING, label: 'Đã follow', Icon: UsersIcon },
    { path: ROUTES.LIVE, label: 'LIVE', Icon: LiveIcon },
    { path: ROUTES.UPLOAD, label: 'Tải lên', Icon: UploadIcon },
    { path: ROUTES.PROFILE, label: 'Hồ sơ', Icon: UserIcon },
];

const FOLLOWING_USERS = [
    { username: '@nguyenvibe', initials: 'NV', isLive: true },
    { username: '@nhavy', initials: 'NV' },
    { username: '@tiendung', initials: 'TD' },
    { username: '@ankhuong', initials: 'AK' },
    { username: '@quocdat', initials: 'QD' },
];

export default function Sidebar({ className = '' }) {
    const navigate = useNavigate();
    const { pathname } = useLocation();
    const [query, setQuery] = useState('');

    return (
        <aside className={`flex flex-col h-screen w-60 min-w-60 bg-base border-r border-border sticky top-0 shrink-0 ${className}`}>
            {/* Logo */}
            <div
                className="px-5 py-[18px] border-b border-border cursor-pointer"
                onClick={() => navigate(ROUTES.HOME)}
            >
                <span className="font-display font-extrabold text-[28px] text-primary tracking-tight leading-none">
                    VibeTok
                </span>
            </div>

            {/* Search */}
            <div className="px-3 py-2.5">
                <div className="flex items-center gap-2.5 bg-elevated rounded-lg px-3.5 py-2.5">
                    <SearchIcon />
                    <input
                        type="text"
                        placeholder="Tìm kiếm..."
                        value={query}
                        onChange={e => setQuery(e.target.value)}
                        onKeyDown={e => {
                            if (e.key === 'Enter' && query.trim())
                                navigate(`${ROUTES.EXPLORE}?q=${encodeURIComponent(query)}`);
                        }}
                        className="bg-transparent border-none outline-none text-white text-sm font-body w-full placeholder:text-text-faint"
                    />
                </div>
            </div>

            {/* Nav */}
            <nav className="flex-1 overflow-auto py-1.5">
                {NAV.map(({ path, label, Icon }) => {
                    const active = pathname === path;
                    return (
                        <button
                            key={path}
                            onClick={() => navigate(path)}
                            className={`flex items-center gap-3.5 w-[calc(100%-16px)] mx-2 my-0.5 px-3 py-3 rounded-lg border-none cursor-pointer transition-colors
                ${active ? 'bg-primary/10' : 'bg-transparent hover:bg-white/5'}`}
                        >
                            <div className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors ${active ? 'bg-primary/15' : ''}`}>
                                <Icon active={active} />
                            </div>
                            <span className={`font-body text-sm ${active ? 'text-primary font-semibold' : 'text-text-secondary'}`}>
                                {label}
                            </span>
                        </button>
                    );
                })}

                {/* Divider + following */}
                <div className="px-5 pt-3 pb-1">
                    <div className="h-px bg-border" />
                    <p className="text-[11px] text-text-subtle tracking-[0.5px] mt-2.5 mb-1 font-body">
                        ĐANG THEO DÕI
                    </p>
                </div>

                {FOLLOWING_USERS.map(({ username, initials, isLive }) => (
                    <button
                        key={username}
                        onClick={() => navigate(`/profile/${username.replace('@', '')}`)}
                        className="flex items-center gap-2.5 w-full px-5 py-2 border-none bg-transparent cursor-pointer hover:bg-white/5 transition-colors"
                    >
                        <div className="w-[26px] h-[26px] rounded-full bg-brand-gradient flex items-center justify-center text-[10px] font-bold text-white shrink-0">
                            {initials}
                        </div>
                        <span className="font-body text-[13px] text-text-secondary flex-1 text-left">
                            {username}
                        </span>
                        {isLive && (
                            <span className="bg-primary text-white text-[9px] font-bold px-1.5 py-0.5 rounded tracking-[0.3px]">
                                LIVE
                            </span>
                        )}
                    </button>
                ))}
            </nav>

            {/* Upload CTA */}
            <div className="p-3 border-t border-border">
                <button
                    onClick={() => navigate(ROUTES.UPLOAD)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 border border-primary/30 rounded-lg text-primary text-[13px] font-semibold font-body cursor-pointer hover:bg-primary/20 transition-colors"
                >
                    <PlusIcon />
                    Đăng video mới
                </button>
            </div>
        </aside>
    );
}

//icons
const c = (active) => active ? '#ff2d78' : '#666';

function HomeIcon({ active }) {
    return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c(active)} strokeWidth="1.2">
        <path d="M1 6L7 1L13 6V13H9V9H5V13H1V6Z" />
    </svg>;
}
function CompassIcon({ active }) {
    return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c(active)} strokeWidth="1.2">
        <circle cx="7" cy="7" r="6" /><path d="M9.5 4.5L8 8L4.5 9.5L6 6Z" />
    </svg>;
}
function UsersIcon({ active }) {
    return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c(active)} strokeWidth="1.2">
        <circle cx="5" cy="4" r="2.5" /><path d="M1 13C1 10.79 2.79 9 5 9C7.21 9 9 10.79 9 13" />
        <circle cx="10" cy="4" r="2" /><path d="M12 13C12 11.34 11.1 9.9 9.8 9.27" />
    </svg>;
}
function LiveIcon({ active }) {
    return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c(active)} strokeWidth="1.2">
        <circle cx="7" cy="7" r="2" fill={c(active)} />
        <path d="M3.5 10.5C2.2 9.2 1.5 7.7 1.5 7C1.5 4.5 4 2 7 2C10 2 12.5 4.5 12.5 7C12.5 7.7 11.8 9.2 10.5 10.5" />
    </svg>;
}
function UploadIcon({ active }) {
    return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c(active)} strokeWidth="1.2" strokeLinecap="round">
        <path d="M7 9V1M4 4L7 1L10 4" /><path d="M1 11V13H13V11" />
    </svg>;
}
function UserIcon({ active }) {
    return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke={c(active)} strokeWidth="1.2">
        <circle cx="7" cy="4" r="3" /><path d="M1 13C1 10.24 3.69 8 7 8C10.31 8 13 10.24 13 13" />
    </svg>;
}
function SearchIcon() {
    return <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="#555" strokeWidth="1.2">
        <circle cx="6" cy="6" r="4.5" /><path d="M9.5 9.5L13 13" strokeLinecap="round" />
    </svg>;
}
function PlusIcon() {
    return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
        <path d="M6.5 1V12M1 6.5H12" />
    </svg>;
}