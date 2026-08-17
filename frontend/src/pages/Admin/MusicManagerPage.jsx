import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/Sidebar/AdminLayout';
import { CloseAdminIcon, TrashAdminIcon, PlusAdminIcon, MusicAdminIcon, TrendingAdminIcon } from '../../icons/AdminIcons';
import StatCard from '../../components/ui/StatCard';
import AdminBtn from './components/AdminBtn';
import AdminFilters from './components/AdminFilters';
import AdminPagination from './components/AdminPagination';
import { BounceDots } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { getAdminMusic, getMusicCounts, createMusic, updateMusic, deleteMusic, toggleMusicTrending } from '../../services/adminService';

const fmt = (n) => {
    n = Number(n) || 0;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
};

const fmtDuration = (secs) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
};

const PAGE_SIZE = 10;

const FILTERS = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Thịnh hành', value: 'trending' },
    { label: 'Bình thường', value: 'normal' },
];

// Music Form Modal
function MusicFormModal({ track, onClose, onSuccess }) {
    const isEdit = !!track;
    const [form, setForm] = useState({
        title: track?.title || '',
        artist: track?.artist || '',
        duration: track?.duration || 0,
        audioFile: null,
        audioUrl: track?.audioUrl || '',
        coverFile: null,
        coverUrl: track?.cover || '',
        trending: track?.trending || false,
    });
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { showSuccess, showError } = useToast();

    const set = (field) => (e) => {
        const val = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
        setForm(p => ({ ...p, [field]: val }));
        setError('');
    };

    const handleAudioChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm(p => ({ ...p, audioFile: file }));
            const objectUrl = URL.createObjectURL(file);
            const audio = new Audio(objectUrl);
            audio.onloadedmetadata = () => {
                setForm(p => ({ ...p, duration: Math.round(audio.duration) }));
                URL.revokeObjectURL(objectUrl);
            };
        }
    };

    const handleCoverChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setForm(p => ({ ...p, coverFile: file, coverUrl: URL.createObjectURL(file) }));
        }
    };

    const handleSubmit = async () => {
        setError('');
        if (!form.title.trim() || !form.artist.trim()) {
            setError('Tên bài hát và nghệ sĩ là bắt buộc!');
            return;
        }
        if (!isEdit && !form.audioFile) {
            setError('File âm thanh là bắt buộc khi thêm bài hát mới!');
            return;
        }

        const formData = new FormData();
        formData.append('title', form.title);
        formData.append('artist', form.artist);
        formData.append('duration', form.duration);
        formData.append('trending', form.trending);
        
        if (form.audioFile) formData.append('audio', form.audioFile);
        if (form.coverFile) formData.append('cover', form.coverFile);

        setLoading(true);
        try {
            if (isEdit) {
                await updateMusic(track.id, formData);
                showSuccess('Thành công', 'Đã cập nhật bài hát');
            } else {
                await createMusic(formData);
                showSuccess('Thành công', 'Đã thêm bài hát mới');
            }
            onSuccess();
            onClose();
        } catch (e) {
            const msg = e.response?.data?.message || 'Không thể lưu bài hát';
            setError(msg);
            showError('Lỗi', msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: 'var(--vt-backdrop)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-[500px] rounded-2xl border overflow-hidden"
                style={{ background: 'var(--vt-card)', borderColor: 'var(--color-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                        <h3 className="text-[15px] font-display font-bold m-0" style={{ color: 'var(--color-text-primary)' }}>
                            {isEdit ? 'Chỉnh sửa bài hát' : 'Thêm bài hát mới'}
                        </h3>
                        {isEdit && <p className="text-[11px] font-body mt-0.5 m-0" style={{ color: 'var(--color-text-muted)' }}>ID: {track.id}</p>}
                    </div>
                    <button onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border cursor-pointer transition-colors"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        <CloseAdminIcon size={12} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-3">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-500 text-[12px] font-body">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[11px] font-body mb-1" style={{ color: 'var(--color-text-secondary)' }}>Tên bài hát *</label>
                            <input type="text" value={form.title} onChange={set('title')}
                                placeholder="Nhập tên bài hát"
                                className="w-full rounded-lg px-3 py-2 text-[13px] font-body outline-none transition-colors"
                                style={{ background: 'var(--vt-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                        </div>
                        <div>
                            <label className="block text-[11px] font-body mb-1" style={{ color: 'var(--color-text-secondary)' }}>Nghệ sĩ *</label>
                            <input type="text" value={form.artist} onChange={set('artist')}
                                placeholder="Tên nghệ sĩ"
                                className="w-full rounded-lg px-3 py-2 text-[13px] font-body outline-none transition-colors"
                                style={{ background: 'var(--vt-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-primary)' }} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[11px] font-body mb-1" style={{ color: 'var(--color-text-secondary)' }}>File âm thanh (.mp3, .wav) *</label>
                        <input type="file" accept="audio/*" onChange={handleAudioChange}
                            className="w-full rounded-lg px-3 py-2 text-[12px] font-body outline-none transition-colors file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-primary/20 file:text-primary cursor-pointer hover:file:bg-primary/30"
                            style={{ background: 'var(--vt-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }} />
                        {isEdit && !form.audioFile && form.audioUrl && (
                            <p className="text-[10px] mt-1 ml-1 truncate" style={{ color: 'var(--color-text-muted)' }}>Hiện tại: {form.audioUrl.split('/').pop()}</p>
                        )}
                    </div>

                    <div className="grid grid-cols-2 gap-3 items-end">
                        <div>
                            <label className="block text-[11px] font-body mb-1" style={{ color: 'var(--color-text-secondary)' }}>Ảnh bìa (Tùy chọn)</label>
                            <input type="file" accept="image/*" onChange={handleCoverChange}
                                className="w-full rounded-lg px-3 py-2 text-[12px] font-body outline-none transition-colors file:mr-3 file:py-1 file:px-2 file:rounded-md file:border-0 file:text-[11px] file:font-semibold file:bg-[#7c3aed22] file:text-[#7c3aed] cursor-pointer hover:file:bg-[#7c3aed33]"
                                style={{ background: 'var(--vt-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-secondary)' }} />
                        </div>
                        <div className="flex gap-3">
                            <div className="w-[38px] h-[38px] rounded flex items-center justify-center overflow-hidden shrink-0"
                                style={{ background: 'var(--vt-input)', border: '1px solid var(--color-border)' }}>
                                {form.coverUrl ? (
                                    <img src={form.coverUrl} alt="Cover preview" className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-[16px]">🎵</span>
                                )}
                            </div>
                            <div className="flex-1">
                                <label className="block text-[11px] font-body mb-1" style={{ color: 'var(--color-text-secondary)' }}>Thời lượng (giây)</label>
                                <input type="number" value={form.duration} onChange={set('duration')}
                                    min="0" placeholder="0" disabled
                                    className="w-full rounded-lg px-3 py-2 text-[13px] font-body outline-none cursor-not-allowed opacity-60"
                                    style={{ background: 'var(--vt-input)', border: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }} />
                            </div>
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={form.trending} onChange={set('trending')}
                            className="w-4 h-4 rounded accent-primary" />
                        <span className="text-[12px] font-body" style={{ color: 'var(--color-text-secondary)' }}>Đánh dấu thịnh hành</span>
                    </label>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <button onClick={onClose}
                        className="px-4 py-2 rounded-lg text-[12px] font-body bg-transparent border cursor-pointer transition-colors"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        Hủy
                    </button>
                    <button onClick={handleSubmit} disabled={loading}
                        className="px-4 py-2 rounded-lg text-[12px] font-body font-semibold text-white cursor-pointer border-none transition-all disabled:opacity-50"
                        style={{ background: 'linear-gradient(135deg, #ff2d78, #7c3aed)' }}>
                        {loading ? 'Đang xử lý...' : isEdit ? 'Cập nhật' : 'Thêm bài hát'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════ Delete Confirm Modal ═══════
function DeleteConfirmModal({ track, onClose, onConfirm }) {
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        setLoading(true);
        await onConfirm();
        setLoading(false);
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: 'var(--vt-backdrop)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="w-[380px] rounded-2xl border overflow-hidden"
                style={{ background: 'var(--vt-card)', borderColor: 'var(--color-border)', boxShadow: '0 20px 60px rgba(0,0,0,0.3)' }}>
                <div className="px-5 py-5 text-center">
                    <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                        style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
                        <TrashAdminIcon size={24} color="#ef4444" />
                    </div>
                    <h3 className="text-[15px] font-display font-bold mb-1" style={{ color: 'var(--color-text-primary)' }}>Xóa bài hát?</h3>
                    <p className="text-[12px] font-body leading-relaxed" style={{ color: 'var(--color-text-muted)' }}>
                        Bạn có chắc muốn xóa <strong style={{ color: 'var(--color-text-primary)' }}>{track.title}</strong> của <strong style={{ color: 'var(--color-text-secondary)' }}>{track.artist}</strong>?
                        Hành động này không thể hoàn tác.
                    </p>
                </div>
                <div className="flex items-center justify-center gap-2 px-5 py-3.5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <button onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg text-[12px] font-body bg-transparent border cursor-pointer transition-colors"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}>
                        Hủy
                    </button>
                    <button onClick={handleConfirm} disabled={loading}
                        className="flex-1 px-4 py-2 rounded-lg text-[12px] font-body font-semibold text-white cursor-pointer border-none transition-all disabled:opacity-50"
                        style={{ background: '#ef4444' }}>
                        {loading ? 'Đang xóa...' : 'Xóa'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════ Main Page ═══════
export default function MusicManagerPage() {
    const { showSuccess, showError } = useToast();
    const [tracks, setTracks] = useState([]);
    const [counts, setCounts] = useState({ all: 0, trending: 0, normal: 0 });
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [formTrack, setFormTrack] = useState(undefined); // undefined = closed, null = add, object = edit
    const [deleteTrack, setDeleteTrack] = useState(null);

    const fetchTracks = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminMusic({ filter, search, page, limit: PAGE_SIZE });
            setTracks(res.tracks);
            setTotal(res.total);
            setTotalPages(res.totalPages);
        } catch {
            showError('Lỗi', 'Không thể tải danh sách nhạc');
        } finally {
            setLoading(false);
        }
    }, [filter, search, page]);

    const fetchCounts = useCallback(async () => {
        try {
            const c = await getMusicCounts();
            setCounts(c);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { fetchTracks(); }, [fetchTracks]);
    useEffect(() => { fetchCounts(); }, []);

    const handleFilter = (f) => { setFilter(f); setPage(1); };
    const handleSearch = (s) => { setSearch(s); setPage(1); };

    const handleToggleTrending = async (id) => {
        setActionLoading(id);
        try {
            const res = await toggleMusicTrending(id);
            showSuccess('Thành công', res.message);
            fetchTracks();
            fetchCounts();
        } catch (e) {
            showError('Lỗi', e.response?.data?.message || 'Không thể thay đổi');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDelete = async (id) => {
        try {
            await deleteMusic(id);
            showSuccess('Thành công', 'Đã xóa bài hát');
            setDeleteTrack(null);
            fetchTracks();
            fetchCounts();
        } catch (e) {
            showError('Lỗi', e.response?.data?.message || 'Không thể xóa');
        }
    };

    const filtersWithCounts = FILTERS.map(f => ({
        ...f,
        count: counts[f.value] ?? 0,
    }));

    return (
        <AdminLayout
            title="Quản lý âm nhạc"
            actions={
                <button
                    onClick={() => setFormTrack(null)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-body font-semibold text-white cursor-pointer border-none transition-all hover:opacity-90"
                    style={{ background: 'linear-gradient(135deg, #ff2d78, #7c3aed)' }}
                >
                    <PlusAdminIcon />
                    Thêm bài hát
                </button>
            }
        >
            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-5">
                <StatCard label="Tổng bài hát" value={fmt(counts.all)} change={0} positive accent />
                <StatCard label="Thịnh hành" value={fmt(counts.trending)} change={0} positive />
                <StatCard label="Bình thường" value={fmt(counts.normal)} change={0} positive />
            </div>

            {/* Filters */}
            <AdminFilters
                filters={filtersWithCounts}
                active={filter}
                onChange={handleFilter}
                search={search}
                onSearch={handleSearch}
                placeholder="Tìm bài hát, nghệ sĩ..."
            />

            {/* Table */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}>
                {loading ? (
                    <div className="flex items-center justify-center py-16"><BounceDots /></div>
                ) : tracks.length === 0 ? (
                    <p className="text-[12px] font-body text-center py-16" style={{ color: 'var(--color-text-muted)' }}>Không tìm thấy bài hát nào</p>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                {['Bài hát', 'Nghệ sĩ', 'Thời lượng', 'Lượt dùng', 'Trạng thái', 'Ngày thêm', 'Hành động'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-body font-medium whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tracks.map((t, i) => (
                                <tr key={t.id} className="transition-colors hover:bg-[var(--vt-hover)]" style={{ borderBottom: '1px solid var(--vt-divider)' }}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                                                style={{ background: t.cover ? 'transparent' : 'linear-gradient(135deg, #ff2d78, #7c3aed)' }}>
                                                {t.cover
                                                    ? <img src={t.cover} alt="" className="w-full h-full object-cover" />
                                                    : <MusicAdminIcon active />
                                                }
                                            </div>
                                            <p className="text-[12px] font-semibold font-body leading-tight m-0 max-w-[200px] truncate" style={{ color: 'var(--color-text-primary)' }} title={t.title}>
                                                {t.title}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-[11px] font-body max-w-[150px] truncate" style={{ color: 'var(--color-text-secondary)' }} title={t.artist}>{t.artist}</td>
                                    <td className="px-4 py-3 text-[11px] font-body whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>{fmtDuration(t.duration)}</td>
                                    <td className="px-4 py-3 text-[11px] font-body" style={{ color: 'var(--color-text-secondary)' }}>{fmt(t.uses)}</td>
                                    <td className="px-4 py-3">
                                        {t.trending ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                                                <TrendingAdminIcon size={10} />
                                                Thịnh hành
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-body px-2 py-0.5 rounded-full" style={{ background: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                                                Bình thường
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-[11px] font-body whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>{t.createdAt}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            <AdminBtn
                                                label={t.trending ? 'Bỏ trending' : 'Trending'}
                                                bg={t.trending ? '#f59e0b22' : '#10b98122'}
                                                color={t.trending ? '#f59e0b' : '#10b981'}
                                                onClick={() => handleToggleTrending(t.id)}
                                                disabled={actionLoading === t.id}
                                            />
                                            <AdminBtn label="Sửa" bg="#7c3aed22" color="#7c3aed"
                                                onClick={() => setFormTrack(t)} />
                                            <AdminBtn label="Xóa" bg="#ef444422" color="#ef4444"
                                                onClick={() => setDeleteTrack(t)} />
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
                <AdminPagination
                    page={page}
                    totalPages={totalPages}
                    total={total}
                    pageSize={PAGE_SIZE}
                    onPageChange={setPage}
                    label="bài hát"
                />
            </div>

            {/* Add/Edit Modal */}
            {formTrack !== undefined && (
                <MusicFormModal
                    track={formTrack}
                    onClose={() => setFormTrack(undefined)}
                    onSuccess={() => { fetchTracks(); fetchCounts(); }}
                />
            )}

            {/* Delete Confirm Modal */}
            {deleteTrack && (
                <DeleteConfirmModal
                    track={deleteTrack}
                    onClose={() => setDeleteTrack(null)}
                    onConfirm={() => handleDelete(deleteTrack.id)}
                />
            )}
        </AdminLayout>
    );
}
