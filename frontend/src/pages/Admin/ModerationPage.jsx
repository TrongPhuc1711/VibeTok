import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
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
    getAdminVideos, getVideoCounts, hideVideo, restoreVideo, approveVideo,
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
    { label: 'Bị từ chối', value: 'rejected' },
];

const REPORT_FILTERS = [
    { label: 'Tất cả báo cáo', value: 'all' },
    { label: 'Chờ xử lý', value: 'pending' },
    { label: 'Đã xem', value: 'reviewed' },
    { label: 'Đã giải quyết', value: 'resolved' },
];

// ═══════ Danh sách lý do ẩn video có sẵn ═══════
const HIDE_REASONS = [
    'Vi phạm bản quyền',
    'Nội dung nhạy cảm / không phù hợp',
    'Spam / Quảng cáo',
    'Ngôn từ kích động thù hận',
    'Thông tin sai sự thật',
    'Bạo lực / Nguy hiểm',
    'Quấy rối / Bắt nạt',
    'Lý do khác',
];

// ═══════ Video Preview Modal ═══════
function VideoPreviewModal({ video, onClose, onHide, onRestore, onApprove }) {
    const videoRef = useRef(null);

    if (!video) return null;

    // Xác định URL video để phát
    const videoSrc = video.videoUrl || video.thumbnail || '';
    const isVideoFile = videoSrc && (
        videoSrc.includes('/video/') ||
        videoSrc.endsWith('.mp4') ||
        videoSrc.endsWith('.webm') ||
        videoSrc.endsWith('.mov')
    );

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="relative w-[90vw] max-w-[480px] rounded-2xl border overflow-hidden"
                style={{
                    background: '#0a0a14',
                    borderColor: '#1e1e2e',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.7)',
                }}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 border-none cursor-pointer text-white/70 hover:text-white hover:bg-black/80 transition-colors"
                >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                        <path d="M18 6L6 18M6 6l12 12" />
                    </svg>
                </button>

                {/* Video player area */}
                <div className="relative bg-black flex items-center justify-center" style={{ minHeight: 360, maxHeight: '60vh' }}>
                    {isVideoFile ? (
                        <video
                            ref={videoRef}
                            src={videoSrc}
                            controls
                            autoPlay
                            playsInline
                            className="w-full max-h-[60vh] object-contain"
                            style={{ background: '#000' }}
                        />
                    ) : videoSrc ? (
                        <img src={videoSrc} alt="" className="w-full max-h-[60vh] object-contain" />
                    ) : (
                        <div className="flex flex-col items-center justify-center py-16 text-[#555]">
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            <p className="text-[12px] font-body mt-2">Không có video để phát</p>
                        </div>
                    )}

                    {/* Status badge overlay */}
                    <div className="absolute top-3 left-3">
                        <StatusBadge
                            status={video.status === 'active' ? 'approved' : video.status === 'rejected' ? 'rejected' : video.status === 'hidden' ? 'rejected' : 'pending'}
                            label={video.status === 'active' ? 'Hiển thị' : video.status === 'rejected' ? 'Bị từ chối' : video.status === 'hidden' ? 'Đã ẩn' : 'Nháp'}
                        />
                    </div>
                </div>

                {/* Video info */}
                <div className="p-4">
                    <p className="text-white text-[14px] font-semibold font-body leading-snug mb-1.5 line-clamp-2">{video.title}</p>
                    <div className="flex items-center gap-2 mb-2">
                        <Avatar user={{ anh_dai_dien: video.avatar, initials: video.initials, fullName: video.creator }} size="xs" className="!w-6 !h-6 !text-[8px]" />
                        <span className="text-[#888] text-[12px] font-body">{video.creator}</span>
                        <span className="text-[#333] text-[10px] font-body ml-auto">{video.submitTime}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] text-[#666] font-body mb-3">
                        <span>👁 {fmt(video.views)}</span>
                        <span>❤ {fmt(video.likes)}</span>
                        <span>💬 {fmt(video.comments)}</span>
                        <span>⏱ {video.duration}</span>
                    </div>

                    {/* Rejection reason (nếu có) */}
                    {video.rejectionReason && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
                            <p className="text-[10px] text-red-400/70 font-body font-semibold uppercase tracking-wide mb-0.5">Lý do từ chối</p>
                            <p className="text-red-300 text-[12px] font-body m-0">{video.rejectionReason}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t border-[#1a1a2a]">
                        {video.status === 'active' && (
                            <button
                                onClick={() => { onClose(); onHide(video); }}
                                className="flex-1 px-3 py-2 rounded-lg bg-red-500/15 text-red-400 text-[12px] font-semibold font-body border-none cursor-pointer hover:bg-red-500/25 transition-colors"
                            >
                                Ẩn video
                            </button>
                        )}
                        {video.status === 'hidden' && (
                            <button
                                onClick={() => { onClose(); onRestore(video.id); }}
                                className="flex-1 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-400 text-[12px] font-semibold font-body border-none cursor-pointer hover:bg-emerald-500/25 transition-colors"
                            >
                                Khôi phục
                            </button>
                        )}
                        {video.status === 'rejected' && (
                            <>
                                <button
                                    onClick={() => { onClose(); onApprove(video.id); }}
                                    className="flex-1 px-3 py-2 rounded-lg text-[12px] font-semibold font-body text-white border-none cursor-pointer hover:opacity-90 transition-all"
                                    style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                                >
                                    ✓ Duyệt lại
                                </button>
                                <button
                                    onClick={() => { onClose(); onHide(video); }}
                                    className="flex-1 px-3 py-2 rounded-lg bg-red-500/15 text-red-400 text-[12px] font-semibold font-body border-none cursor-pointer hover:bg-red-500/25 transition-colors"
                                >
                                    Ẩn video
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-[12px] font-body text-[#777] bg-transparent border border-[#1e1e2e] cursor-pointer hover:border-[#333] hover:text-white transition-colors"
                        >
                            Đóng
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ═══════ Hide Reason Modal ═══════
function HideReasonModal({ video, onClose, onConfirm }) {
    const [selectedReason, setSelectedReason] = useState('');
    const [customNote, setCustomNote] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async () => {
        if (!selectedReason) return;
        const reason = selectedReason === 'Lý do khác'
            ? (customNote.trim() || 'Lý do khác')
            : (customNote.trim() ? `${selectedReason}: ${customNote.trim()}` : selectedReason);

        setLoading(true);
        await onConfirm(video.id, reason);
        setLoading(false);
    };

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-[460px] rounded-2xl border overflow-hidden"
                style={{
                    background: '#0f0f1a',
                    borderColor: '#1e1e2e',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1a1a2a' }}>
                    <div>
                        <h3 className="text-white text-[15px] font-display font-bold m-0">Ẩn video</h3>
                        <p className="text-[#555] text-[11px] font-body mt-0.5 m-0">
                            Video: {video?.title || 'Không có tiêu đề'} • {video?.creator}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border border-[#1e1e2e] cursor-pointer text-[#555] hover:text-white hover:border-[#333] transition-colors"
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4">
                    <p className="text-[#999] text-[12px] font-body mb-3">Chọn lý do ẩn video:</p>

                    <div className="space-y-1.5 mb-4">
                        {HIDE_REASONS.map(reason => (
                            <label
                                key={reason}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${
                                    selectedReason === reason
                                        ? 'bg-[#ff2d78]/10 border-[#ff2d78]/30'
                                        : 'bg-transparent border-transparent hover:bg-white/[0.03]'
                                }`}
                            >
                                <input
                                    type="radio"
                                    name="hide-reason"
                                    value={reason}
                                    checked={selectedReason === reason}
                                    onChange={() => setSelectedReason(reason)}
                                    className="accent-[#ff2d78] w-3.5 h-3.5"
                                />
                                <span className={`text-[12px] font-body ${selectedReason === reason ? 'text-white font-medium' : 'text-[#999]'}`}>
                                    {reason}
                                </span>
                            </label>
                        ))}
                    </div>

                    {/* Custom note */}
                    <div>
                        <label className="block text-[#777] text-[11px] font-body mb-1">
                            Mô tả bổ sung {selectedReason === 'Lý do khác' ? '*' : '(tùy chọn)'}
                        </label>
                        <textarea
                            value={customNote}
                            onChange={(e) => setCustomNote(e.target.value)}
                            placeholder={selectedReason === 'Lý do khác' ? 'Nhập lý do cụ thể...' : 'Nhập chi tiết bổ sung nếu cần...'}
                            rows={2}
                            className="w-full bg-[#111120] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white text-[12px] font-body outline-none placeholder:text-[#333] focus:border-[#ff2d78]/40 transition-colors resize-none"
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t" style={{ borderColor: '#1a1a2a' }}>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-[12px] font-body text-[#777] bg-transparent border border-[#1e1e2e] cursor-pointer hover:border-[#333] hover:text-white transition-colors"
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selectedReason || (selectedReason === 'Lý do khác' && !customNote.trim())}
                        className="px-4 py-2 rounded-lg text-[12px] font-body font-semibold text-white cursor-pointer border-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: loading || !selectedReason ? '#333' : '#ef4444' }}
                    >
                        {loading ? 'Đang ẩn...' : 'Ẩn video'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════ Main Page ═══════
export default function ModerationPage() {
    const { showSuccess, showError } = useToast();
    const { pathname } = useLocation();
    const [activeTab, setActiveTab] = useState(
        pathname.includes('/admin/videos') ? 'videos' : 'reports'
    ); // 'videos' | 'reports'

    // Đồng bộ tab khi URL thay đổi (click sidebar)
    useEffect(() => {
        setActiveTab(pathname.includes('/admin/videos') ? 'videos' : 'reports');
    }, [pathname]);

    // Video State
    const [videos, setVideos] = useState([]);
    const [videoCounts, setVideoCounts] = useState({ all: 0, active: 0, draft: 0, hidden: 0, rejected: 0 });
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

    // Modal States
    const [previewVideo, setPreviewVideo] = useState(null);     // VideoPreviewModal
    const [hideReasonVideo, setHideReasonVideo] = useState(null); // HideReasonModal

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

    // ── Handler: Ẩn video (qua HideReasonModal) ──
    const handleHideVideoWithReason = (video) => {
        setHideReasonVideo(video);
    };

    const handleConfirmHide = async (id, reason) => {
        setActionLoading(id);
        try {
            await hideVideo(id, reason);
            showSuccess('Thành công', 'Đã ẩn video');
            setHideReasonVideo(null);
            if (activeTab === 'videos') fetchVideos();
            else fetchReports();
            fetchVideoCounts();
        } catch (e) {
            showError('Lỗi', e.response?.data?.message || 'Không thể ẩn video');
        } finally {
            setActionLoading(null);
        }
    };

    // ── Handler: Khôi phục video ──
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

    // ── Handler: Duyệt lại video bị reject ──
    const handleApproveVideo = async (id) => {
        setActionLoading(id);
        try {
            await approveVideo(id);
            showSuccess('Thành công', 'Đã duyệt lại video thành công');
            if (activeTab === 'videos') fetchVideos();
            fetchVideoCounts();
        } catch (e) {
            showError('Lỗi', e.response?.data?.message || 'Không thể duyệt video');
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
        <AdminLayout title={activeTab === 'videos' ? 'Quản lý Video' : 'Kiểm duyệt & Báo cáo'}>
            {/* VIEW: BÁO CÁO VI PHẠM */}
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
                                                    onClick={() => handleHideVideoWithReason({ id: r.video_id, title: `Video #${r.video_id}`, creator: r.creator_username || 'N/A' })}
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
                    <div className="grid grid-cols-5 gap-4 mb-6">
                        <StatCard label="Tổng video" value={fmt(videoCounts.all)} change={0} positive accent />
                        <StatCard label="Đang hiển thị" value={fmt(videoCounts.active)} change={0} positive />
                        <StatCard label="Bản nháp" value={String(videoCounts.draft)} change={0} positive />
                        <StatCard label="Đã ẩn" value={String(videoCounts.hidden)} change={0} positive={false} />
                        <StatCard label="Bị từ chối" value={String(videoCounts.rejected || 0)} change={0} positive={false} />
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
                                        {/* Thumbnail — click to preview */}
                                        <div
                                            className="relative h-[120px] flex items-center justify-center bg-[#1a0a2e] cursor-pointer"
                                            onClick={() => setPreviewVideo(v)}
                                        >
                                            {v.thumbnail ? (
                                                <img src={v.thumbnail} alt="" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-9 h-9 rounded-full bg-white/10 flex items-center justify-center group-hover:bg-white/20 transition-colors">
                                                    <PlayAdminIcon />
                                                </div>
                                            )}
                                            {/* Play overlay on hover */}
                                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                                        <polygon points="5 3 19 12 5 21 5 3" />
                                                    </svg>
                                                </div>
                                            </div>
                                            <div className="absolute top-2 left-2">
                                                <StatusBadge
                                                    status={v.status === 'active' ? 'approved' : v.status === 'rejected' ? 'rejected' : v.status === 'hidden' ? 'rejected' : 'pending'}
                                                    label={v.status === 'active' ? 'Hiển thị' : v.status === 'rejected' ? 'Từ chối' : v.status === 'hidden' ? 'Đã ẩn' : 'Nháp'}
                                                />
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
                                            <div className="flex items-center gap-2 text-[9px] text-[#555] font-body mb-2">
                                                <span>👁 {fmt(v.views)}</span>
                                                <span>❤ {fmt(v.likes)}</span>
                                                <span>💬 {fmt(v.comments)}</span>
                                            </div>

                                            {/* Rejection reason tag */}
                                            {v.status === 'rejected' && v.rejectionReason && (
                                                <p className="text-red-400/80 text-[9px] font-body bg-red-500/10 px-2 py-1 rounded mb-2 line-clamp-1" title={v.rejectionReason}>
                                                    ⚠ {v.rejectionReason}
                                                </p>
                                            )}

                                            <div className="flex gap-1.5">
                                                {v.status === 'active' && (
                                                    <button onClick={() => handleHideVideoWithReason(v)}
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
                                                {v.status === 'rejected' && (
                                                    <>
                                                        <button onClick={() => handleApproveVideo(v.id)}
                                                            disabled={actionLoading === v.id}
                                                            className="flex-1 text-[10px] font-semibold font-body py-1.5 rounded text-white border-none cursor-pointer disabled:opacity-40 hover:opacity-90 transition-all"
                                                            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}>
                                                            ✓ Duyệt lại
                                                        </button>
                                                        <button onClick={() => handleHideVideoWithReason(v)}
                                                            disabled={actionLoading === v.id}
                                                            className="flex-1 text-[10px] font-semibold font-body py-1.5 rounded bg-red-500/15 text-red-400 border-none cursor-pointer hover:bg-red-500/25 disabled:opacity-40">
                                                            Ẩn
                                                        </button>
                                                    </>
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

            {/* ═══════ Video Preview Modal ═══════ */}
            {previewVideo && (
                <VideoPreviewModal
                    video={previewVideo}
                    onClose={() => setPreviewVideo(null)}
                    onHide={(v) => handleHideVideoWithReason(v)}
                    onRestore={(id) => handleRestoreVideo(id)}
                    onApprove={(id) => handleApproveVideo(id)}
                />
            )}

            {/* ═══════ Hide Reason Modal ═══════ */}
            {hideReasonVideo && (
                <HideReasonModal
                    video={hideReasonVideo}
                    onClose={() => setHideReasonVideo(null)}
                    onConfirm={handleConfirmHide}
                />
            )}
        </AdminLayout>
    );
}