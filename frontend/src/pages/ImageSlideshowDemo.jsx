import React from 'react';
import { useNavigate } from 'react-router-dom';

import { ImageSlideshow } from '../components/ui/ImageSlideshow';
import ImageUploadZone from './UploadPage/ImageUploadZone';
import { useImageList } from '../hooks/useSlideshow';

const FEATURES = [
  'Auto-play 3s', 'Swipe trái/phải', 'Progress bars', 'Loop vô hạn',
  'Tap chuyển ảnh', 'Responsive', 'Long press pause', 'Dot indicators',
];

/**
 * Trang demo standalone cho Image Slideshow.
 * Route: /slideshow-demo
 */
export default function ImageSlideshowDemo() {
  const navigate = useNavigate();
  const { images, addFiles, removeImage, clearAll, error } = useImageList({ maxFiles: 20 });

  return (
    <div className="min-h-dvh bg-base flex flex-col">
      {/* ── Header ── */}
      <header className="px-5 py-4 border-b border-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-[10px] bg-brand-gradient flex items-center justify-center text-sm font-extrabold text-white font-display">
            V
          </div>
          <div>
            <h1 className="font-display font-bold text-[17px] text-white m-0">Image Slideshow</h1>
            <p className="font-body text-[11px] text-text-faint m-0">TikTok-style carousel demo</p>
          </div>
        </div>
        <button
          className="bg-transparent border border-border2 text-text-secondary text-xs font-body px-3.5 py-1.5 rounded-lg cursor-pointer transition-all hover:border-primary/40 hover:text-white"
          onClick={() => navigate(-1)}
        >
          ← Quay lại
        </button>
      </header>

      {/* ── Body ── */}
      <div className="flex-1 flex flex-col md:flex-row md:items-start md:justify-center p-5 md:p-8 gap-5 md:gap-8 overflow-auto">

        {/* Preview phone frame */}
        <div className="shrink-0 w-full max-w-[340px] mx-auto md:mx-0 md:w-[320px]">
          <div
            className="w-full rounded-3xl overflow-hidden bg-[#111] border-2 border-border2"
            style={{
              aspectRatio: '9/16',
              boxShadow: '0 0 0 1px rgba(255,255,255,0.04), 0 20px 60px rgba(0,0,0,0.6), 0 0 40px rgba(255,45,120,0.08)',
            }}
          >
            {images.length > 0 ? (
              <ImageSlideshow images={images} autoPlay duration={3000} />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center gap-3 text-white/20 font-body text-center px-5">
                <span className="text-5xl opacity-30">📸</span>
                <p className="text-[13px] m-0 leading-relaxed">
                  Upload ảnh bên dưới<br />để xem preview slideshow
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex-1 max-w-full md:max-w-[480px] flex flex-col gap-4">
          {/* Upload */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <h2 className="font-body text-[13px] font-semibold text-text-secondary m-0 mb-3">📤 Upload ảnh</h2>
            <ImageUploadZone
              images={images}
              onAdd={addFiles}
              onRemove={removeImage}
              onClear={clearAll}
              error={error}
              maxFiles={20}
            />
          </div>

          {/* Stats */}
          {images.length > 0 && (
            <div className="bg-surface border border-border rounded-xl p-4">
              <h2 className="font-body text-[13px] font-semibold text-text-secondary m-0 mb-3">📊 Thông tin</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { value: images.length, label: 'Số ảnh' },
                  { value: '3s', label: 'Mỗi ảnh' },
                  { value: `${images.length * 3}s`, label: 'Tổng thời gian' },
                  { value: '∞', label: 'Loop' },
                ].map(({ value, label }) => (
                  <div key={label} className="bg-elevated rounded-[10px] p-3 text-center">
                    <p className="font-display text-[22px] font-bold text-primary m-0">{value}</p>
                    <p className="font-body text-[10px] text-text-faint mt-0.5 m-0">{label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Features */}
          <div className="bg-surface border border-border rounded-xl p-4">
            <h2 className="font-body text-[13px] font-semibold text-text-secondary m-0 mb-3">✨ Tính năng</h2>
            <div className="flex flex-wrap gap-1.5">
              {FEATURES.map((f) => (
                <span
                  key={f}
                  className="text-[10px] font-body text-primary/85 bg-primary/8 border border-primary/15 rounded-md px-2.5 py-1"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
