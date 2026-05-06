import React, { useState, useRef } from 'react';

import { ImageIcon, TrashIcon, PlusIcon } from '../../icons/SlideshowIcons';

const MAX_FILES = 20;
const ACCEPTED = 'image/jpeg,image/png,image/gif,image/webp,image/svg+xml';

/**
 * ImageUploadZone — vùng upload nhiều ảnh (tối đa 20).
 *
 * @param {Array}    images   — mảng { id, url, name }
 * @param {Function} onAdd    — (FileList) => void
 * @param {Function} onRemove — (id) => void
 * @param {Function} onClear  — () => void
 * @param {string}   error
 * @param {number}   maxFiles
 */
export default function ImageUploadZone({
  images = [],
  onAdd,
  onRemove,
  onClear,
  error = '',
  maxFiles = MAX_FILES,
}) {
  const [dragActive, setDragActive] = useState(false);
  const fileRef = useRef(null);
  const hasImages = images.length > 0;

  const handleFiles = (files) => {
    if (!files || files.length === 0) return;
    onAdd?.(files);
  };

  return (
    <div className="w-full">
      {/* Hidden input */}
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPTED}
        multiple
        className="hidden"
        onChange={(e) => { handleFiles(e.target.files); e.target.value = ''; }}
      />

      {/* Drop area */}
      <div
        className={`w-full rounded-xl flex flex-col items-center justify-center cursor-pointer transition-all border-2
          ${hasImages
            ? 'border-solid border border-border2 p-3.5 min-h-0'
            : `border-dashed bg-surface p-6 min-h-[180px]
               ${dragActive ? 'border-primary bg-primary/5' : 'border-border2 hover:border-primary/40'}`
          }`}
        onClick={() => !hasImages && fileRef.current?.click()}
        onDragOver={(e) => { e.preventDefault(); setDragActive(true); }}
        onDragLeave={() => setDragActive(false)}
        onDrop={(e) => { e.preventDefault(); setDragActive(false); handleFiles(e.dataTransfer.files); }}
      >
        {!hasImages ? (
          /* ── Empty state ── */
          <div className="flex flex-col items-center gap-2.5">
            <div className="w-[52px] h-[52px] rounded-full bg-primary/10 flex items-center justify-center">
              <ImageIcon />
            </div>
            <p className="text-[#ddd] text-sm font-semibold font-body m-0">
              Chọn ảnh để tải lên
            </p>
            <p className="text-text-faint text-xs font-body m-0 text-center">
              Kéo thả hoặc click để chọn (tối đa {maxFiles} ảnh)
            </p>
            <p className="text-text-subtle text-[11px] font-body m-0">
              JPG, PNG, GIF, WebP · Mỗi ảnh tối đa 20MB
            </p>
          </div>
        ) : (
          /* ── Thumbnail grid ── */
          <div className="grid gap-2 w-full" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(68px, 1fr))' }}>
            {images.map((img, i) => (
              <div
                key={img.id}
                className="group/thumb relative aspect-square rounded-[10px] overflow-hidden bg-elevated border border-border transition-transform hover:scale-[1.04] hover:shadow-lg"
              >
                <img
                  src={img.url}
                  alt={img.name || `Ảnh ${i + 1}`}
                  className="w-full h-full object-cover"
                  draggable={false}
                />

                {/* Nút xóa */}
                <button
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/65 backdrop-blur-sm text-[#ff4466] flex items-center justify-center border-none cursor-pointer p-0
                    opacity-85 md:opacity-0 md:group-hover/thumb:opacity-100 transition-opacity"
                  onClick={(e) => { e.stopPropagation(); onRemove?.(img.id); }}
                  aria-label={`Xóa ảnh ${i + 1}`}
                >
                  <TrashIcon size={10} />
                </button>

                {/* Số thứ tự */}
                <span className="absolute bottom-1 left-1 text-[9px] font-bold font-body text-white bg-black/55 rounded px-1.5 py-px pointer-events-none">
                  {i + 1}
                </span>
              </div>
            ))}

            {/* Nút thêm ảnh */}
            {images.length < maxFiles && (
              <button
                className="aspect-square rounded-[10px] border-2 border-dashed border-border2 bg-transparent flex flex-col items-center justify-center gap-1 cursor-pointer transition-colors hover:border-primary p-0"
                onClick={(e) => { e.stopPropagation(); fileRef.current?.click(); }}
                aria-label="Thêm ảnh"
              >
                <PlusIcon size={18} color="#666" />
                <span className="text-[9px] text-text-faint font-body">Thêm</span>
              </button>
            )}
          </div>
        )}
      </div>

      {/* Error */}
      {error && (
        <p className="text-primary text-xs font-body mt-1.5 text-center">{error}</p>
      )}

      {/* Footer */}
      {hasImages && (
        <div className="flex items-center justify-between mt-2 px-0.5">
          <span className="text-[11px] text-text-faint font-body">
            {images.length} / {maxFiles} ảnh
          </span>
          <button
            className="text-[11px] text-[#ff4466] font-body bg-transparent border-none cursor-pointer px-1.5 py-0.5 rounded hover:bg-[#ff4466]/10 transition-colors"
            onClick={onClear}
          >
            Xóa tất cả
          </button>
        </div>
      )}
    </div>
  );
}
