import React, { useState, useEffect, useCallback } from 'react';
import { syncContacts, getSuggestedUsers, followUser, unfollowUser } from '../../services/userService';
import { useToast } from '../ui/Toast';
import { toggleFollowing } from '../../utils/following';
import api from '../../api/api';

export default function ContactSyncModal({ onClose }) {
  const { showError } = useToast();
  const [loading, setLoading] = useState(true);
  const [loadingText, setLoadingText] = useState('Đang kết nối danh bạ...');
  const [users, setUsers] = useState([]);
  const [isSuggested, setIsSuggested] = useState(false);
  const [followStates, setFollowStates] = useState({}); // { userId: boolean }
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const performSync = useCallback(async (active = true) => {
    setLoading(true);
    let phonesToSync = [];
    const supported = 'contacts' in navigator && 'ContactsManager' in window;

    if (supported) {
      setLoadingText('Đang yêu cầu quyền truy cập danh bạ...');
      try {
        const contactsList = await navigator.contacts.select(['tel'], { multiple: true });
        if (contactsList && contactsList.length > 0) {
          contactsList.forEach(c => {
            if (c.tel) {
              c.tel.forEach(t => {
                if (t) phonesToSync.push(t.trim());
              });
            }
          });
        }
      } catch (err) {
        console.warn('Truy cập danh bạ bị từ chối hoặc bị lỗi:', err);
      }
    } else {
      console.warn('Contact Picker API không được hỗ trợ trên trình duyệt này.');
    }

    if (phonesToSync.length > 0) {
      setLoadingText('Đang đối soát tài khoản VibeTok...');
      await new Promise(resolve => setTimeout(resolve, 800));
      try {
        const res = await syncContacts(phonesToSync);
        const matched = res.data.users || [];
        
        if (!active) return;

        if (matched.length > 0) {
          setUsers(matched);
          setIsSuggested(false);
          
          const initialStates = {};
          matched.forEach(u => {
            initialStates[u.id] = u.isFollowing;
          });
          setFollowStates(initialStates);
          setLoading(false);
          return;
        }
      } catch (err) {
        console.error('Error syncing contacts:', err);
      }
    }

    // Fallback if not supported or no match
    if (!active) return;
    setLoadingText('Đang tải danh sách gợi ý...');
    setIsSuggested(true);
    
    try {
      const sugRes = await getSuggestedUsers({ limit: 12 });
      if (!active) return;
      const suggested = sugRes.data.users || [];
      setUsers(suggested);

      const initialStates = {};
      suggested.forEach(u => {
        initialStates[u.id] = u.isFollowing;
      });
      setFollowStates(initialStates);
    } catch (err) {
      if (active) showError('Lỗi', 'Không thể tải danh sách gợi ý');
    } finally {
      if (active) setLoading(false);
    }
  }, [showError]);

  useEffect(() => {
    let active = true;
    performSync(active);
    return () => {
      active = false;
    };
  }, [performSync]);

  const handleSearch = async (val) => {
    setSearchQuery(val);
    if (!val.trim()) {
      // Re-run the default contacts sync/suggestion list
      performSync(true);
      return;
    }

    setIsSearching(true);
    try {
      const isPhone = /^[0-9+\s\-()]{8,15}$/.test(val.trim());
      let results = [];

      if (isPhone) {
        // Search by phone number in DB directly
        const res = await syncContacts([val.trim()]);
        results = res.data.users || [];
        setIsSuggested(false);
      } else {
        // Search by name/username
        const res = await api.get('/users/search', { params: { q: val.trim(), limit: 15 } });
        results = res.data.users || [];
        setIsSuggested(false);
      }

      setUsers(results);

      const initialStates = {};
      results.forEach(u => {
        initialStates[u.id] = u.isFollowing;
      });
      setFollowStates(initialStates);
    } catch (err) {
      console.error('Error searching:', err);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFollowToggle = async (user) => {
    const isCurrentlyFollowing = followStates[user.id];
    const username = user.username || user.ten_dang_nhap;

    // Optimistic update
    setFollowStates(prev => ({ ...prev, [user.id]: !isCurrentlyFollowing }));
    toggleFollowing(user.id, !isCurrentlyFollowing);

    try {
      if (isCurrentlyFollowing) {
        await unfollowUser(username);
      } else {
        await followUser(username);
      }
    } catch (err) {
      // Revert on error
      setFollowStates(prev => ({ ...prev, [user.id]: isCurrentlyFollowing }));
      toggleFollowing(user.id, isCurrentlyFollowing);
      showError('Thao tác thất bại', err.response?.data?.message || 'Không thể thực hiện follow');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end md:items-center justify-center bg-black/85 backdrop-blur-sm px-0 md:px-4"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full md:max-w-[440px] bg-[#121212] md:rounded-2xl rounded-t-3xl border-t md:border border-[#2a2a2a] shadow-2xl flex flex-col h-[75vh] md:h-[80dvh] overflow-hidden text-white font-body animate-[sheetUp_0.35s_cubic-bezier(0.16,1,0.3,1)_forwards] md:animate-[fadeIn_0.25s_cubic-bezier(0.16,1,0.3,1)_forwards]">
        
        {/* Thanh kéo ngang giả lập trên Mobile */}
        <div className="w-9 h-1 bg-[#2d2d2d] rounded-full mx-auto my-3 md:hidden shrink-0" />

        {/* Header */}
        <div className="flex items-center justify-between px-6 pb-4 pt-1 md:pt-6 border-b border-[#2a2a2a] shrink-0">
          <h3 className="text-[17px] font-bold tracking-tight">Tìm bạn bè</h3>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#202020] hover:bg-[#2d2d2d] border-none cursor-pointer flex items-center justify-center text-[#aaa] hover:text-white transition-all text-xl"
          >
            &times;
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-6 py-5 flex flex-col min-h-[300px]">
          
          {/* Search bar */}
          <div className="relative mb-4">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Tìm kiếm bằng tên hoặc số điện thoại..."
              className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-xl pl-10 pr-4 py-2.5 text-white text-[13px] font-body outline-none focus:border-[#444] transition-colors placeholder:text-[#555]"
            />
            <div className="absolute left-3.5 top-3.5 text-[#555]">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </div>
            {isSearching && (
              <div className="absolute right-3.5 top-3.5">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 py-16">
              <div className="w-10 h-10 rounded-full border-3 border-[#ff2d78] border-t-transparent animate-spin" />
              <p className="text-[14px] text-[#aaa] font-medium animate-pulse">{loadingText}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <span className="text-[14px] font-bold text-white">
                  {searchQuery.trim() 
                    ? 'Kết quả tìm kiếm' 
                    : (isSuggested ? 'Tài khoản gợi ý cho bạn' : 'Bạn bè từ danh bạ')}
                </span>
                <span className="text-[12px] text-[#777]">
                  {searchQuery.trim()
                    ? `Hiển thị các tài khoản phù hợp với "${searchQuery}"`
                    : (isSuggested
                        ? 'Kết nối với các nhà sáng tạo nội dung phổ biến trên VibeTok.'
                        : 'Những người liên hệ của bạn đang dùng VibeTok.')}
                </span>
              </div>

              <div className="flex flex-col gap-1.5 divide-y divide-[#1e1e1e] mt-2">
                {users.length > 0 ? (
                  users.map(u => (
                    <div key={u.id} className="flex items-center justify-between py-3.5 first:pt-0">
                      <div className="flex items-center gap-3">
                        <div className="w-[44px] h-[44px] rounded-full bg-brand-gradient flex items-center justify-center font-bold text-white overflow-hidden text-sm shadow-md">
                          {u.anh_dai_dien ? (
                            <img src={u.anh_dai_dien} alt={u.username} className="w-full h-full object-cover" />
                          ) : (
                            u.initials || u.fullName?.slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div className="flex flex-col">
                          <span className="text-[14px] font-bold text-white leading-tight">{u.fullName}</span>
                          <span className="text-[12px] text-[#777] mt-0.5">@{u.username}</span>
                        </div>
                      </div>

                      <button
                        onClick={() => handleFollowToggle(u)}
                        className={`px-5 py-2 rounded-xl text-[12px] font-bold cursor-pointer transition-all border shadow-sm
                          ${followStates[u.id]
                            ? 'bg-transparent border-[#333] text-[#aaa] hover:border-[#555] hover:text-white'
                            : 'bg-white border-transparent text-black hover:bg-[#eee]'
                          }`}
                      >
                        {followStates[u.id] ? 'Đang follow' : 'Follow'}
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="flex flex-col items-center justify-center py-12 text-[#555] gap-2">
                    <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                      <circle cx="9" cy="7" r="4" />
                    </svg>
                    <p className="text-[13px] text-center">Không tìm thấy tài khoản phù hợp.</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 border-t border-[#2a2a2a] px-6 py-4 flex justify-end bg-[#151515]">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-transparent border border-[#333] text-[#aaa] text-[13px] font-semibold cursor-pointer hover:border-[#555] hover:text-white transition-colors"
          >
            Đóng
          </button>
        </div>

      </div>
    </div>
  );
}
