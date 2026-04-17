import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';
import UserDropdown from '../UserDropdown/UserDropdown';
import { PlusIcon } from '../../../icons/NavIcons';
import { useAuth } from '../../../hooks/useAuth';
export default function SidebarFooter() {
  const navigate = useNavigate();


  return (
    <div className="p-3 border-t border-border">
      <button
        onClick={() => navigate(ROUTES.UPLOAD)}
        className="w-full flex items-center justify-center gap-2 py-2.5 bg-primary/10 border border-primary/30 rounded-lg text-primary text-[13px] font-semibold font-body cursor-pointer hover:bg-primary/20 transition-colors"
      >
        <PlusIcon />
        Đăng video mới
      </button>

      <div className="flex items-center justify-between px-1 pt-1">
        <UserDropdown placement="sidebar" />
      </div>
    </div>
  );
}