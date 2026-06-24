import React, { useState, useEffect, useRef, useCallback } from 'react';
import { getStoredUser, isLoggedIn } from '../../../utils/helpers';
import { sendMessage } from '../../../services/messageService';
import { useToast } from '../../ui/Toast';
import Avatar from '../../common/Avatar/avatar';
import api from '../../../api/api';
import {
  SearchIcon, CloseIcon, CheckIcon,
  LinkIcon, WhatsAppIcon,
  FacebookIcon, TelegramIcon, TwitterIcon,
} from '../../../icons/ShareIcons';

export default function ShareSheet({ open, onClose, videoId, videoUrl }) {
  const me = getStoredUser();
  const { showSuccess, showError, showInfo } = useToast();

  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [message, setMessage] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [closing, setClosing] = useState(false);

  const inputRef = useRef(null);
  const usersRowRef = useRef(null);

  const shareUrl = videoUrl || `${window.location.origin}/video/${videoId}`;

  // Fetch friends/following users
  useEffect(() => {
    if (!open || !isLoggedIn() || !me?.username) return;

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const res = await api.get(`/users/${me.username}/friends`, { params: { limit: 50 } });
        let userList = res.data.users || [];
        if (userList.length === 0) {
          const followingRes = await api.get(`/users/${me.username}/following`, { params: { limit: 50 } });
          userList = followingRes.data.users || [];
        }
        setUsers(userList);
        setFilteredUsers(userList);
      } catch (err) {
        console.error('Error fetching users for share:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchUsers();
  }, [open, me?.username]);

  // Filter users by search
  useEffect(() => {
    if (!searchQuery.trim()) { setFilteredUsers(users); return; }
    const q = searchQuery.toLowerCase();
    setFilteredUsers(
      users.filter(u =>
        (u.fullName || u.ten_hien_thi || '').toLowerCase().includes(q) ||
        (u.username || u.ten_dang_nhap || '').toLowerCase().includes(q)
      )
    );
  }, [searchQuery, users]);

  // Reset when closed
  useEffect(() => {
    if (!open) {
      setTimeout(() => { setSelectedUsers([]); setMessage(''); setSearchQuery(''); }, 300);
    }
  }, [open]);

  const handleClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => { setClosing(false); onClose?.(); }, 280);
  }, [onClose]);

  const handleOverlayClick = (e) => { if (e.target === e.currentTarget) handleClose(); };

  const toggleUser = (user) => {
    setSelectedUsers(prev => {
      const username = user.username || user.ten_dang_nhap;
      const exists = prev.some(u => (u.username || u.ten_dang_nhap) === username);
      return exists
        ? prev.filter(u => (u.username || u.ten_dang_nhap) !== username)
        : [...prev, user];
    });
  };

  const isSelected = (user) => {
    const username = user.username || user.ten_dang_nhap;
    return selectedUsers.some(u => (u.username || u.ten_dang_nhap) === username);
  };

  const handleSend = async () => {
    if (selectedUsers.length === 0) return;
    setSending(true);
    const shareContent = message.trim()
      ? `${message.trim()}\n\n🎬 ${shareUrl}`
      : `Đã chia sẻ video với bạn: ${shareUrl}`;

    let successCount = 0, failCount = 0;
    for (const user of selectedUsers) {
      try {
        await sendMessage(user.username || user.ten_dang_nhap, shareContent, 'text');
        successCount++;
      } catch { failCount++; }
    }
    setSending(false);
    if (successCount > 0) showSuccess(`Đã gửi đến ${successCount} người`, failCount > 0 ? `${failCount} thất bại` : 'Chia sẻ thành công!');
    else showError('Không thể gửi', 'Vui lòng thử lại');
    handleClose();
  };

  const handleCopyLink = async () => {
    try { await navigator.clipboard.writeText(shareUrl); showSuccess('Đã sao chép link!', 'Dán vào bất kỳ đâu để chia sẻ'); }
    catch { showInfo('Link video', shareUrl); }
  };

  const handleShareFacebook = () => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');
  const handleShareWhatsApp = () => window.open(`https://wa.me/?text=${encodeURIComponent(shareUrl)}`, '_blank');
  const handleShareTelegram = () => window.open(`https://t.me/share/url?url=${encodeURIComponent(shareUrl)}`, '_blank');
  const handleShareTwitter = () => window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(shareUrl)}`, '_blank', 'width=600,height=400');

  if (!open && !closing) return null;

  const hasSelection = selectedUsers.length > 0;

  return (
    <div
      className={`fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/55 backdrop-blur-[4px] ${closing ? 'animate-[overlayOut_0.28s_ease-in_forwards]' : 'animate-[overlayIn_0.2s_ease-out]'}`}
      onClick={handleOverlayClick}
    >
      <div className={`w-full max-w-[500px] md:max-w-[420px] bg-surface rounded-t-2xl md:rounded-2xl overflow-hidden pb-[env(safe-area-inset-bottom,0px)] ${closing ? 'animate-[sheetDown_0.28s_ease-in_forwards]' : 'animate-[sheetUp_0.32s_cubic-bezier(0.16,1,0.3,1)]'}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pt-4 pb-2">
          <button
            onClick={() => inputRef.current?.focus()}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none text-text-primary cursor-pointer hover:bg-white/[0.08] transition-colors"
          >
            <SearchIcon />
          </button>
          <h3 className="flex-1 text-center text-base font-bold font-display text-text-primary m-0">Chia sẻ đến</h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full bg-transparent border-none text-text-primary cursor-pointer hover:bg-white/[0.08] transition-colors"
          >
            <CloseIcon />
          </button>
        </div>

        {/* Search */}
        <div className="flex items-center gap-2 mx-4 mb-3 px-3 py-2 bg-[var(--vt-input)] rounded-[10px] border border-transparent focus-within:border-primary transition-colors">
          <SearchIcon size={16} className="text-text-muted shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Tìm kiếm bạn bè..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent border-none outline-none text-text-primary text-sm font-body p-0 placeholder:text-text-muted"
          />
          {searchQuery && (
            <button onClick={() => setSearchQuery('')} className="w-5 h-5 flex items-center justify-center rounded-full bg-white/10 border-none text-text-secondary cursor-pointer hover:bg-white/15 p-0">
              <CloseIcon size={14} />
            </button>
          )}
        </div>

        {/* Users row */}
        <div className="py-1">
          <div ref={usersRowRef} className="flex gap-1 overflow-x-auto px-3 no-scrollbar min-h-[94px]" style={{ WebkitOverflowScrolling: 'touch' }}>
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-1.5 px-2 min-w-[72px]">
                  <div className="w-[52px] h-[52px] rounded-full bg-elevated animate-pulse" />
                  <div className="w-12 h-2.5 rounded bg-elevated animate-pulse" />
                </div>
              ))
            ) : filteredUsers.length === 0 ? (
              <div className="flex items-center justify-center w-full text-text-muted text-[13px] font-body py-5">
                {searchQuery ? 'Không tìm thấy' : 'Chưa follow ai'}
              </div>
            ) : (
              filteredUsers.map((user) => {
                const username = user.username || user.ten_dang_nhap;
                const displayName = user.fullName || user.ten_hien_thi || username;
                const selected = isSelected(user);

                return (
                  <button
                    key={username}
                    onClick={() => toggleUser(user)}
                    className="flex flex-col items-center gap-1.5 bg-transparent border-none cursor-pointer px-2 py-1 min-w-[72px] max-w-[80px] active:scale-[0.93] transition-transform"
                    style={{ WebkitTapHighlightColor: 'transparent' }}
                  >
                    <div className="relative w-[52px] h-[52px]">
                      <Avatar
                        user={user}
                        size="md"
                        className={`!w-[52px] !h-[52px] transition-opacity ${selected ? 'opacity-70' : ''}`}
                      />
                      {selected && (
                        <div className="absolute -bottom-0.5 -right-0.5 w-[18px] h-[18px] bg-primary rounded-full flex items-center justify-center border-2 border-surface animate-[badgePop_0.2s_cubic-bezier(0.34,1.56,0.64,1)]">
                          <CheckIcon />
                        </div>
                      )}
                    </div>
                    <span className={`font-body text-[11px] text-center leading-tight max-w-[72px] overflow-hidden line-clamp-2 break-words ${selected ? 'text-text-primary' : 'text-text-secondary'}`}>
                      {displayName}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Message input (visible when user selected) */}
        {hasSelection && (
          <div className="px-4 pt-3 pb-4 border-t border-[var(--vt-divider)] animate-[fadeSlideUp_0.25s_ease-out]">
            <div className="flex items-center gap-2.5">
              <input
                type="text"
                placeholder="Viết một tin nhắn..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                className="flex-1 py-3 px-4 bg-[var(--vt-input)] border border-border rounded-3xl text-text-primary text-sm font-body outline-none focus:border-primary transition-colors placeholder:text-text-muted"
              />
              <button
                onClick={handleSend}
                disabled={sending}
                className="py-2.5 px-5 bg-primary text-white border-none rounded-3xl text-sm font-semibold font-body cursor-pointer hover:bg-[#e02268] active:scale-[0.97] disabled:opacity-70 disabled:cursor-not-allowed transition-all min-w-[60px] flex items-center justify-center"
              >
                {sending ? (
                  <div className="w-[18px] h-[18px] border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : 'Gửi'}
              </button>
            </div>
          </div>
        )}

        {/* Divider + Actions (hidden when user selected) */}
        {!hasSelection && (
          <>
            <div className="h-px bg-[var(--vt-divider)] mx-4" />
            <div className="py-2 pb-4">
              <div className="flex gap-1 overflow-x-auto px-3 no-scrollbar">
                <ShareActionBtn icon={<LinkIcon />} label="Copy" color="#7c7c7c" onClick={handleCopyLink} />
                <ShareActionBtn icon={<WhatsAppIcon />} label="WhatsApp" color="#25D366" onClick={handleShareWhatsApp} />
                <ShareActionBtn icon={<FacebookIcon />} label="Facebook" color="#1877F2" onClick={handleShareFacebook} />
                <ShareActionBtn icon={<TelegramIcon />} label="Telegram" color="#0088cc" onClick={handleShareTelegram} />
                <ShareActionBtn icon={<TwitterIcon />} label="Twitter" color="#1DA1F2" onClick={handleShareTwitter} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

/* ── Sub-component ── */
function ShareActionBtn({ icon, label, color, onClick }) {
  return (
    <button
      onClick={onClick}
      className="flex flex-col items-center gap-2 bg-transparent border-none cursor-pointer px-2.5 py-1 min-w-[72px] active:scale-90 transition-transform"
      style={{ WebkitTapHighlightColor: 'transparent' }}
    >
      <div
        className="w-[50px] h-[50px] rounded-full flex items-center justify-center hover:scale-[1.08] hover:shadow-lg transition-all"
        style={{ background: color }}
      >
        {icon}
      </div>
      <span className="font-body text-[11px] text-text-secondary whitespace-nowrap">{label}</span>
    </button>
  );
}
