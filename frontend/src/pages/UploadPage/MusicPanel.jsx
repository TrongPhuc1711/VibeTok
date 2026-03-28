import React, { useState } from 'react';
import { mockTracks } from '../../services/mockData';
import { formatDuration } from '../../utils/formatters';
import AudioWaves from './AudioWaves';
import { MusicNoteIcon, MusicSearchIcon } from '../../icons/CommonIcons';

/*
 MusicPanel — panel chọn nhạc nền phía phải UploadPage
 
 Props:
 selectedTrackId – string
 onSelect        – (track) => void
 */
export default function MusicPanel({ selectedTrackId, onSelect }) {
  const [search, setSearch] = useState('');

  const filtered = mockTracks.filter(
    (t) =>
      t.title.toLowerCase().includes(search.toLowerCase()) ||
      t.artist.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="w-[320px] border-l border-border flex flex-col overflow-hidden shrink-0">
      {/* Header + search */}
      <div className="p-4 border-b border-border">
        <h3 className="text-[#ddd] text-sm font-semibold font-body mb-3">Chọn nhạc nền</h3>
        <div className="bg-elevated border border-border2 rounded-lg flex items-center gap-2.5 px-3 py-2">
          <MusicSearchIcon />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Tìm âm nhạc..."
            className="flex-1 bg-transparent border-none outline-none text-white text-[13px] font-body placeholder:text-text-faint"
          />
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-auto">
        {filtered.map((track) => {
          const selected = selectedTrackId === track.id;
          return (
            <div
              key={track.id}
              onClick={() => onSelect(track)}
              className={`
                flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors border-l-2
                ${selected
                  ? 'bg-primary/8 border-primary'
                  : 'bg-transparent border-transparent hover:bg-white/5'
                }
              `}
            >
              {/* Icon */}
              <div
                className={`
                  w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                  ${selected
                    ? 'bg-brand-gradient'
                    : 'bg-gradient-to-br from-border to-border2'
                  }
                `}
              >
                <MusicNoteIcon active={selected} />
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <p
                  className={`text-[13px] font-body m-0 truncate ${selected ? 'text-primary font-semibold' : 'text-[#ddd]'}`}
                >
                  {track.title}
                </p>
                <p className="text-text-faint text-xs font-body m-0">{track.artist}</p>
              </div>

              {/* Duration / waves */}
              {selected
                ? <AudioWaves />
                : <span className="text-text-subtle text-xs font-body">{formatDuration(track.duration)}</span>
              }
            </div>
          );
        })}
      </div>
    </div>
  );
}