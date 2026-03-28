import React, { useState, useRef } from 'react';
import { UploadVideoIcon } from '../../icons/CommonIcons';

/*DropZone — vùng kéo thả / chọn file video
  Props:
error    – string
 onSelect – (File) => void
 */
export default function DropZone({ error, onSelect }) {
  const [drag, setDrag] = useState(false);
  const fileRef = useRef(null);

  return (
    <div
      className={`
        w-[260px] h-[390px] rounded-xl flex flex-col items-center justify-center gap-3
        cursor-pointer transition-all border-2 border-dashed
        ${drag
          ? 'border-primary bg-primary/5'
          : error
            ? 'border-primary bg-surface'
            : 'border-border2 bg-surface hover:border-primary/40'
        }
      `}
      onClick={() => fileRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
      onDragLeave={() => setDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        setDrag(false);
        const f = e.dataTransfer.files[0];
        if (f) onSelect(f);
      }}
    >
      <input
        ref={fileRef}
        type="file"
        accept="video/*"
        className="hidden"
        onChange={(e) => onSelect(e.target.files?.[0])}
      />

      <div className="w-[60px] h-[60px] rounded-full bg-primary/10 flex items-center justify-center">
        <UploadVideoIcon />
      </div>

      <p className="text-[#ddd] text-sm font-semibold font-body m-0">
        Chọn video để tải lên
      </p>
      <p className="text-text-faint text-xs font-body m-0 text-center px-5">
        Kéo thả hoặc click để chọn
      </p>
      <p className="text-text-subtle text-[11px] font-body m-0">
        MP4, MOV, AVI · Tối đa 500MB
      </p>

      {error && <p className="text-primary text-xs">{error}</p>}
    </div>
  );
}