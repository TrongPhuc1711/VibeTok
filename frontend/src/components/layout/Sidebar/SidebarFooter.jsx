import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../../../utils/constants';
import UserDropdown from '../UserDropdown/UserDropdown';
import { PlusIcon } from '../../../icons/NavIcons';

export default function SidebarFooter() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
 
  if (!isAuthenticated) {
    return (
      <div className="p-4 border-t border-border">
        <p className="text-text-faint text-[13px] font-body leading-relaxed mb-4 text-center">
          Đăng nhập để theo dõi creator, thích video và xem bình luận.
        </p>
 
        {/*đăng nhập*/}
        <button
          onClick={() => navigate(ROUTES.LOGIN)}
          className="w-full py-2.5 rounded-lg border-2 border-primary text-primary font-bold text-[15px] font-body bg-transparent cursor-pointer hover:bg-primary/8 transition-colors"
        >
          Đăng nhập
        </button>
 
        {/* Đăng ký */}
        <p className="text-center text-[12px] font-body mt-3 text-text-faint">
          Chưa có tài khoản?{' '}
          <button
            onClick={() => navigate(ROUTES.REGISTER)}
            className="bg-transparent border-none text-primary cursor-pointer font-semibold hover:underline"
          >
            Đăng ký
          </button>
        </p>
      </div>
    );
  }
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