import React, { useState, useEffect, useRef } from 'react';
import { MoreIcon, SpeedIcon, NotInterestedIcon, ReportIcon } from '../../../icons/VideoMenuIcons';
import { useToast } from '../../ui/Toast';
import { isLoggedIn } from '../../../utils/helpers';
import LoginPromptModal from '../../ui/LoginPromptModal';
import ReportModal from './ReportModal';

const SPEED_OPTIONS = [0.75, 1.0, 1.25, 1.5, 2.0];

const AutoScrollIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 3v18M12 3l-4 4M12 3l4 4M12 21l-4-4M12 21l4-4" />
  </svg>
);

const PipIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="3" width="20" height="18" rx="2" />
    <rect x="12" y="11" width="9" height="7" rx="1" fill="currentColor" fillOpacity="0.3" />
  </svg>
);

export default function VideoMoreMenu({ videoId, videoRef, onNotInterested }) {
  const { showSuccess, showInfo, showError } = useToast();

  const [open, setOpen] = useState(false);
  const [speed, setSpeed] = useState(1.0);
  const [autoScroll, setAutoScroll] = useState(() => localStorage.getItem('vibetok_autoscroll') === 'true');
  const [reportOpen, setReportOpen] = useState(false);
  const [loginPrompt, setLoginPrompt] = useState(false);
  const menuRef = useRef(null);

  // Sync speed from videoRef & autoScroll state
  useEffect(() => {
    if (videoRef?.current) {
      setSpeed(videoRef.current.playbackRate || 1.0);
    }
    setAutoScroll(localStorage.getItem('vibetok_autoscroll') === 'true');
  }, [videoRef, open]);

  // Close on click outside
  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    const timer = setTimeout(() => {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('touchstart', handleClickOutside);
    }, 10);
    return () => {
      clearTimeout(timer);
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
    };
  }, [open]);

  // Stop native DOM wheel/touch event propagation so HomePage wheel listener doesn't intercept menu scroll
  useEffect(() => {
    const el = menuRef.current;
    if (!el || !open) return;

    const handleNativeScroll = (e) => {
      e.stopPropagation();
    };

    el.addEventListener('wheel', handleNativeScroll, { passive: true });
    el.addEventListener('touchmove', handleNativeScroll, { passive: true });

    return () => {
      el.removeEventListener('wheel', handleNativeScroll);
      el.removeEventListener('touchmove', handleNativeScroll);
    };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e) => { if (e.key === 'Escape') setOpen(false); };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [open]);

  const handleOpen = (e) => {
    e.stopPropagation();
    setOpen((prev) => !prev);
  };

  const handleSpeedChange = (s) => {
    setSpeed(s);
    if (videoRef?.current) {
      videoRef.current.playbackRate = s;
    }
  };

  const handleToggleAutoScroll = () => {
    const nextState = !autoScroll;
    setAutoScroll(nextState);
    localStorage.setItem('vibetok_autoscroll', String(nextState));
    window.dispatchEvent(new CustomEvent('vibetok:autoscroll_changed', { detail: { enabled: nextState } }));
    if (nextState) {
      showSuccess('Đã bật cuộn tự động', 'Tự động chuyển video khi phát xong');
    } else {
      showInfo('Đã tắt cuộn tự động');
    }
  };

  const handleTogglePip = async () => {
    const v = videoRef?.current;
    if (!v) {
      showError('Lỗi', 'Không tìm thấy video');
      return;
    }
    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        showInfo('Đã đóng trình phát nổi');
      } else if (v.requestPictureInPicture) {
        await v.requestPictureInPicture();
        showSuccess('Đã mở trình phát nổi');
        setOpen(false);
      } else {
        showError('Không hỗ trợ', 'Trình duyệt không hỗ trợ trình phát nổi');
      }
    } catch (err) {
      console.error('PiP error:', err);
      showError('Lỗi', 'Không thể bật trình phát nổi');
    }
  };

  const handleNotInterested = () => {
    setOpen(false);
    onNotInterested?.(videoId);
    showInfo('Đã đánh dấu', 'Sẽ giảm hiển thị video tương tự');
  };

  const handleReport = () => {
    setOpen(false);
    if (!isLoggedIn()) {
      setLoginPrompt(true);
      return;
    }
    setTimeout(() => setReportOpen(true), 100);
  };

  return (
    <>
      {/* Trigger button - 3 dots horizontal */}
      <button
        onClick={handleOpen}
        className="w-9 h-9 rounded-full flex items-center justify-center bg-black/30 backdrop-blur-sm hover:bg-black/50 transition-colors text-white cursor-pointer"
        aria-label="Thêm tùy chọn"
      >
        <MoreIcon size={20} />
      </button>

      {/* Popup Menu — inline on video */}
      {open && (
        <div
          ref={menuRef}
          className="absolute top-0 right-0 z-[100] min-w-[310px] rounded-2xl overflow-hidden animate-[fadeScaleIn_0.15s_ease-out]"
          style={{
            background: 'rgba(30, 30, 30, 0.92)',
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
          }}
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* ── Tốc độ ── */}
          <div className="px-4 py-3.5 flex items-center gap-3">
            <div className="flex items-center gap-2.5 text-white/90 shrink-0">
              <SpeedIcon size={20} />
              <span className="text-[14px] font-medium">Tốc độ</span>
            </div>
            <div className="flex items-center gap-1 ml-auto">
              {SPEED_OPTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSpeedChange(s)}
                  className={`min-w-[40px] h-[30px] rounded-full text-[13px] font-semibold transition-all cursor-pointer ${
                    speed === s
                      ? 'bg-white text-black'
                      : 'bg-white/[0.08] text-white/60 hover:bg-white/15 hover:text-white/80'
                  }`}
                >
                  {s === 1.0 ? '1.0' : s}
                </button>
              ))}
            </div>
          </div>

          <div className="mx-4 border-t border-white/[0.08]" />

          {/* ── Cuộn tự động ── */}
          <button
            onClick={handleToggleAutoScroll}
            className="w-full px-4 py-3.5 flex items-center gap-2.5 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <AutoScrollIcon />
            <span className="text-white/90 text-[14px] font-medium">Cuộn tự động</span>
            <div className="ml-auto">
              <div
                className={`w-[42px] h-[24px] rounded-full relative transition-colors duration-200 ${
                  autoScroll ? 'bg-[#ff2d78]' : 'bg-white/20'
                }`}
              >
                <div
                  className={`absolute top-[2px] w-[20px] h-[20px] rounded-full bg-white shadow-sm transition-transform duration-200 ${
                    autoScroll ? 'translate-x-[20px]' : 'translate-x-[2px]'
                  }`}
                />
              </div>
            </div>
          </button>

          <div className="mx-4 border-t border-white/[0.08]" />

          {/* ── Trình phát nổi (PiP) ── */}
          <button
            onClick={handleTogglePip}
            className="w-full px-4 py-3.5 flex items-center gap-2.5 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <PipIcon />
            <span className="text-white/90 text-[14px] font-medium">Trình phát nổi</span>
          </button>

          <div className="mx-4 border-t border-white/[0.08]" />

          {/* ── Không quan tâm ── */}
          <button
            onClick={handleNotInterested}
            className="w-full px-4 py-3.5 flex items-center gap-2.5 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <NotInterestedIcon size={20} />
            <span className="text-white/90 text-[14px] font-medium">Không quan tâm</span>
          </button>

          <div className="mx-4 border-t border-white/[0.08]" />

          {/* ── Báo cáo ── */}
          <button
            onClick={handleReport}
            className="w-full px-4 py-3.5 flex items-center gap-2.5 hover:bg-white/5 transition-colors cursor-pointer"
          >
            <ReportIcon size={20} />
            <span className="text-white/90 text-[14px] font-medium">Báo cáo</span>
          </button>

          <div className="h-1" />
        </div>
      )}

      {/* Report Modal */}
      <ReportModal
        open={reportOpen}
        onClose={() => setReportOpen(false)}
        videoId={videoId}
      />

      {/* Login Prompt */}
      <LoginPromptModal
        open={loginPrompt}
        onClose={() => setLoginPrompt(false)}
        action="report"
      />
    </>
  );
}
