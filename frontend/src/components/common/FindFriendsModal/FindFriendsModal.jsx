import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useGoogleLogin } from '@react-oauth/google';
import { syncGoogleContacts } from '../../../services/contactService';
import { followUser } from '../../../services/userService';
import { useToast } from '../../ui/Toast';

export default function FindFriendsModal({ onClose }) {
  const navigate = useNavigate();
  const { showSuccess, showError } = useToast();

  const [step, setStep] = useState('idle'); // 'idle' | 'loading' | 'done' | 'error'
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(null);
  const [followedIds, setFollowedIds] = useState(new Set());
  const [followingInProgress, setFollowingInProgress] = useState(new Set());

  // Escape đóng modal
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  // Gọi Google OAuth với scope contacts
  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setStep('loading');
      try {
        const { data } = await syncGoogleContacts(tokenResponse.access_token);
        setUsers(data.users || []);
        setStats(data.stats || null);
        setStep('done');
      } catch (err) {
        console.error('Sync contacts error:', err);
        const msg = err.response?.data?.message || err.message || 'Không thể đồng bộ danh bạ';
        showError('Lỗi đồng bộ', msg);
        setStep('error');
      }
    },
    onError: () => {
      showError('Kết nối thất bại', 'Không thể kết nối với Google');
      setStep('error');
    },
    scope: 'https://www.googleapis.com/auth/contacts.readonly',
  });

  const handleFollow = useCallback(async (user) => {
    if (followingInProgress.has(user.id)) return;
    setFollowingInProgress(prev => new Set(prev).add(user.id));
    try {
      await followUser(user.username);
      setFollowedIds(prev => new Set(prev).add(user.id));
      showSuccess('Đã follow!', `Bạn đã follow ${user.fullName || user.username}`);
    } catch (err) {
      showError('Lỗi', err.response?.data?.message || 'Không thể follow');
    } finally {
      setFollowingInProgress(prev => {
        const next = new Set(prev);
        next.delete(user.id);
        return next;
      });
    }
  }, [followingInProgress, showSuccess, showError]);

  return (
    <div
      className="fixed inset-0 z-[500] flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        className="w-full max-w-[560px] rounded-2xl border shadow-2xl flex flex-col max-h-[85vh] animate-fade-in"
        style={{
          background: 'var(--vt-card, #121212)',
          borderColor: 'var(--color-border2, #2a2a2a)',
        }}
      >
        {/* ── Header ── */}
        <div
          className="flex items-center justify-between px-6 py-5 shrink-0"
          style={{ borderBottom: '1px solid var(--color-border, #1e1e1e)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #ff2d78, #ff6b35)' }}>
              <ContactsIcon />
            </div>
            <div>
              <h2 className="text-[16px] font-semibold font-body" style={{ color: 'var(--vt-text-bright)' }}>
                Tìm bạn từ danh bạ
              </h2>
              <p className="text-[11px] font-body" style={{ color: 'var(--vt-text-hint)' }}>
                Kết nối Google Contacts
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center border-none cursor-pointer transition-colors text-lg"
            style={{ background: 'var(--color-elevated, #2a2a2a)', color: 'var(--vt-text-hint)' }}
            onMouseEnter={(e) => e.currentTarget.style.color = 'var(--vt-text-bright)'}
            onMouseLeave={(e) => e.currentTarget.style.color = 'var(--vt-text-hint)'}
          >
            ×
          </button>
        </div>

        {/* ── Body ── */}
        <div className="flex-1 overflow-auto px-6 py-5">
          {/* Idle: chưa kết nối */}
          {step === 'idle' && (
            <div className="flex flex-col items-center py-8 gap-5">
              <div className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg, rgba(255,45,120,0.15), rgba(255,107,53,0.15))' }}>
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ff2d78" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                  <circle cx="9" cy="7" r="4" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                </svg>
              </div>
              <div className="text-center">
                <p className="font-body text-[15px] font-medium mb-1.5" style={{ color: 'var(--vt-text-bright)' }}>
                  Tìm bạn bè trên VibeTok
                </p>
                <p className="font-body text-[13px] leading-relaxed max-w-[340px]" style={{ color: 'var(--vt-text-hint)' }}>
                  Kết nối danh bạ Google để tìm những người bạn đã có tài khoản trên VibeTok. Chúng tôi chỉ đọc danh bạ, không lưu trữ thông tin liên hệ.
                </p>
              </div>
              <button
                onClick={() => googleLogin()}
                className="flex items-center gap-2.5 px-6 py-3 rounded-xl font-body font-semibold text-[14px] border-none cursor-pointer transition-all duration-200"
                style={{ background: 'linear-gradient(135deg, #ff2d78, #ff6b35)', color: '#fff' }}
                onMouseEnter={(e) => e.currentTarget.style.opacity = '0.9'}
                onMouseLeave={(e) => e.currentTarget.style.opacity = '1'}
              >
                <GoogleIcon />
                Kết nối Google Contacts
              </button>
              <p className="font-body text-[11px] flex items-center gap-1" style={{ color: 'var(--vt-text-disabled)' }}>
                <LockIcon /> Quyền riêng tư được bảo vệ
              </p>
            </div>
          )}

          {/* Loading */}
          {step === 'loading' && (
            <div className="flex flex-col items-center py-12 gap-4">
              <div className="relative w-14 h-14">
                <div className="absolute inset-0 rounded-full border-2 border-transparent"
                  style={{ borderTopColor: '#ff2d78', borderRightColor: '#ff6b35', animation: 'spin 0.8s linear infinite' }} />
                <div className="absolute inset-2 rounded-full border-2 border-transparent"
                  style={{ borderBottomColor: '#ff2d78', borderLeftColor: '#ff6b35', animation: 'spin 1.2s linear infinite reverse' }} />
              </div>
              <div className="text-center">
                <p className="font-body text-[14px] font-medium mb-1" style={{ color: 'var(--vt-text-bright)' }}>
                  Đang đồng bộ danh bạ...
                </p>
                <p className="font-body text-[12px]" style={{ color: 'var(--vt-text-hint)' }}>
                  Đang tìm kiếm bạn bè trên VibeTok
                </p>
              </div>
            </div>
          )}

          {/* Error */}
          {step === 'error' && (
            <div className="flex flex-col items-center py-10 gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center"
                style={{ background: 'rgba(255,45,120,0.1)' }}>
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ff2d78" strokeWidth="2" strokeLinecap="round">
                  <circle cx="12" cy="12" r="10" />
                  <line x1="15" y1="9" x2="9" y2="15" />
                  <line x1="9" y1="9" x2="15" y2="15" />
                </svg>
              </div>
              <p className="font-body text-[13px]" style={{ color: 'var(--vt-text-hint)' }}>
                Không thể kết nối. Vui lòng thử lại.
              </p>
              <button
                onClick={() => { setStep('idle'); }}
                className="px-5 py-2 rounded-lg font-body text-[13px] font-medium border-none cursor-pointer transition-colors"
                style={{ background: 'var(--color-elevated)', color: 'var(--vt-text-bright)' }}
              >
                Thử lại
              </button>
            </div>
          )}

          {/* Done: hiển thị kết quả */}
          {step === 'done' && (
            <div>
              {/* Stats bar */}
              {stats && (
                <div className="flex items-center gap-3 mb-4 px-3 py-2.5 rounded-xl"
                  style={{ background: 'var(--color-elevated, #1a1a26)' }}>
                  <div className="flex items-center gap-1.5">
                    <span className="font-body text-[11px]" style={{ color: 'var(--vt-text-hint)' }}>Danh bạ:</span>
                    <span className="font-body text-[12px] font-semibold" style={{ color: 'var(--vt-text-bright)' }}>{stats.totalContacts}</span>
                  </div>
                  <div className="w-px h-3" style={{ background: 'var(--color-border)' }} />
                  <div className="flex items-center gap-1.5">
                    <span className="font-body text-[11px]" style={{ color: 'var(--vt-text-hint)' }}>SĐT:</span>
                    <span className="font-body text-[12px] font-semibold" style={{ color: 'var(--vt-text-bright)' }}>{stats.phonesFound}</span>
                  </div>
                  <div className="w-px h-3" style={{ background: 'var(--color-border)' }} />
                  <div className="flex items-center gap-1.5">
                    <span className="font-body text-[11px]" style={{ color: 'var(--vt-text-hint)' }}>Tìm thấy:</span>
                    <span className="font-body text-[12px] font-bold text-primary">{stats.matchedUsers}</span>
                  </div>
                </div>
              )}

              {/* Empty */}
              {users.length === 0 && (
                <div className="flex flex-col items-center py-8 gap-3">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center"
                    style={{ background: 'var(--color-elevated)' }}>
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--vt-text-disabled)" strokeWidth="1.5" strokeLinecap="round">
                      <circle cx="11" cy="11" r="8" />
                      <line x1="21" y1="21" x2="16.65" y2="16.65" />
                    </svg>
                  </div>
                  <p className="font-body text-[14px] font-medium" style={{ color: 'var(--vt-text-bright)' }}>
                    Chưa tìm thấy bạn bè
                  </p>
                  <p className="font-body text-[12px] text-center max-w-[280px]" style={{ color: 'var(--vt-text-hint)' }}>
                    Chưa có ai trong danh bạ Google của bạn đang sử dụng VibeTok. Hãy mời bạn bè tham gia!
                  </p>
                </div>
              )}

              {/* User list */}
              {users.length > 0 && (
                <div className="flex flex-col gap-1">
                  {users.map((user, index) => {
                    const isFollowed = followedIds.has(user.id);
                    const isProcessing = followingInProgress.has(user.id);
                    return (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 px-3 py-3 rounded-xl transition-colors cursor-pointer"
                        style={{
                          animationDelay: `${index * 40}ms`,
                          animation: 'fadeSlideUp 0.3s ease-out both',
                        }}
                        onMouseEnter={(e) => e.currentTarget.style.background = 'var(--vt-hover)'}
                        onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                        onClick={() => navigate(`/profile/${user.username}`)}
                      >
                        {/* Avatar */}
                        <div className="w-11 h-11 rounded-full flex items-center justify-center text-[13px] font-bold text-white shrink-0 overflow-hidden"
                          style={{ background: 'linear-gradient(135deg, #ff2d78, #ff6b35)' }}>
                          {user.anh_dai_dien ? (
                            <img src={user.anh_dai_dien} alt={user.username} className="w-full h-full object-cover" />
                          ) : (
                            user.initials || user.fullName?.[0]?.toUpperCase() || 'U'
                          )}
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                          <p className="font-body text-[14px] font-medium truncate" style={{ color: 'var(--vt-text-bright)' }}>
                            {user.fullName || user.username}
                          </p>
                          <div className="flex items-center gap-2">
                            <span className="font-body text-[12px] truncate" style={{ color: 'var(--vt-text-hint)' }}>
                              @{user.username}
                            </span>
                            {/* Match badge */}
                            <span className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] font-body font-medium shrink-0"
                              style={{
                                background: user.matchedBy === 'phone'
                                  ? 'rgba(34,197,94,0.12)' : 'rgba(59,130,246,0.12)',
                                color: user.matchedBy === 'phone' ? '#22c55e' : '#3b82f6',
                              }}>
                              {user.matchedBy === 'phone' ? 'Từ các liên hệ của bạn' : 'Email'}
                            </span>
                          </div>
                        </div>

                        {/* Follow button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!isFollowed && !isProcessing) handleFollow(user);
                          }}
                          disabled={isFollowed || isProcessing}
                          className="shrink-0 px-4 py-2 rounded-lg font-body text-[13px] font-semibold border-none cursor-pointer transition-all duration-200"
                          style={isFollowed ? {
                            background: 'var(--color-elevated)',
                            color: 'var(--vt-text-disabled)',
                            cursor: 'default',
                          } : {
                            background: 'linear-gradient(135deg, #ff2d78, #ff6b35)',
                            color: '#fff',
                          }}
                          onMouseEnter={(e) => { if (!isFollowed) e.currentTarget.style.opacity = '0.9'; }}
                          onMouseLeave={(e) => { if (!isFollowed) e.currentTarget.style.opacity = '1'; }}
                        >
                          {isProcessing ? (
                            <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
                              <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="20" strokeDashoffset="10" strokeLinecap="round" />
                            </svg>
                          ) : isFollowed ? 'Đã follow' : 'Follow'}
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>

        {/* ── Footer ── */}
        {step === 'done' && users.length > 0 && (
          <div className="shrink-0 px-6 py-4" style={{ borderTop: '1px solid var(--color-border, #1e1e1e)' }}>
            <button
              onClick={onClose}
              className="w-full py-2.5 rounded-lg font-body text-[14px] font-semibold border cursor-pointer transition-colors"
              style={{
                background: 'transparent',
                borderColor: 'var(--color-border2)',
                color: 'var(--vt-text-bright)',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.borderColor = '#ff2d78';
                e.currentTarget.style.color = '#ff2d78';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.borderColor = 'var(--color-border2)';
                e.currentTarget.style.color = 'var(--vt-text-bright)';
              }}
            >
              Xong
            </button>
          </div>
        )}
      </div>

      {/* Inline keyframes for spinner */}
      <style>{`
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

/* ── Icons ── */
function ContactsIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <line x1="19" y1="8" x2="19" y2="14" />
      <line x1="22" y1="11" x2="16" y2="11" />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 48 48">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

function LockIcon() {
  return (
    <svg width="11" height="11" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3">
      <rect x="3" y="7" width="10" height="8" rx="1.5" />
      <path d="M5 7V5a3 3 0 0 1 6 0v2" />
    </svg>
  );
}
