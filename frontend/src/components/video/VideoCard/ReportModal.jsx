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
      className={`fixed inset-0 z-[9999] flex items-center justify-center transition-all duration-250 ${visible && !closing ? 'bg-black/60' : 'bg-transparent'}`}
      onClick={handleClose}
      onWheel={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
    >
      <div
        className={`w-full max-w-[480px] max-h-[70vh] mx-4 bg-[#1e1e1e] rounded-2xl flex flex-col transition-all duration-250 ease-out ${visible && !closing ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/10 shrink-0">
          <h3 className="text-white text-[17px] font-semibold">Báo cáo</h3>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-white/10 transition-colors text-white/70 hover:text-white cursor-pointer"
          >
            <CloseMenuIcon size={18} />
          </button>
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overscroll-contain pr-1"
        >
          <p className="px-5 pt-4 pb-2 text-[13px] text-white/50">
            Vui lòng chọn tình huống
          </p>

          {REPORT_REASONS.map((reason, i) => (
            <button
              key={i}
              disabled={submitting}
              onClick={() => handleSelectReason(reason)}
              className="w-full px-5 py-3.5 hover:bg-white/5 active:bg-white/10 transition-colors text-left disabled:opacity-50 cursor-pointer border-b border-white/[0.04] last:border-0"
            >
              <span className="text-white/90 text-[14.5px] leading-snug">{reason}</span>
            </button>
          ))}

          {/* Mục "Khác" */}
          <div className="px-5 py-3.5 border-t border-white/[0.08]">
            <button
              type="button"
              disabled={submitting}
              onClick={() => setShowOtherInput(!showOtherInput)}
              className="w-full text-left font-medium text-white/90 text-[14.5px] hover:text-white transition-colors cursor-pointer flex items-center justify-between"
            >
              <span>Khác</span>
              <span className="text-[12px] text-[#ff2d78] font-normal">
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
                  className="w-full rounded-xl bg-white/5 border border-white/10 text-white text-[14px] p-3 resize-none outline-none focus:border-[#ff2d78]/60 transition-colors placeholder:text-white/30"
                  autoFocus
                />
                <div className="flex items-center justify-between">
                  <span className="text-[12px] text-white/30">{otherText.length}/500</span>
                  <button
                    type="submit"
                    disabled={!otherText.trim() || submitting}
                    className="px-4 py-2 rounded-lg bg-[#ff2d78] text-white font-medium text-[13.5px] hover:bg-[#ff2d78]/90 disabled:opacity-40 disabled:cursor-not-allowed transition-all cursor-pointer"
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
