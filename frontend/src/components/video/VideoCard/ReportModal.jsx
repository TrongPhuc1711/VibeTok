import React, { useState, useEffect, useRef } from 'react';
import { CloseMenuIcon } from '../../../icons/VideoMenuIcons';
import { reportVideo } from '../../../services/videoService';
import { useToast } from '../../ui/Toast';

const REPORT_REASONS = [
  'Bạo lực, lạm dụng và bóc lột để phạm tội',
  'Thù ghét và quấy rối',
  'Tự tử và tự làm hại bản thân',
  'Cách ăn uống không lành mạnh và hình ảnh cơ thể ốm yếu',
  'Hoạt động và thử thách nguy hiểm',
  'Hình ảnh khỏa thân hoặc nội dung tình dục',
  'Thông tin sai sự thật',
  'Lừa đảo và gian lận',
  'Spam hoặc gây hiểu lầm',
];

export default function ReportModal({ open, onClose, videoId }) {
  const { showSuccess, showError } = useToast();
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [showOtherInput, setShowOtherInput] = useState(false);
  const [otherText, setOtherText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const containerRef = useRef(null);
  const contentRef = useRef(null);

  // Stop native DOM wheel/touch event propagation so HomePage wheel listener doesn't intercept modal scroll
  useEffect(() => {
    const overlay = containerRef.current;
    const content = contentRef.current;

    const stopPropagation = (e) => e.stopPropagation();

    if (overlay) {
      overlay.addEventListener('wheel', stopPropagation, { passive: true });
      overlay.addEventListener('touchmove', stopPropagation, { passive: true });
    }
    if (content) {
      content.addEventListener('wheel', stopPropagation, { passive: true });
      content.addEventListener('touchmove', stopPropagation, { passive: true });
    }

    return () => {
      if (overlay) {
        overlay.removeEventListener('wheel', stopPropagation);
        overlay.removeEventListener('touchmove', stopPropagation);
      }
      if (content) {
        content.removeEventListener('wheel', stopPropagation);
        content.removeEventListener('touchmove', stopPropagation);
      }
    };
  }, [open, visible]);

  useEffect(() => {
    if (open) {
      setVisible(false);
      setClosing(false);
      setShowOtherInput(false);
      setOtherText('');
      requestAnimationFrame(() => requestAnimationFrame(() => setVisible(true)));
    }
  }, [open]);

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setClosing(false);
      setVisible(false);
      onClose();
    }, 250);
  };

  const handleSelectReason = async (reason) => {
    setSubmitting(true);
    try {
      await reportVideo(videoId, { reason });
      showSuccess('Cảm ơn bạn đã báo cáo', 'Chúng tôi sẽ xem xét nội dung này');
      handleClose();
    } catch (err) {
      console.error('[ReportModal] Lỗi báo cáo video:', err);
      const msg = err?.response?.data?.message || err?.message || 'Không thể gửi báo cáo';
      showError('Lỗi', msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitOther = async (e) => {
    e?.preventDefault();
    if (!otherText.trim()) return;
    setSubmitting(true);
    try {
      await reportVideo(videoId, { reason: 'Khác', description: otherText.trim() });
      showSuccess('Cảm ơn bạn đã báo cáo', 'Chúng tôi sẽ xem xét nội dung này');
      handleClose();
    } catch (err) {
      console.error('[ReportModal] Lỗi báo cáo video:', err);
      const msg = err?.response?.data?.message || err?.message || 'Không thể gửi báo cáo';
      showError('Lỗi', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div
      ref={containerRef}
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-250 ${visible && !closing ? 'bg-black/60 backdrop-blur-sm' : 'bg-transparent'}`}
      onClick={handleClose}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className={`w-full max-w-[480px] max-h-[70vh] mx-4 rounded-2xl flex flex-col transition-all duration-250 ease-out border shadow-2xl overflow-hidden ${visible && !closing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        style={{
          background: 'var(--vt-card)',
          borderColor: 'var(--color-border)',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b shrink-0" style={{ borderColor: 'var(--color-border)' }}>
          <h3 className="text-[17px] font-semibold m-0" style={{ color: 'var(--color-text-primary)' }}>Báo cáo</h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full transition-colors cursor-pointer border-none bg-transparent hover:bg-black/5 dark:hover:bg-white/10"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            <CloseMenuIcon size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain pr-1 custom-modal-scrollbar"
        >
          <p className="px-5 pt-4 pb-2 text-[13px] m-0" style={{ color: 'var(--color-text-muted)' }}>
            Vui lòng chọn tình huống
          </p>

          {REPORT_REASONS.map((reason, i) => (
            <button
              key={i}
              disabled={submitting}
              onClick={() => handleSelectReason(reason)}
              className="w-full px-5 py-3.5 bg-transparent hover:bg-black/5 dark:hover:bg-white/5 active:bg-black/10 dark:active:bg-white/10 transition-colors text-left disabled:opacity-50 cursor-pointer border-b last:border-0"
              style={{ borderColor: 'var(--color-border)' }}
            >
              <span className="text-[14.5px] leading-snug" style={{ color: 'var(--color-text-primary)' }}>{reason}</span>
            </button>
          ))}

          {/* Mục "Khác" */}
          <div className="px-5 py-3.5 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <button
              type="button"
              disabled={submitting}
              onClick={() => setShowOtherInput(!showOtherInput)}
              className="w-full text-left font-medium text-[14.5px] bg-transparent border-none transition-colors cursor-pointer flex items-center justify-between p-0"
              style={{ color: 'var(--color-text-primary)' }}
            >
              <span>Khác</span>
              <span className="text-[12px] text-primary font-normal">
                {showOtherInput ? 'Thu gọn' : 'Nhập chi tiết'}
              </span>
            </button>

            {showOtherInput && (
              <form onSubmit={handleSubmitOther} className="mt-3 flex flex-col gap-3">
                <textarea
                  value={otherText}
                  onChange={(e) => setOtherText(e.target.value)}
                  placeholder="Vui lòng nhập chi tiết lý do báo cáo..."
                  maxLength={500}
                  rows={3}
                  className="w-full rounded-xl border text-[14px] p-3 resize-none outline-none focus:border-primary transition-colors"
                  style={{
                    background: 'var(--vt-input)',
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-primary)',
                  }}
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-[12px]" style={{ color: 'var(--color-text-muted)' }}>{otherText.length}/500</span>
                  <button
                    type="submit"
                    disabled={!otherText.trim() || submitting}
                    className="px-4 py-2 rounded-lg bg-primary text-white font-medium text-[13.5px] hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer border-none"
                  >
                    {submitting ? 'Đang gửi...' : 'Gửi báo cáo'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Bottom safe area */}
        <div className="h-3 shrink-0" />
      </div>
    </div>
  );
}
