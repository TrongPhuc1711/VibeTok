import { useState, useEffect } from 'react';

/**
 * usePWA — hook quản lý trạng thái cài đặt PWA
 * Trả về:
 *   canInstall     – có thể hiện nút cài không
 *   isInstalled    – đã cài rồi chưa
 *   isOnline       – đang có mạng không
 *   promptInstall  – gọi hàm này để hiện popup cài đặt
 *   updateAvailable – có bản update mới không
 *   applyUpdate    – áp dụng update
 */
export function usePWA() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [canInstall, setCanInstall]         = useState(false);
  const [isInstalled, setIsInstalled]       = useState(false);
  const [isOnline, setIsOnline]             = useState(navigator.onLine);
  const [updateAvailable, setUpdateAvailable] = useState(false);

  useEffect(() => {
    // Detect đã cài chưa
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    setIsInstalled(isStandalone);

    // Bắt sự kiện cài đặt
    const handleBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setCanInstall(true);
    };

    // Sau khi cài xong
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setCanInstall(false);
      setDeferredPrompt(null);
    };

    // Online/offline
    const handleOnline  = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Update từ Service Worker
    window.__vibetok_onUpdate = () => setUpdateAvailable(true);

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      delete window.__vibetok_onUpdate;
    };
  }, []);

  const promptInstall = async () => {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setCanInstall(false);
    return outcome === 'accepted';
  };

  const applyUpdate = () => {
    window.location.reload();
  };

  return { canInstall, isInstalled, isOnline, updateAvailable, promptInstall, applyUpdate };
}

// ============================================================
// PWAInstallBanner — Banner gợi ý cài app
// ============================================================
export function PWAInstallBanner() {
  const { canInstall, isInstalled, promptInstall } = usePWA();
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('pwa_banner_dismissed') === '1'
  );

  // Không hiện nếu đã cài hoặc đã dismiss
  if (!canInstall || isInstalled || dismissed) return null;

  const handleInstall = async () => {
    const accepted = await promptInstall();
    if (accepted) {
      setDismissed(true);
    }
  };

  const handleDismiss = () => {
    setDismissed(true);
    localStorage.setItem('pwa_banner_dismissed', '1');
  };

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-[9999] max-w-sm mx-auto"
      style={{ animation: 'slideUp 0.4s cubic-bezier(0.32, 0.72, 0, 1)' }}
    >
      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        className="flex items-center gap-4 p-4 rounded-2xl shadow-2xl border"
        style={{
          background: 'rgba(17,17,24,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,45,120,0.25)',
          boxShadow: '0 8px 32px rgba(255,45,120,0.15), 0 0 0 1px rgba(255,255,255,0.05)',
        }}
      >
        {/* App icon */}
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center text-2xl font-black text-white shrink-0"
          style={{ background: 'linear-gradient(135deg,#ff2d78,#ff6b35)' }}
        >
          V
        </div>

        {/* Text */}
        <div className="flex-1 min-w-0">
          <p className="text-white text-[14px] font-bold font-body m-0 leading-tight">
            Cài VibeTok
          </p>
          <p className="text-[#888] text-[12px] font-body m-0 mt-0.5">
            Dùng như app thật, không cần trình duyệt
          </p>
        </div>

        {/* Buttons */}
        <div className="flex flex-col gap-1.5 shrink-0">
          <button
            onClick={handleInstall}
            className="px-4 py-2 rounded-xl text-[12px] font-bold font-body text-white border-none cursor-pointer transition-all hover:opacity-90 active:scale-95"
            style={{ background: 'linear-gradient(135deg,#ff2d78,#ff6b35)' }}
          >
            Cài ngay
          </button>
          <button
            onClick={handleDismiss}
            className="px-4 py-1.5 rounded-xl text-[11px] font-body text-[#555] bg-transparent border-none cursor-pointer hover:text-[#888] transition-colors"
          >
            Để sau
          </button>
        </div>
      </div>
    </div>
  );
}

// ============================================================
// OfflineBanner — Thông báo khi mất mạng
// ============================================================
export function OfflineBanner() {
  const { isOnline } = usePWA();
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShow(true);
    } else {
      // Hiện "Đã kết nối lại" 2 giây rồi ẩn
      const timer = setTimeout(() => setShow(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline]);

  if (!show) return null;

  return (
    <div
      className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999]"
      style={{ animation: 'slideDown 0.3s ease' }}
    >
      <style>{`
        @keyframes slideDown {
          from { opacity: 0; transform: translate(-50%, -10px); }
          to   { opacity: 1; transform: translate(-50%, 0); }
        }
      `}</style>

      <div
        className="flex items-center gap-2.5 px-5 py-3 rounded-full text-[13px] font-body font-semibold shadow-xl"
        style={{
          background: isOnline ? 'rgba(16,185,129,0.95)' : 'rgba(239,68,68,0.95)',
          backdropFilter: 'blur(10px)',
          color: 'white',
        }}
      >
        <span>{isOnline ? '✓' : '✕'}</span>
        <span>{isOnline ? 'Đã kết nối lại' : 'Không có kết nối mạng'}</span>
      </div>
    </div>
  );
}

// ============================================================
// UpdateBanner — Thông báo khi có phiên bản mới
// ============================================================
export function UpdateBanner() {
  const { updateAvailable, applyUpdate } = usePWA();

  if (!updateAvailable) return null;

  return (
    <div className="fixed top-4 left-4 right-4 z-[9999] max-w-sm mx-auto">
      <div
        className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl shadow-xl"
        style={{
          background: 'rgba(17,17,24,0.97)',
          border: '1px solid rgba(255,45,120,0.3)',
          backdropFilter: 'blur(20px)',
        }}
      >
        <div>
          <p className="text-white text-[13px] font-semibold font-body m-0">🆕 Có phiên bản mới!</p>
          <p className="text-[#666] text-[11px] font-body m-0">Tải lại để cập nhật VibeTok</p>
        </div>
        <button
          onClick={applyUpdate}
          className="px-4 py-2 rounded-xl text-[12px] font-bold font-body text-white border-none cursor-pointer"
          style={{ background: 'linear-gradient(135deg,#ff2d78,#ff6b35)' }}
        >
          Cập nhật
        </button>
      </div>
    </div>
  );
}