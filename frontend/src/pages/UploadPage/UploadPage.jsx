import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import PageLayout from '../components/layout/PageLayout';
import FormInput from '../components/common/FormInput';
import Button from '../../components/ui/Button';
import { useUpload } from '../../hooks/useUpload';
import { mockTracks } from '../../services/mockData';
import { VIDEO_PRIVACY_LABELS, DUET_LABELS, DUET_OPTIONS, ROUTES } from '../../utils/constants';
import { formatDuration } from '../../utils/formatters';
import UserDropdown from '../../components/layout/UserDropdown';

export default function UploadPage() {
    const navigate = useNavigate();
    const fileRef = useRef(null);
    const { form, file, errors, uploading, progress, setField, selectFile, submit } =
        useUpload({ onSuccess: () => setTimeout(() => navigate(ROUTES.HOME), 800) });

    const [trackId, setTrackId] = React.useState(mockTracks[0].id);
    const [mSearch, setMSearch] = React.useState('');

    const filteredTracks = mockTracks.filter(t =>
        t.title.toLowerCase().includes(mSearch.toLowerCase()) ||
        t.artist.toLowerCase().includes(mSearch.toLowerCase())
    );

    return (
        <PageLayout>
            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-border shrink-0">
                <h1 className="font-display font-bold text-[22px] text-white m-0">Đăng video mới</h1>
                <UserDropdown/>
                {/* <div className="w-9 h-9 rounded-full bg-brand-gradient flex items-center justify-center text-xs font-bold text-white">MV</div> */}
            </div>

            {/* Body */}
            <div className="flex-1 flex overflow-hidden">
                {/* Left — video + form */}
                <div className="flex-1 overflow-auto p-6">
                    <div className="flex gap-6 items-start">
                        {/* Drop zone / preview */}
                        <div className="shrink-0">
                            {file
                                ? <VideoPreview file={file} />
                                : <DropZone error={errors.file} onSelect={selectFile} fileRef={fileRef} />
                            }
                        </div>

                        {/* Form */}
                        <div className="flex-1 flex flex-col gap-4">
                            {/* Caption */}
                            <div>
                                <label className="block text-text-secondary text-[13px] font-medium mb-2 font-body">Thông tin video</label>
                                <div className={`bg-elevated border rounded-lg overflow-hidden ${errors.caption ? 'border-primary' : 'border-border2'}`}>
                                    <textarea
                                        value={form.caption}
                                        onChange={e => { if (e.target.value.length <= 500) setField('caption')(e.target.value); }}
                                        placeholder="Mô tả video, #hashtag..."
                                        rows={3}
                                        className="w-full bg-transparent border-none outline-none text-white text-[13px] font-body p-3.5 resize-none"
                                    />
                                    {form.caption && (
                                        <div className="px-3.5 pb-2.5 flex flex-wrap gap-1.5">
                                            {(form.caption.match(/#[\w]+/g) || []).map(tag => (
                                                <span key={tag} className="bg-primary/10 border border-primary/30 rounded-full px-2.5 py-0.5 text-primary text-xs">{tag}</span>
                                            ))}
                                        </div>
                                    )}
                                    <div className={`px-3.5 pb-2.5 text-right text-[11px] ${form.caption.length > 450 ? 'text-primary' : 'text-text-subtle'}`}>
                                        {form.caption.length}/500
                                    </div>
                                </div>
                                {errors.caption && <p className="text-primary text-[11px] mt-1">{errors.caption}</p>}
                            </div>

                            {/* Privacy + Duet */}
                            <div className="grid grid-cols-2 gap-3">
                                <SelectField
                                    label="Quyền xem" value={form.privacy}
                                    options={Object.entries(VIDEO_PRIVACY_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                                    onChange={setField('privacy')}
                                />
                                <SelectField
                                    label="Cho phép"
                                    value={form.allowDuet && form.allowStitch ? 'both' : form.allowDuet ? 'duet' : form.allowStitch ? 'stitch' : 'none'}
                                    options={Object.entries(DUET_LABELS).map(([v, l]) => ({ value: v, label: l }))}
                                    onChange={v => {
                                        setField('allowDuet')(v === DUET_OPTIONS.BOTH || v === DUET_OPTIONS.DUET);
                                        setField('allowStitch')(v === DUET_OPTIONS.BOTH || v === DUET_OPTIONS.STITCH);
                                    }}
                                />
                            </div>

                            <FormInput label="Vị trí" value={form.location} onChange={setField('location')}
                                placeholder="Đà Lạt, Lâm Đồng, Việt Nam" icon={<LocIcon />} />

                            <div className="grid grid-cols-2 gap-3">
                                <SelectField label="Lên lịch đăng" value={form.scheduleType}
                                    options={[{ value: 'now', label: 'Đăng ngay' }, { value: 'schedule', label: 'Lên lịch' }]}
                                    onChange={setField('scheduleType')} />
                                <SelectField label="Thumbnail" value={form.thumbnail}
                                    options={[{ value: 'auto', label: 'Tự động' }, { value: 'custom', label: 'Tuỳ chỉnh' }]}
                                    onChange={setField('thumbnail')} />
                            </div>

                            {/* Progress */}
                            {uploading && (
                                <div>
                                    <div className="h-1 bg-border rounded overflow-hidden">
                                        <div className="h-full bg-brand-gradient rounded transition-all duration-200" style={{ width: `${progress}%` }} />
                                    </div>
                                    <p className="text-text-faint text-xs mt-1.5 font-body">Đang đăng... {Math.round(progress)}%</p>
                                </div>
                            )}

                            {errors.submit && (
                                <div className="bg-primary/10 border border-primary/30 rounded-lg px-4 py-2.5 text-primary text-[13px] font-body">
                                    {errors.submit}
                                </div>
                            )}

                            {/* Submit */}
                            <div className="flex gap-3 mt-1">
                                <Button variant="ghost" onClick={() => submit(true)} disabled={uploading} className="flex-1">Lưu nháp</Button>
                                <Button onClick={() => submit(false)} loading={uploading} className="flex-[2]">Đăng lên VibeTok</Button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right — music */}
                <div className="w-[320px] border-l border-border flex flex-col overflow-hidden shrink-0">
                    <div className="p-4 border-b border-border">
                        <h3 className="text-[#ddd] text-sm font-semibold font-body mb-3">Chọn nhạc nền</h3>
                        <div className="bg-elevated border border-border2 rounded-lg flex items-center gap-2.5 px-3 py-2">
                            <MSearchIcon />
                            <input type="text" value={mSearch} onChange={e => setMSearch(e.target.value)} placeholder="Tìm âm nhạc..."
                                className="flex-1 bg-transparent border-none outline-none text-white text-[13px] font-body placeholder:text-text-faint" />
                        </div>
                    </div>
                    <div className="flex-1 overflow-auto">
                        {filteredTracks.map(track => {
                            const sel = trackId === track.id;
                            return (
                                <div key={track.id} onClick={() => { setTrackId(track.id); setField('music')(track); }}
                                    className={`flex items-center gap-3 px-4 py-3.5 cursor-pointer transition-colors border-l-2
                    ${sel ? 'bg-primary/8 border-primary' : 'bg-transparent border-transparent hover:bg-white/5'}`}>
                                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${sel ? 'bg-brand-gradient' : 'bg-gradient-to-br from-border to-border2'}`}>
                                        <MNoteIcon active={sel} />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <p className={`text-[13px] font-body m-0 truncate ${sel ? 'text-primary font-semibold' : 'text-[#ddd]'}`}>{track.title}</p>
                                        <p className="text-text-faint text-xs font-body m-0">{track.artist}</p>
                                    </div>
                                    {sel ? <AudioWaves /> : <span className="text-text-subtle text-xs font-body">{formatDuration(track.duration)}</span>}
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </PageLayout>
    );
}

// ── Sub-components ────────────────────────────────────────────

function DropZone({ error, onSelect, fileRef }) {
    const [drag, setDrag] = React.useState(false);
    return (
        <div
            className={`w-[260px] h-[390px] rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer transition-all border-2 border-dashed
        ${drag ? 'border-primary bg-primary/5' : error ? 'border-primary bg-surface' : 'border-border2 bg-surface hover:border-primary/40'}`}
            onClick={() => fileRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDrag(true); }}
            onDragLeave={() => setDrag(false)}
            onDrop={e => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onSelect(f); }}>
            <input ref={fileRef} type="file" accept="video/*" className="hidden" onChange={e => onSelect(e.target.files?.[0])} />
            <div className="w-[60px] h-[60px] rounded-full bg-primary/10 flex items-center justify-center"><UpVidIcon /></div>
            <p className="text-[#ddd] text-sm font-semibold font-body m-0">Chọn video để tải lên</p>
            <p className="text-text-faint text-xs font-body m-0 text-center px-5">Kéo thả hoặc click để chọn</p>
            <p className="text-text-subtle text-[11px] font-body m-0">MP4, MOV, AVI · Tối đa 500MB</p>
            {error && <p className="text-primary text-xs">{error}</p>}
        </div>
    );
}

function VideoPreview({ file }) {
    const url = React.useMemo(() => URL.createObjectURL(file), [file]);
    return (
        <div className="w-[260px] h-[390px] rounded-xl overflow-hidden bg-black relative">
            <video src={url} controls className="w-full h-full object-cover" />
            <div className="absolute bottom-0 left-0 right-0 px-3 py-2.5" style={{ background: 'linear-gradient(to top,rgba(0,0,0,.8),transparent)' }}>
                <p className="text-white text-xs font-body m-0 truncate">{file.name}</p>
            </div>
        </div>
    );
}

function SelectField({ label, value, options, onChange }) {
    const [isOpen, setIsOpen] = React.useState(false);
    const containerRef = React.useRef(null);

    // Đóng dropdown khi nhấn ra ngoài
    React.useEffect(() => {
        const handleClickOutside = (event) => {
            if (containerRef.current && !containerRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="relative" ref={containerRef}>
            <label className="block text-text-secondary text-xs font-medium mb-1.5 font-body">
                {label}
            </label>
            
            {/* Vùng hiển thị (Trigger) */}
            <div 
                onClick={() => setIsOpen(!isOpen)}
                className={`bg-elevated border ${isOpen ? 'border-primary' : 'border-border2'} 
                rounded-lg px-3.5 py-2.5 flex items-center justify-between cursor-pointer 
                transition-all hover:bg-[#2a2a2a]`}
            >
                <div>
                    <p className="text-text-faint text-[10px] font-body m-0 uppercase tracking-tighter">
                        {label}
                    </p>
                    <p className="text-[#eee] text-[13px] font-body m-0 mt-0.5 font-medium">
                        {selectedOption?.label || "Chọn..."}
                    </p>
                </div>
                <div className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                    <ChevIcon />
                </div>
            </div>

            {/* Danh sách lựa chọn tùy chỉnh */}
            {isOpen && (
                <ul className="absolute z-[100] w-full mt-1.5 bg-[#2a2a2a] border border-border2 rounded-xl shadow-2xl overflow-hidden py-1 animate-in fade-in zoom-in duration-100">
                    {options.map((option) => (
                        <li
                            key={option.value}
                            onClick={() => {
                                onChange(option.value);
                                setIsOpen(false);
                            }}
                            className={`px-4 py-2.5 text-[13px] font-body cursor-pointer transition-colors
                            ${option.value === value 
                                ? 'bg-primary/10 text-primary font-semibold' 
                                : 'text-[#ccc] hover:bg-[#383838] hover:text-white'
                            }`}
                        >
                            {option.label}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}

function AudioWaves() {
    return (
        <div className="flex gap-0.5 items-center h-3.5">
            {[0, 1, 2, 3].map(i => (
                <div key={i} className="w-[3px] bg-primary rounded-sm"
                    style={{ animation: `audioWave 0.8s ease-in-out ${i * 0.15}s infinite alternate` }} />
            ))}
            <style>{`@keyframes audioWave{from{height:4px}to{height:14px}}`}</style>
        </div>
    );
}

function LocIcon() {
    return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#666" strokeWidth="1.2">
        <path d="M8 1C5.79 1 4 2.79 4 5C4 8.25 8 15 8 15C8 15 12 8.25 12 5C12 2.79 10.21 1 8 1ZM8 6.5C7.17 6.5 6.5 5.83 6.5 5C6.5 4.17 7.17 3.5 8 3.5C8.83 3.5 9.5 4.17 9.5 5C9.5 5.83 8.83 6.5 8 6.5Z" />
    </svg>;
}
function MSearchIcon() {
    return <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#555" strokeWidth="1.2" strokeLinecap="round">
        <circle cx="6" cy="6" r="5" /><path d="M10 10l2.5 2.5" />
    </svg>;
}
function MNoteIcon({ active }) {
    return <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke={active ? '#fff' : '#555'} strokeWidth="1.3" strokeLinecap="round">
        <path d="M6 12V4l8-2v8" />
        <circle cx="4" cy="12" r="2" />
        <circle cx="12" cy="10" r="2" />
    </svg>;
}
function UpVidIcon() {
    return <svg width="28" height="28" viewBox="0 0 28 28" fill="none" stroke="#ff2d78" strokeWidth="1.8" strokeLinecap="round">
        <path d="M14 18V6M9 11l5-5 5 5" />
        <path d="M4 22v2h20v-2" />
    </svg>;
}
function ChevIcon() {
    return <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#555" strokeWidth="1.2" strokeLinecap="round">
        <path d="M3 4.5L6 7.5L9 4.5" />
    </svg>;
}