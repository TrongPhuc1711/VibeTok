import React, { useMemo } from 'react';

/*
 VideoPreview — preview file video đã chọn
 
 Props:
 file – File object
 */
export default function VideoPreview({ file }) {
  const url = useMemo(() => URL.createObjectURL(file), [file]);

  return (
    <div className="w-[260px] h-[390px] rounded-xl overflow-hidden bg-black relative">
      <video src={url} controls className="w-full h-full object-cover" />
      <div
        className="absolute bottom-0 left-0 right-0 px-3 py-2.5"
        style={{ background: 'linear-gradient(to top,rgba(0,0,0,.8),transparent)' }}
      >
        <p className="text-white text-xs font-body m-0 truncate">{file.name}</p>
      </div>
    </div>
  );
}