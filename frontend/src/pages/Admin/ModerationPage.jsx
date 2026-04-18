import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout    from '../../components/layout/Sidebar/AdminLayout';
import StatCard       from '../../components/ui/StatCard';
import StatusBadge    from '../../components/ui/StatusBadge';
import AdminBtn       from './components/AdminBtn';
import AdminFilters   from './components/AdminFilters';
import AdminPagination from './components/AdminPagination';
import { BounceDots } from '../../components/ui/Spinner';
import { useToast }   from '../../components/ui/Toast';
import { PlayAdminIcon } from '../../icons/AdminIcons';
import { getAdminVideos, getVideoCounts, hideVideo, restoreVideo } from '../../services/adminService';

const fmt = (n) => {
    n = Number(n) || 0;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
};

const PAGE_SIZE = 12;

const FILTERS = [
    { label: 'Tất cả',   value: 'all'    },
    { label: 'Đang hiển thị', value: 'active' },
    { label: 'Bản nháp', value: 'draft'  },
    { label: 'Đã ẩn',    value: 'hidden' },
];

export default function ModerationPage() {
    const { showSuccess, showError } = useToast();
    const [videos, setVideos]     = useState([]);
    const [counts, setCounts]     = useState({ all: 0, active: 0, draft: 0, hidden: 0 });
    const [filter, setFilter]     = useState('all');
    const [search, setSearch]     = useState('');
    const [page, setPage]         = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal]       = useState(0);
    const [loading, setLoading]   = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchVideos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminVideos({ status: filter, search, page, limit: PAGE_SIZE });
            setVideos(res.videos);
            setTotal(res.total);
            setTotalPages(res.totalPages);
        } catch {
            showError('Lỗi', 'Không thể tải danh sách video');
        } finally {
            setLoading(false);
        }
    }, [filter, search, page]);

    const fetchCounts = useCallback(async () => {
        try {
            const c = await getVideoCounts();
            setCounts(c);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { fetchVideos(); }, [fetchVideos]);
    useEffect(() => { fetchCounts(); }, []);

    const handleFilter = (f) => { setFilter(f); setPage(1); };
    const handleSearch = (s) => { setSearch(s); setPage(1); };

    const handleHide = async (id) => {
        setActionLoading(id);
        try {
            await hideVideo(id);
            showSuccess('Thành công', 'Đã ẩn video');
            fetchVideos();
            fetchCounts();
        } catch (e) {
            showError('Lỗi', e.response?.data?.message || 'Không thể ẩn video');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRestore = async (id) => {
        setActionLoading(id);
        try {
            await restoreVideo(id);
            showSuccess('Thành công', 'Đã khôi phục video');
            fetchVideos();
            fetchCounts();
        } catch (e) {
            showError('Lỗi', e.response?.data?.message || 'Không thể khôi phục');
        } finally {
            setActionLoading(null);
        }
    };

    const filtersWithCounts = FILTERS.map(f => ({
        ...f,
        count: counts[f.value] ?? 0,
    }));

    return (
        <AdminLayout title="Kiểm duyệt & Video">
            {/* Stats */}
            <div className="grid grid-cols-4 gap-4 mb-6">
                <StatCard label="Tổng video"       value={fmt(counts.all)}    change={0} positive accent />
                <StatCard label="Đang hiển thị"    value={fmt(counts.active)} change={0} positive />
                <StatCard label="Bản nháp"         value={String(counts.draft)}  change={0} positive />
                <StatCard label="Đã ẩn"            value={String(counts.hidden)} change={0} positive={false} />
            </div>

            {/* Filters */}
            <AdminFilters
                filters={filtersWithCounts}
                active={filter}
                onChange={handleFilter}
                search={search}
                onSearch={handleSearch}
                placeholder="Tìm video..."
            />

            {/* Video cards */}
            {loading ? (
                <div className="flex items-center justify-center py-16"><BounceDots /></div>
            ) : videos.length === 0 ? (
                <p className="text-[#444] text-[12px] font-body text-center py-16">Không tìm thấy video nào</p>
            ) : (
                <>
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        {videos.map(v => (
                            <div key={v.id} className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl overflow-hidden hover:border-primary/20 transition-colors group">
                                {/* Thumbnail */}
                                <div className="relative h-[120px] flex items-center justify-center bg-[#1a0a2e]">
                                    {v.thumbnail ? (
                                        <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors cursor-pointer">
                                            <PlayAdminIcon />
                                        </div>
                                    )}
                                    <div className="absolute top-2 left-2">
                                        <StatusBadge status={v.status === 'active' ? 'approved' : v.status === 'hidden' ? 'rejected' : 'pending'}
                                            label={v.status === 'active' ? 'Hiển thị' : v.status === 'hidden' ? 'Đã ẩn' : 'Nháp'} />
                                    </div>
                                    <span className="absolute bottom-2 right-2 text-[9px] font-bold font-body text-white bg-black/60 px-1.5 py-0.5 rounded">{v.duration}</span>
                                </div>

                                {/* Info */}
                                <div className="p-3">
                                    <p className="text-white text-[12px] font-semibold font-body leading-tight mb-1.5 line-clamp-1">{v.title}</p>
                                    <div className="flex items-center gap-1.5 mb-1">
                                        <div className="w-4 h-4 rounded-full flex items-center justify-center text-[7px] font-bold text-white shrink-0" style={{ background: v.color }}>{v.initials}</div>
                                        <span className="text-[#555] text-[10px] font-body">{v.creator}</span>
                                        <span className="text-[#333] text-[10px] font-body ml-auto">{v.submitTime}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-[9px] text-[#555] font-body mb-2.5">
                                        <span>👁 {fmt(v.views)}</span>
                                        <span>❤ {fmt(v.likes)}</span>
                                        <span>💬 {fmt(v.comments)}</span>
                                    </div>
                                    <div className="flex gap-1.5">
                                        {v.status === 'active' && (
                                            <button onClick={() => handleHide(v.id)}
                                                disabled={actionLoading === v.id}
                                                className="flex-1 text-[10px] font-semibold font-body py-1.5 rounded bg-red-500/15 text-red-400 border-none cursor-pointer hover:bg-red-500/25 disabled:opacity-40">
                                                Ẩn video
                                            </button>
                                        )}
                                        {v.status === 'hidden' && (
                                            <button onClick={() => handleRestore(v.id)}
                                                disabled={actionLoading === v.id}
                                                className="flex-1 text-[10px] font-semibold font-body py-1.5 rounded bg-emerald-500/15 text-emerald-400 border-none cursor-pointer hover:bg-emerald-500/25 disabled:opacity-40">
                                                Khôi phục
                                            </button>
                                        )}
                                        {v.status === 'draft' && (
                                            <span className="flex-1 text-[10px] font-body py-1.5 text-center text-[#555]">Bản nháp</span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Pagination */}
                    <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl overflow-hidden">
                        <AdminPagination
                            page={page}
                            totalPages={totalPages}
                            total={total}
                            pageSize={PAGE_SIZE}
                            onPageChange={setPage}
                            label="video"
                        />
                    </div>
                </>
            )}
        </AdminLayout>
    );
}