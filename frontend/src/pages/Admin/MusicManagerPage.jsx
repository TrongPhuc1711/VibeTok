import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/Sidebar/AdminLayout';
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

// ═══════ Music Form Modal ═══════
function MusicFormModal({ track, onClose, onSuccess }) {
    const isEdit = !!track;
    const [form, setForm] = useState({
        title: track?.title || '',
        artist: track?.artist || '',
        duration: track?.duration || 0,
        audioUrl: track?.audioUrl || '',
        cover: track?.cover || '',
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

    const handleSubmit = async () => {
        setError('');
        if (!form.title.trim() || !form.artist.trim()) {
            setError('Tên bài hát và nghệ sĩ là bắt buộc!');
            return;
        }
        setLoading(true);
        try {
            if (isEdit) {
                await updateMusic(track.id, form);
                showSuccess('Thành công', 'Đã cập nhật bài hát');
            } else {
                await createMusic(form);
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
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-[500px] rounded-2xl border overflow-hidden"
                style={{ background: '#0f0f1a', borderColor: '#1e1e2e', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1a1a2a' }}>
                    <div>
                        <h3 className="text-white text-[15px] font-display font-bold m-0">
                            {isEdit ? 'Chỉnh sửa bài hát' : 'Thêm bài hát mới'}
                        </h3>
                        {isEdit && <p className="text-[#555] text-[11px] font-body mt-0.5 m-0">ID: {track.id}</p>}
                    </div>
                    <button onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border border-[#1e1e2e] cursor-pointer text-[#555] hover:text-white hover:border-[#333] transition-colors">
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4 space-y-3">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-[12px] font-body">
                            {error}
                        </div>
                    )}

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[#777] text-[11px] font-body mb-1">Tên bài hát *</label>
                            <input type="text" value={form.title} onChange={set('title')}
                                placeholder="Nhập tên bài hát"
                                className="w-full bg-[#111120] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white text-[13px] font-body outline-none placeholder:text-[#333] focus:border-primary/50 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-[#777] text-[11px] font-body mb-1">Nghệ sĩ *</label>
                            <input type="text" value={form.artist} onChange={set('artist')}
                                placeholder="Tên nghệ sĩ"
                                className="w-full bg-[#111120] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white text-[13px] font-body outline-none placeholder:text-[#333] focus:border-primary/50 transition-colors" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[#777] text-[11px] font-body mb-1">URL âm thanh</label>
                        <input type="text" value={form.audioUrl} onChange={set('audioUrl')}
                            placeholder="https://... (.mp3, .wav)"
                            className="w-full bg-[#111120] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white text-[13px] font-body outline-none placeholder:text-[#333] focus:border-primary/50 transition-colors" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-[#777] text-[11px] font-body mb-1">URL ảnh bìa</label>
                            <input type="text" value={form.cover} onChange={set('cover')}
                                placeholder="https://... (jpg, png)"
                                className="w-full bg-[#111120] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white text-[13px] font-body outline-none placeholder:text-[#333] focus:border-primary/50 transition-colors" />
                        </div>
                        <div>
                            <label className="block text-[#777] text-[11px] font-body mb-1">Thời lượng (giây)</label>
                            <input type="number" value={form.duration} onChange={set('duration')}
                                min="0" placeholder="0"
                                className="w-full bg-[#111120] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white text-[13px] font-body outline-none placeholder:text-[#333] focus:border-primary/50 transition-colors" />
                        </div>
                    </div>

                    <label className="flex items-center gap-2 cursor-pointer select-none">
                        <input type="checkbox" checked={form.trending} onChange={set('trending')}
                            className="w-4 h-4 rounded accent-primary" />
                        <span className="text-[#999] text-[12px] font-body">Đánh dấu thịnh hành</span>
                    </label>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t" style={{ borderColor: '#1a1a2a' }}>
                    <button onClick={onClose}
                        className="px-4 py-2 rounded-lg text-[12px] font-body text-[#777] bg-transparent border border-[#1e1e2e] cursor-pointer hover:border-[#333] hover:text-white transition-colors">
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
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div className="w-[380px] rounded-2xl border overflow-hidden"
                style={{ background: '#0f0f1a', borderColor: '#1e1e2e', boxShadow: '0 20px 60px rgba(0,0,0,0.5)' }}>
                <div className="px-5 py-5 text-center">
                    <div className="w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center"
                        style={{ background: 'rgba(239, 68, 68, 0.15)' }}>
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2" strokeLinecap="round">
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                        </svg>
                    </div>
                    <h3 className="text-white text-[15px] font-display font-bold mb-1">Xóa bài hát?</h3>
                    <p className="text-[#666] text-[12px] font-body leading-relaxed">
                        Bạn có chắc muốn xóa <strong className="text-white">{track.title}</strong> của <strong className="text-[#999]">{track.artist}</strong>?
                        Hành động này không thể hoàn tác.
                    </p>
                </div>
                <div className="flex items-center justify-center gap-2 px-5 py-3.5 border-t" style={{ borderColor: '#1a1a2a' }}>
                    <button onClick={onClose}
                        className="flex-1 px-4 py-2 rounded-lg text-[12px] font-body text-[#777] bg-transparent border border-[#1e1e2e] cursor-pointer hover:border-[#333] hover:text-white transition-colors">
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
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
                        <path d="M6 1v10M1 6h10" />
                    </svg>
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
            <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16"><BounceDots /></div>
                ) : tracks.length === 0 ? (
                    <p className="text-[#444] text-[12px] font-body text-center py-16">Không tìm thấy bài hát nào</p>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1a1a2a]">
                                {['Bài hát', 'Nghệ sĩ', 'Thời lượng', 'Lượt dùng', 'Trạng thái', 'Ngày thêm', 'Hành động'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-body text-[#444] font-medium whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {tracks.map((t, i) => (
                                <tr key={t.id} className={`border-b border-[#1a1a2a]/40 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden"
                                                style={{ background: t.cover ? 'transparent' : 'linear-gradient(135deg, #ff2d78, #7c3aed)' }}>
                                                {t.cover
                                                    ? <img src={t.cover} alt="" className="w-full h-full object-cover" />
                                                    : <svg width="14" height="14" viewBox="0 0 18 18" fill="none" stroke="white" strokeWidth="1.4" strokeLinecap="round"><path d="M7 15V4l10-2v11" /><circle cx="4.5" cy="15" r="2.5" /><circle cx="14.5" cy="13" r="2.5" /></svg>
                                                }
                                            </div>
                                            <p className="text-white text-[12px] font-semibold font-body leading-tight m-0 max-w-[200px] truncate" title={t.title}>
                                                {t.title}
                                            </p>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-[#888] text-[11px] font-body max-w-[150px] truncate" title={t.artist}>{t.artist}</td>
                                    <td className="px-4 py-3 text-[#666] text-[11px] font-body whitespace-nowrap">{fmtDuration(t.duration)}</td>
                                    <td className="px-4 py-3 text-[#888] text-[11px] font-body">{fmt(t.uses)}</td>
                                    <td className="px-4 py-3">
                                        {t.trending ? (
                                            <span className="inline-flex items-center gap-1 text-[10px] font-body font-semibold px-2 py-0.5 rounded-full bg-primary/15 text-primary">
                                                <svg width="10" height="10" viewBox="0 0 24 24" fill="currentColor"><path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" /></svg>
                                                Thịnh hành
                                            </span>
                                        ) : (
                                            <span className="text-[10px] font-body px-2 py-0.5 rounded-full bg-[#1e1e2e] text-[#555]">
                                                Bình thường
                                            </span>
                                        )}
                                    </td>
                                    <td className="px-4 py-3 text-[#666] text-[11px] font-body whitespace-nowrap">{t.createdAt}</td>
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
