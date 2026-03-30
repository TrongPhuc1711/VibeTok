import React, { useState, useEffect } from 'react';
import { getAllTracks } from '../../services/musicService';
import { formatDuration } from '../../utils/formatters';
import AudioWaves from './AudioWaves';
import { MusicNoteIcon, MusicSearchIcon } from '../../icons/CommonIcons';

export default function MusicPanel({ selectedTrackId, onSelect }) {
  const [tracks, setTracks] = useState([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAllTracks({ limit: 30 })
      .then(r => setTracks(r.data.tracks || []))
      .catch(() => setTracks([]))
      .finally(() => setLoading(false));
  }, []);

  const filtered = tracks.filter(
    t =>
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
            onChange={e => setSearch(e.target.value)}
            placeholder="Tìm âm nhạc..."
            className="flex-1 bg-transparent border-none outline-none text-white text-[13px] font-body placeholder:text-text-faint"
          />
        </div>
      </div>

      {/* Track list */}
      <div className="flex-1 overflow-auto">
        {loading ? (
          <p className="text-center text-text-faint text-sm py-8 font-body">Đang tải...</p>
        ) : filtered.length === 0 ? (
          <p className="text-center text-text-faint text-sm py-8 font-body">
            {search ? 'Không tìm thấy bài hát' : 'Chưa có nhạc trong DB'}
          </p>
        ) : (
          filtered.map(track => {
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
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0
                                    ${selected ? 'bg-brand-gradient' : 'bg-gradient-to-br from-border to-border2'}`}>
                  <MusicNoteIcon active={selected} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-[13px] font-body m-0 truncate ${selected ? 'text-primary font-semibold' : 'text-[#ddd]'}`}>
                    {track.title}
                  </p>
                  <p className="text-text-faint text-xs font-body m-0">{track.artist}</p>
                </div>
                {selected
                  ? <AudioWaves />
                  : <span className="text-text-subtle text-xs font-body">{formatDuration(track.duration)}</span>
                }
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}