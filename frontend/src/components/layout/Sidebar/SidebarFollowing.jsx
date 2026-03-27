import React from 'react';
import { useNavigate } from 'react-router-dom';

const FOLLOWING_USERS = [
  { username: '@nguyenvibe', initials: 'NV', isLive: true },
  { username: '@nhavy',      initials: 'NH' },
  { username: '@tiendung',   initials: 'TD' },
  { username: '@ankhuong',   initials: 'AK' },
  { username: '@quocdat',    initials: 'QD' },
];

export default function SidebarFollowing() {
  const navigate = useNavigate();

  return (
    <div>
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
    </div>
  );
}