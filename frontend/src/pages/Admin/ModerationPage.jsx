import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/Sidebar/AdminLayout';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import AdminBtn from './components/AdminBtn';
import AdminFilters from './components/AdminFilters';
import AdminPagination from './components/AdminPagination';
import { BounceDots } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import Avatar from '../../components/common/Avatar/avatar';
import { PlayAdminIcon } from '../../icons/AdminIcons';
import {
    getAdminVideos, getVideoCounts, hideVideo, restoreVideo,
    getAdminReports, getReportCounts, updateReportStatus, deleteReport,
} from '../../services/adminService';

const fmt = (n) => {
    n = Number(n) || 0;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
};

const PAGE_SIZE = 12;

const VIDEO_FILTERS = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Đang hiển thị', value: 'active' },
    { label: 'Bản nháp', value: 'draft' },
    { label: 'Đã ẩn', value: 'hidden' },
];

const REPORT_FILTERS = [
    { label: 'Tất cả báo cáo', value: 'all' },
    { label: 'Chờ xử lý', value: 'pending' },
    { label: 'Đã xem', value: 'reviewed' },
    { label: 'Đã giải quyết', value: 'resolved' },
];

export default function ModerationPage() {
    const { showSuccess, showError } = useToast();
    const [activeTab, setActiveTab] = useState('reports'); // 'videos' | 'reports'

    // Video State
    const [videos, setVideos] = useState([]);
    const [videoCounts, setVideoCounts] = useState({ all: 0, active: 0, draft: 0, hidden: 0 });
    const [videoFilter, setVideoFilter] = useState('all');
    const [videoSearch, setVideoSearch] = useState('');
    const [videoPage, setVideoPage] = useState(1);
    const [videoTotalPages, setVideoTotalPages] = useState(1);
    const [videoTotal, setVideoTotal] = useState(0);

    // Report State
    const [reports, setReports] = useState([]);
    const [reportCounts, setReportCounts] = useState({ all: 0, pending: 0, reviewed: 0, resolved: 0 });
    const [reportFilter, setReportFilter] = useState('all');
    const [reportSearch, setReportSearch] = useState('');
    const [reportPage, setReportPage] = useState(1);
    const [reportTotalPages, setReportTotalPages] = useState(1);
    const [reportTotal, setReportTotal] = useState(0);

    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    // Fetch Videos
    const fetchVideos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminVideos({ status: videoFilter, search: videoSearch, page: videoPage, limit: PAGE_SIZE });
            setVideos(res.videos || []);
            setVideoTotal(res.total || 0);
            setVideoTotalPages(res.totalPages || 1);
        } catch {
            showError('Lỗi', 'Không thể tải danh sách video');
        } finally {
            setLoading(false);
        }
    }, [videoFilter, videoSearch, videoPage]);

    const fetchVideoCounts = useCallback(async () => {
        try {
            const c = await getVideoCounts();
            setVideoCounts(c);
        } catch { /* ignore */ }
    }, []);

    // Fetch Reports
    const fetchReports = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminReports({ status: reportFilter, search: reportSearch, page: reportPage, limit: PAGE_SIZE });
            setReports(res.reports || []);
            setReportTotal(res.total || 0);
            setReportTotalPages(res.totalPages || 1);
        } catch {
            showError('Lỗi', 'Không thể tải danh sách báo cáo');
        } finally {
            setLoading(false);
        }
    }, [reportFilter, reportSearch, reportPage]);

    const fetchReportCounts = useCallback(async () => {
        try {
            const c = await getReportCounts();
            setReportCounts(c);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => {
        if (activeTab === 'videos') fetchVideos();
        else fetchReports();
    }, [activeTab, fetchVideos, fetchReports]);

    useEffect(() => {
        fetchVideoCounts();
        fetchReportCounts();
    }, [fetchVideoCounts, fetchReportCounts]);

    // Handlers for Video Actions
    const handleHideVideo = async (id) => {
        setActionLoading(id);
        try {
            await hideVideo(id);
            showSuccess('Thành công', 'Đã ẩn video');
            if (activeTab === 'videos') fetchVideos();
            else fetchReports();
            fetchVideoCounts();
        } catch (e) {
            showError('Lỗi', e.response?.data?.message || 'Không thể ẩn video');
        } finally {
            setActionLoading(null);
        }
    };

    const handleRestoreVideo = async (id) => {
        setActionLoading(id);
        try {
            await restoreVideo(id);
            showSuccess('Thành công', 'Đã khôi phục video');
            if (activeTab === 'videos') fetchVideos();
            else fetchReports();
            fetchVideoCounts();
        } catch (e) {
            showError('Lỗi', e.response?.data?.message || 'Không thể khôi phục');
        } finally {
            setActionLoading(null);
        }
    };

    // Handlers for Report Actions
    const handleUpdateReportStatus = async (id, status) => {
        setActionLoading(`report_${id}`);
        try {
            await updateReportStatus(id, status);
            showSuccess('Thành công', 'Đã cập nhật trạng thái báo cáo');
            fetchReports();
            fetchReportCounts();
        } catch (e) {
            showError('Lỗi', e.response?.data?.message || 'Không thể cập nhật báo cáo');
        } finally {
            setActionLoading(null);
        }
    };

    const handleDeleteReport = async (id) => {
        setActionLoading(`del_report_${id}`);
        try {
            await deleteReport(id);
            showSuccess('Thành công', 'Đã xóa báo cáo');
            fetchReports();
            fetchReportCounts();
        } catch (e) {
            showError('Lỗi', e.response?.data?.message || 'Không thể xóa báo cáo');
        } finally {
            setActionLoading(null);
        }
    };

    const videoFiltersWithCounts = VIDEO_FILTERS.map(f => ({ ...f, count: videoCounts[f.value] ?? 0 }));
    const reportFiltersWithCounts = REPORT_FILTERS.map(f => ({ ...f, count: reportCounts[f.value] ?? 0 }));

    return (
        <AdminLayout title="Kiểm duyệt & Báo cáo">
            {/* Top Navigation Tabs */}
            <div className="flex items-center gap-3 mb-6 border-b border-[#1a1a2a] pb-3">
                <button
                    onClick={() => { setActiveTab('reports'); setReportPage(1); }}
                    className={`px-4 py-2 rounded-xl text-[14px] font-semibold transition-all cursor-pointer ${
                        activeTab === 'reports'
                            ? 'bg-[#ff2d78] text-white shadow-lg shadow-[#ff2d78]/25'
                            : 'bg-[#0f0f1a] text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                >
                    🚩 Báo cáo vi phạm ({reportCounts.pending || 0} chờ xử lý)
                </button>
                <button
                    onClick={() => { setActiveTab('videos'); setVideoPage(1); }}
                    className={`px-4 py-2 rounded-xl text-[14px] font-semibold transition-all cursor-pointer ${
                        activeTab === 'videos'
                            ? 'bg-[#ff2d78] text-white shadow-lg shadow-[#ff2d78]/25'
                            : 'bg-[#0f0f1a] text-white/60 hover:text-white hover:bg-white/5'
                    }`}
                >
                    🎥 Tất cả Video ({videoCounts.all || 0})
                </button>
            </div>

            {/* TAB: BÁO CÁO VI PHẠM */}
            {activeTab === 'reports' && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <StatCard label="Tổng số báo cáo" value={fmt(reportCounts.all)} change={0} positive accent />
                        <StatCard label="Chờ xử lý" value={fmt(reportCounts.pending)} change={0} positive={false} />
                        <StatCard label="Đã xem" value={String(reportCounts.reviewed)} change={0} positive />
                        <StatCard label="Đã giải quyết" value={String(reportCounts.resolved)} change={0} positive />
                    </div>

                    {/* Filters */}
                    <AdminFilters
                        filters={reportFiltersWithCounts}
                        active={reportFilter}
                        onChange={(f) => { setReportFilter(f); setReportPage(1); }}
                        search={reportSearch}
                        onSearch={(s) => { setReportSearch(s); setReportPage(1); }}
                        placeholder="Tìm theo lý do, mô tả, tài khoản..."
                    />

                    {/* Report Table */}
                    {loading ? (
                        <div className="flex items-center justify-center py-16"><BounceDots /></div>
                    ) : reports.length === 0 ? (
                        <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl p-12 text-center">
                            <p className="text-[#666] text-[14px]">Chưa có báo cáo vi phạm nào</p>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-4 mb-6">
                                {reports.map((r) => (
                                    <div
                                        key={r.id}
                                        className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center hover:border-[#2a2a3e] transition-colors"
                                    >
                                        {/* Content info */}
                                        <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                            <div className="w-10 h-10 rounded-full bg-[#ff2d78]/10 text-[#ff2d78] flex items-center justify-center font-bold shrink-0 text-[18px]">
                                                🚩
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                    <span className="text-white font-semibold text-[15px]">{r.reason}</span>
                                                    <StatusBadge
                                                        status={r.status === 'resolved' ? 'approved' : r.status === 'reviewed' ? 'pending' : 'rejected'}
                                                        label={r.status === 'resolved' ? 'Đã giải quyết' : r.status === 'reviewed' ? 'Đã xem' : 'Chờ xử lý'}
                                                    />
                                                    <span className="text-[12px] text-[#555] ml-auto">
                                                        {new Date(r.created_at).toLocaleString('vi-VN')}
                                                    </span>
                                                </div>

                                                {r.description && (
                                                    <p className="text-[#aaa] text-[13.5px] bg-[#161625] p-2.5 rounded-lg border border-white/5 mb-2 font-mono leading-relaxed">
                                                        "{r.description}"
                                                    </p>
                                                )}

                                                <div className="flex items-center gap-4 text-[12.5px] text-[#777] flex-wrap">
                                                    <span>
                                                        Người báo cáo: <strong className="text-white">@{r.reporter_username || 'n/a'}</strong>
                                                    </span>
                                                    <span>•</span>
                                                    <span>
                                                        Video bị báo cáo: ID <code className="text-white bg-white/10 px-1.5 py-0.5 rounded">{r.video_id}</code>
                                                    </span>
                                                    {r.creator_username && (
                                                        <>
                                                            <span>•</span>
                                                            <span>
                                                                Tác giả: <strong className="text-[#ff2d78]">@{r.creator_username}</strong>
                                                            </span>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Actions */}
                                        <div className="flex items-center gap-2 shrink-0 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 border-white/5 w-full md:w-auto justify-end">
                                            {r.video_active ? (
                                                <button
                                                    onClick={() => handleHideVideo(r.video_id)}
                                                    disabled={actionLoading === r.video_id}
                                                    className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-400 text-[12.5px] font-semibold hover:bg-red-500/30 transition-colors cursor-pointer border-none disabled:opacity-50"
                                                >
                                                    Ẩn video
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={() => handleRestoreVideo(r.video_id)}
                                                    disabled={actionLoading === r.video_id}
                                                    className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-400 text-[12.5px] font-semibold hover:bg-emerald-500/30 transition-colors cursor-pointer border-none disabled:opacity-50"
                                                >
                                                    Khôi phục
                                                </button>
                                            )}

                                            {r.status !== 'resolved' && (
                                                <button
                                                    onClick={() => handleUpdateReportStatus(r.id, 'resolved')}
                                                    disabled={actionLoading === `report_${r.id}`}
                                                    className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-400 text-[12.5px] font-semibold hover:bg-blue-500/30 transition-colors cursor-pointer border-none disabled:opacity-50"
                                                >
                                                    Giải quyết
                                                </button>
                                            )}

                                            <button
                                                onClick={() => handleDeleteReport(r.id)}
                                                disabled={actionLoading === `del_report_${r.id}`}
                                                className="px-3 py-1.5 rounded-lg bg-white/10 text-white/70 text-[12.5px] font-semibold hover:bg-white/20 transition-colors cursor-pointer border-none disabled:opacity-50"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl overflow-hidden">
                                <AdminPagination
                                    page={reportPage}
                                    totalPages={reportTotalPages}
                                    total={reportTotal}
                                    pageSize={PAGE_SIZE}
                                    onPageChange={setReportPage}
                                    label="báo cáo"
                                />
                            </div>
                        </>
                    )}
                </>
            )}

            {/* TAB: QUẢN LÝ VIDEO */}
            {activeTab === 'videos' && (
                <>
                    {/* Stats */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <StatCard label="Tổng video" value={fmt(videoCounts.all)} change={0} positive accent />
                        <StatCard label="Đang hiển thị" value={fmt(videoCounts.active)} change={0} positive />
                        <StatCard label="Bản nháp" value={String(videoCounts.draft)} change={0} positive />
                        <StatCard label="Đã ẩn" value={String(videoCounts.hidden)} change={0} positive={false} />
                    </div>

                    {/* Filters */}
                    <AdminFilters
                        filters={videoFiltersWithCounts}
                        active={videoFilter}
                        onChange={(f) => { setVideoFilter(f); setVideoPage(1); }}
                        search={videoSearch}
                        onSearch={(s) => { setVideoSearch(s); setVideoPage(1); }}
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
                                                <Avatar user={{ anh_dai_dien: v.avatar, initials: v.initials, fullName: v.creator }} size="xs" className="!w-7 !h-7 !text-[9px]" />
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
                                                    <button onClick={() => handleHideVideo(v.id)}
                                                        disabled={actionLoading === v.id}
                                                        className="flex-1 text-[10px] font-semibold font-body py-1.5 rounded bg-red-500/15 text-red-400 border-none cursor-pointer hover:bg-red-500/25 disabled:opacity-40">
                                                        Ẩn video
                                                    </button>
                                                )}
                                                {v.status === 'hidden' && (
                                                    <button onClick={() => handleRestoreVideo(v.id)}
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
                                    page={videoPage}
                                    totalPages={videoTotalPages}
                                    total={videoTotal}
                                    pageSize={PAGE_SIZE}
                                    onPageChange={setVideoPage}
                                    label="video"
                                />
                            </div>
                        </>
                    )}
                </>
            )}
        </AdminLayout>
    );
}