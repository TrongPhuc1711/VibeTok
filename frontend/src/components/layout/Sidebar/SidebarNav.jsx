import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';
import { NotificationBadge } from '../../notification';
import {
  HomeIcon, CompassIcon, UsersIcon, UploadIcon, UserIcon, BellIcon,
} from '../../../icons/NavIcons';

const NAV = [
  { path: ROUTES.HOME,      label: 'Đề xuất',   Icon: HomeIcon },
  { path: ROUTES.EXPLORE,   label: 'Khám phá',  Icon: CompassIcon },
  { path: ROUTES.FOLLOWING, label: 'Đã follow', Icon: UsersIcon },
  { path: ROUTES.UPLOAD,    label: 'Tải lên',   Icon: UploadIcon },
  { path: ROUTES.PROFILE,   label: 'Hồ sơ',     Icon: UserIcon },
];

export default function SidebarNav() {
  const navigate = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav className="py-1.5">
      {NAV.map(({ path, label, Icon }) => {
        const active = pathname === path;
        return (
          <button
            key={path}
            onClick={() => navigate(path)}
            className={`
              flex items-center gap-3.5 w-[calc(100%-16px)] mx-2 my-0.5 px-3 py-3
              rounded-lg border-none cursor-pointer transition-colors
              ${active ? 'bg-primary/10' : 'bg-transparent hover:bg-white/5'}
            `}
          >
            <div
              className={`flex items-center justify-center w-7 h-7 rounded-lg transition-colors
                ${active ? 'bg-primary/15' : ''}`}
            >
              <Icon active={active} />
            </div>
            <span
              className={`font-body text-sm ${active ? 'text-primary font-semibold' : 'text-text-secondary'}`}
            >
              {label}
            </span>
          </button>
        );
      })}
      <NotificationBadge />
    </nav>
  );
}