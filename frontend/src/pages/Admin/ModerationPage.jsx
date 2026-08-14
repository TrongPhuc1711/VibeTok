import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import AdminLayout from '../../components/layout/Sidebar/AdminLayout';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
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

// Filters cho trang Quản lý Video (không có "Bị từ chối" vì đã chuyển sang Kiểm duyệt)
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
            style={{ background: 'var(--vt-backdrop)', backdropFilter: 'blur(8px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="relative w-[90vw] max-w-[480px] rounded-2xl border overflow-hidden"
                style={{
                    background: 'var(--vt-card)',
                    borderColor: 'var(--color-border)',
                    boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
                }}
            >
                {/* Close button */}
                <button
                    onClick={onClose}
                    className="absolute top-3 right-3 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-black/60 border-none cursor-pointer text-white/80 hover:text-white hover:bg-black/80 transition-colors"
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
                    <p className="text-[14px] font-semibold font-body leading-snug mb-1.5 line-clamp-2" style={{ color: 'var(--color-text-primary)' }}>{video.title}</p>
                    <div className="flex items-center gap-2 mb-2">
                        <Avatar user={{ anh_dai_dien: video.avatar, initials: video.initials, fullName: video.creator }} size="xs" className="!w-6 !h-6 !text-[8px]" />
                        <span className="text-[12px] font-body" style={{ color: 'var(--color-text-secondary)' }}>{video.creator}</span>
                        <span className="text-[10px] font-body ml-auto" style={{ color: 'var(--color-text-muted)' }}>{video.submitTime}</span>
                    </div>
                    <div className="flex items-center gap-3 text-[11px] font-body mb-3" style={{ color: 'var(--color-text-muted)' }}>
                        <span>👁 {fmt(video.views)}</span>
                        <span>❤ {fmt(video.likes)}</span>
                        <span>💬 {fmt(video.comments)}</span>
                        <span>⏱ {video.duration}</span>
                    </div>

                    {/* Rejection reason (nếu có) */}
                    {video.rejectionReason && (
                        <div className="bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2 mb-3">
                            <p className="text-[10px] font-body font-semibold uppercase tracking-wide mb-0.5" style={{ color: '#ef4444' }}>Lý do từ chối</p>
                            <p className="text-[12px] font-body m-0" style={{ color: '#ef4444' }}>{video.rejectionReason}</p>
                        </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                        {video.status === 'active' && (
                            <button
                                onClick={() => { onClose(); onHide(video); }}
                                className="flex-1 px-3 py-2 rounded-lg bg-red-500/15 text-red-500 text-[12px] font-semibold font-body border-none cursor-pointer hover:bg-red-500/25 transition-colors"
                            >
                                Ẩn video
                            </button>
                        )}
                        {video.status === 'hidden' && (
                            <button
                                onClick={() => { onClose(); onRestore(video.id); }}
                                className="flex-1 px-3 py-2 rounded-lg bg-emerald-500/15 text-emerald-500 text-[12px] font-semibold font-body border-none cursor-pointer hover:bg-emerald-500/25 transition-colors"
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
                                    className="flex-1 px-3 py-2 rounded-lg bg-red-500/15 text-red-500 text-[12px] font-semibold font-body border-none cursor-pointer hover:bg-red-500/25 transition-colors"
                                >
                                    Ẩn video
                                </button>
                            </>
                        )}
                        <button
                            onClick={onClose}
                            className="px-4 py-2 rounded-lg text-[12px] font-body bg-transparent border cursor-pointer transition-colors"
                            style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
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
            style={{ background: 'var(--vt-backdrop)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-[460px] rounded-2xl border overflow-hidden"
                style={{
                    background: 'var(--vt-card)',
                    borderColor: 'var(--color-border)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                        <h3 className="text-[15px] font-display font-bold m-0" style={{ color: 'var(--color-text-primary)' }}>Ẩn video</h3>
                        <p className="text-[11px] font-body mt-0.5 m-0" style={{ color: 'var(--color-text-muted)' }}>
                            Video: {video?.title || 'Không có tiêu đề'} • {video?.creator}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border cursor-pointer transition-colors"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                            <path d="M18 6L6 18M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4">
                    <p className="text-[12px] font-body mb-3" style={{ color: 'var(--color-text-secondary)' }}>Chọn lý do ẩn video:</p>

                    <div className="space-y-1.5 mb-4">
                        {HIDE_REASONS.map(reason => (
                            <label
                                key={reason}
                                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg cursor-pointer transition-all border ${
                                    selectedReason === reason
                                        ? 'bg-[#ff2d78]/10 border-[#ff2d78]/30'
                                        : 'bg-transparent border-transparent hover:bg-black/5 dark:hover:bg-white/[0.03]'
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
                                <span className="text-[12px] font-body" style={{ color: selectedReason === reason ? 'var(--color-text-primary)' : 'var(--color-text-secondary)' }}>
                                    {reason}
                                </span>
                            </label>
                        ))}
                    </div>

                    {/* Custom note */}
                    <div>
                        <label className="block text-[11px] font-body mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            Mô tả bổ sung {selectedReason === 'Lý do khác' ? '*' : '(tùy chọn)'}
                        </label>
                        <textarea
                            value={customNote}
                            onChange={(e) => setCustomNote(e.target.value)}
                            placeholder={selectedReason === 'Lý do khác' ? 'Nhập lý do cụ thể...' : 'Nhập chi tiết bổ sung nếu cần...'}
                            rows={2}
                            className="w-full rounded-lg px-3 py-2 text-[12px] font-body outline-none transition-colors resize-none"
                            style={{
                                background: 'var(--vt-input)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-primary)',
                            }}
                        />
                    </div>
                </div>

                {/* Footer */}
                <div className="flex items-center justify-end gap-2 px-5 py-3.5 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <button
                        onClick={onClose}
                        className="px-4 py-2 rounded-lg text-[12px] font-body bg-transparent border cursor-pointer transition-colors"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
                        Hủy
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={loading || !selectedReason || (selectedReason === 'Lý do khác' && !customNote.trim())}
                        className="px-4 py-2 rounded-lg text-[12px] font-body font-semibold text-white cursor-pointer border-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: loading || !selectedReason ? '#888' : '#ef4444' }}
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

    // Xác định xem đang ở trang nào (/admin/videos hay /admin/moderation)
    const isVideosPage = pathname.includes('/admin/videos');

    // Tab phụ bên trong trang Kiểm duyệt ('rejected' = video bị AI từ chối, 'reports' = báo cáo vi phạm)
    const [moderationTab, setModerationTab] = useState('rejected');

    // Video State cho trang Quản lý Video (/admin/videos)
    const [videos, setVideos] = useState([]);
    const [videoCounts, setVideoCounts] = useState({ all: 0, active: 0, draft: 0, hidden: 0, rejected: 0 });
    const [videoFilter, setVideoFilter] = useState('all');
    const [videoSearch, setVideoSearch] = useState('');
    const [videoPage, setVideoPage] = useState(1);
    const [videoTotalPages, setVideoTotalPages] = useState(1);
    const [videoTotal, setVideoTotal] = useState(0);

    // Video State cho phần Video bị từ chối bên trang Kiểm duyệt (/admin/moderation)
    const [rejectedVideos, setRejectedVideos] = useState([]);
    const [rejectedSearch, setRejectedSearch] = useState('');
    const [rejectedPage, setRejectedPage] = useState(1);
    const [rejectedTotalPages, setRejectedTotalPages] = useState(1);
    const [rejectedTotal, setRejectedTotal] = useState(0);

    // Report State cho phần Báo cáo bên trang Kiểm duyệt
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

    // Fetch Videos cho trang Quản lý Video (/admin/videos)
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

    // Fetch Video bị từ chối cho trang Kiểm duyệt (/admin/moderation)
    const fetchRejectedVideos = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAdminVideos({ status: 'rejected', search: rejectedSearch, page: rejectedPage, limit: PAGE_SIZE });
            setRejectedVideos(res.videos || []);
            setRejectedTotal(res.total || 0);
            setRejectedTotalPages(res.totalPages || 1);
        } catch {
            showError('Lỗi', 'Không thể tải video bị từ chối');
        } finally {
            setLoading(false);
        }
    }, [rejectedSearch, rejectedPage]);

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

    // Effect fetch dữ liệu dựa trên route hiện tại
    useEffect(() => {
        if (isVideosPage) {
            fetchVideos();
        } else {
            if (moderationTab === 'rejected') {
                fetchRejectedVideos();
            } else {
                fetchReports();
            }
        }
    }, [isVideosPage, moderationTab, fetchVideos, fetchRejectedVideos, fetchReports]);

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
            if (isVideosPage) {
                fetchVideos();
            } else {
                if (moderationTab === 'rejected') fetchRejectedVideos();
                else fetchReports();
            }
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
            if (isVideosPage) fetchVideos();
            else fetchRejectedVideos();
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
            if (isVideosPage) fetchVideos();
            else fetchRejectedVideos();
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
        <AdminLayout title={isVideosPage ? 'Quản lý Video' : 'Kiểm duyệt nội dung'}>

            {/* ═══════════════════════════════════════════════════ */}
            {/* TRANG 1: QUẢN LÝ VIDEO (/admin/videos)              */}
            {/* ═══════════════════════════════════════════════════ */}
            {isVideosPage && (
                <>
                    {/* Stats 4 cột: Tất cả, Đang hiển thị, Bản nháp, Đã ẩn */}
                    <div className="grid grid-cols-4 gap-4 mb-6">
                        <StatCard label="Tổng video" value={fmt(videoCounts.all)} change={0} positive accent />
                        <StatCard label="Đang hiển thị" value={fmt(videoCounts.active)} change={0} positive />
                        <StatCard label="Bản nháp" value={String(videoCounts.draft)} change={0} positive />
                        <StatCard label="Đã ẩn" value={String(videoCounts.hidden)} change={0} positive={false} />
                    </div>

                    {/* Filters 4 tab */}
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
                        <p className="text-[12px] font-body text-center py-16" style={{ color: 'var(--color-text-muted)' }}>Không tìm thấy video nào</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                {videos.map(v => (
                                    <div
                                        key={v.id}
                                        className="rounded-xl overflow-hidden transition-colors group"
                                        style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}
                                    >
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
                                            <p className="text-[12px] font-semibold font-body leading-tight mb-1.5 line-clamp-1" style={{ color: 'var(--color-text-primary)' }}>{v.title}</p>
                                            <div className="flex items-center gap-1.5 mb-1">
                                                <Avatar user={{ anh_dai_dien: v.avatar, initials: v.initials, fullName: v.creator }} size="xs" className="!w-7 !h-7 !text-[9px]" />
                                                <span className="text-[10px] font-body" style={{ color: 'var(--color-text-secondary)' }}>{v.creator}</span>
                                                <span className="text-[10px] font-body ml-auto" style={{ color: 'var(--color-text-muted)' }}>{v.submitTime}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-[9px] font-body mb-2" style={{ color: 'var(--color-text-muted)' }}>
                                                <span>👁 {fmt(v.views)}</span>
                                                <span>❤ {fmt(v.likes)}</span>
                                                <span>💬 {fmt(v.comments)}</span>
                                            </div>

                                            <div className="flex gap-1.5">
                                                {v.status === 'active' && (
                                                    <button onClick={() => handleHideVideoWithReason(v)}
                                                        disabled={actionLoading === v.id}
                                                        className="flex-1 text-[10px] font-semibold font-body py-1.5 rounded bg-red-500/15 text-red-500 border-none cursor-pointer hover:bg-red-500/25 disabled:opacity-40">
                                                        Ẩn video
                                                    </button>
                                                )}
                                                {v.status === 'hidden' && (
                                                    <button onClick={() => handleRestoreVideo(v.id)}
                                                        disabled={actionLoading === v.id}
                                                        className="flex-1 text-[10px] font-semibold font-body py-1.5 rounded bg-emerald-500/15 text-emerald-500 border-none cursor-pointer hover:bg-emerald-500/25 disabled:opacity-40">
                                                        Khôi phục
                                                    </button>
                                                )}
                                                {v.status === 'draft' && (
                                                    <span className="flex-1 text-[10px] font-body py-1.5 text-center" style={{ color: 'var(--color-text-muted)' }}>Bản nháp</span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* Pagination */}
                            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}>
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

            {/* ═══════════════════════════════════════════════════ */}
            {/* TRANG 2: KIỂM DUYỆT NỘI DUNG (/admin/moderation)    */}
            {/* ═══════════════════════════════════════════════════ */}
            {!isVideosPage && (
                <>
                    {/* Sub-selector nội bộ trang Kiểm duyệt */}
                    <div className="flex items-center gap-2.5 mb-6 border-b pb-3" style={{ borderColor: 'var(--color-border)' }}>
                        <button
                            onClick={() => { setModerationTab('rejected'); setRejectedPage(1); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13.5px] font-semibold transition-all cursor-pointer border"
                            style={{
                                background: moderationTab === 'rejected' ? '#ff2d78' : 'var(--vt-card)',
                                borderColor: moderationTab === 'rejected' ? '#ff2d78' : 'var(--color-border)',
                                color: moderationTab === 'rejected' ? '#fff' : 'var(--color-text-secondary)',
                                boxShadow: moderationTab === 'rejected' ? '0 4px 16px rgba(255, 45, 120, 0.25)' : 'none',
                            }}
                        >
                            <span>🚫 Video bị AI từ chối</span>
                            {videoCounts.rejected > 0 && (
                                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold ${
                                    moderationTab === 'rejected' ? 'bg-white text-[#ff2d78]' : 'bg-red-500 text-white'
                                }`}>
                                    {videoCounts.rejected}
                                </span>
                            )}
                        </button>

                        <button
                            onClick={() => { setModerationTab('reports'); setReportPage(1); }}
                            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13.5px] font-semibold transition-all cursor-pointer border"
                            style={{
                                background: moderationTab === 'reports' ? '#ff2d78' : 'var(--vt-card)',
                                borderColor: moderationTab === 'reports' ? '#ff2d78' : 'var(--color-border)',
                                color: moderationTab === 'reports' ? '#fff' : 'var(--color-text-secondary)',
                                boxShadow: moderationTab === 'reports' ? '0 4px 16px rgba(255, 45, 120, 0.25)' : 'none',
                            }}
                        >
                            <span>🚩 Báo cáo từ người dùng</span>
                            {reportCounts.pending > 0 && (
                                <span className={`inline-flex items-center justify-center min-w-[18px] h-[18px] px-1.5 rounded-full text-[10px] font-bold ${
                                    moderationTab === 'reports' ? 'bg-white text-[#ff2d78]' : 'bg-amber-500 text-black'
                                }`}>
                                    {reportCounts.pending}
                                </span>
                            )}
                        </button>
                    </div>

                    {/* ── MỤC 1: VIDEO BỊ AI TỪ CHỐI ── */}
                    {moderationTab === 'rejected' && (
                        <>
                            {/* Stats */}
                            <div className="grid grid-cols-4 gap-4 mb-6">
                                <StatCard label="Video bị từ chối" value={String(videoCounts.rejected || 0)} change={0} positive={false} accent />
                                <StatCard label="Đã ẩn thủ công" value={String(videoCounts.hidden || 0)} change={0} positive={false} />
                                <StatCard label="Báo cáo chờ xử lý" value={String(reportCounts.pending || 0)} change={0} positive={false} />
                                <StatCard label="Báo cáo đã giải quyết" value={String(reportCounts.resolved || 0)} change={0} positive />
                            </div>

                            {/* Search bar cho video bị từ chối */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="relative flex-1 max-w-md">
                                    <input
                                        type="text"
                                        value={rejectedSearch}
                                        onChange={(e) => { setRejectedSearch(e.target.value); setRejectedPage(1); }}
                                        placeholder="Tìm video bị từ chối theo tiêu đề, tác giả..."
                                        className="w-full rounded-xl px-4 py-2.5 text-[13px] font-body outline-none transition-colors"
                                        style={{
                                            background: 'var(--vt-card)',
                                            border: '1px solid var(--color-border)',
                                            color: 'var(--color-text-primary)',
                                        }}
                                    />
                                    {rejectedSearch && (
                                        <button
                                            onClick={() => { setRejectedSearch(''); setRejectedPage(1); }}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer text-[12px]"
                                            style={{ color: 'var(--color-text-muted)' }}
                                        >
                                            ✕
                                        </button>
                                    )}
                                </div>
                            </div>

                            {/* Video grid */}
                            {loading ? (
                                <div className="flex items-center justify-center py-16"><BounceDots /></div>
                            ) : rejectedVideos.length === 0 ? (
                                <div className="rounded-xl p-12 text-center" style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}>
                                    <p className="text-[14px] m-0" style={{ color: 'var(--color-text-muted)' }}>🎉 Tuyệt vời! Không có video nào bị từ chối cần duyệt lại</p>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-4 gap-4 mb-6">
                                        {rejectedVideos.map(v => (
                                            <div
                                                key={v.id}
                                                className="rounded-xl overflow-hidden transition-colors group"
                                                style={{ background: 'var(--vt-card)', border: '1px solid rgba(239, 68, 68, 0.3)' }}
                                            >
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
                                                        <StatusBadge status="rejected" label="Bị từ chối" />
                                                    </div>
                                                    <span className="absolute bottom-2 right-2 text-[9px] font-bold font-body text-white bg-black/60 px-1.5 py-0.5 rounded">{v.duration}</span>
                                                </div>

                                                {/* Info */}
                                                <div className="p-3">
                                                    <p className="text-[12px] font-semibold font-body leading-tight mb-1.5 line-clamp-1" style={{ color: 'var(--color-text-primary)' }}>{v.title}</p>
                                                    <div className="flex items-center gap-1.5 mb-1">
                                                        <Avatar user={{ anh_dai_dien: v.avatar, initials: v.initials, fullName: v.creator }} size="xs" className="!w-7 !h-7 !text-[9px]" />
                                                        <span className="text-[10px] font-body" style={{ color: 'var(--color-text-secondary)' }}>{v.creator}</span>
                                                        <span className="text-[10px] font-body ml-auto" style={{ color: 'var(--color-text-muted)' }}>{v.submitTime}</span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-[9px] font-body mb-2" style={{ color: 'var(--color-text-muted)' }}>
                                                        <span>👁 {fmt(v.views)}</span>
                                                        <span>❤ {fmt(v.likes)}</span>
                                                        <span>💬 {fmt(v.comments)}</span>
                                                    </div>

                                                    {/* Rejection reason */}
                                                    {v.rejectionReason && (
                                                        <p className="text-[10px] font-body bg-red-500/10 border border-red-500/20 px-2 py-1.5 rounded-lg mb-2.5 line-clamp-2" style={{ color: '#ef4444' }} title={v.rejectionReason}>
                                                            ⚠ {v.rejectionReason}
                                                        </p>
                                                    )}

                                                    {/* Actions: Duyệt lại hoặc Ẩn */}
                                                    <div className="flex gap-1.5">
                                                        <button
                                                            onClick={() => handleApproveVideo(v.id)}
                                                            disabled={actionLoading === v.id}
                                                            className="flex-1 text-[11px] font-semibold font-body py-1.5 rounded text-white border-none cursor-pointer disabled:opacity-40 hover:opacity-90 transition-all"
                                                            style={{ background: 'linear-gradient(135deg, #10b981, #06b6d4)' }}
                                                        >
                                                            ✓ Duyệt lại
                                                        </button>
                                                        <button
                                                            onClick={() => handleHideVideoWithReason(v)}
                                                            disabled={actionLoading === v.id}
                                                            className="px-3 text-[11px] font-semibold font-body py-1.5 rounded bg-red-500/15 text-red-500 border-none cursor-pointer hover:bg-red-500/25 disabled:opacity-40"
                                                        >
                                                            Ẩn
                                                        </button>
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}>
                                        <AdminPagination
                                            page={rejectedPage}
                                            totalPages={rejectedTotalPages}
                                            total={rejectedTotal}
                                            pageSize={PAGE_SIZE}
                                            onPageChange={setRejectedPage}
                                            label="video bị từ chối"
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {/* ── MỤC 2: BÁO CÁO VI PHẠM TỪ NGƯỜI DÙNG ── */}
                    {moderationTab === 'reports' && (
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
                                <div className="rounded-xl p-12 text-center" style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}>
                                    <p className="text-[14px] m-0" style={{ color: 'var(--color-text-muted)' }}>Chưa có báo cáo vi phạm nào</p>
                                </div>
                            ) : (
                                <>
                                    <div className="flex flex-col gap-4 mb-6">
                                        {reports.map((r) => (
                                            <div
                                                key={r.id}
                                                className="rounded-xl p-4 flex flex-col md:flex-row gap-4 justify-between items-start md:items-center transition-colors"
                                                style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}
                                            >
                                                {/* Content info */}
                                                <div className="flex items-start gap-3.5 flex-1 min-w-0">
                                                    <div className="w-10 h-10 rounded-full bg-[#ff2d78]/10 text-[#ff2d78] flex items-center justify-center font-bold shrink-0 text-[18px]">
                                                        🚩
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                            <span className="font-semibold text-[15px]" style={{ color: 'var(--color-text-primary)' }}>{r.reason}</span>
                                                            <StatusBadge
                                                                status={r.status === 'resolved' ? 'approved' : r.status === 'reviewed' ? 'pending' : 'rejected'}
                                                                label={r.status === 'resolved' ? 'Đã giải quyết' : r.status === 'reviewed' ? 'Đã xem' : 'Chờ xử lý'}
                                                            />
                                                            <span className="text-[12px] ml-auto" style={{ color: 'var(--color-text-muted)' }}>
                                                                {new Date(r.created_at).toLocaleString('vi-VN')}
                                                            </span>
                                                        </div>

                                                        {r.description && (
                                                            <p
                                                                className="text-[13.5px] p-2.5 rounded-lg mb-2 font-mono leading-relaxed"
                                                                style={{
                                                                    background: 'var(--vt-input)',
                                                                    border: '1px solid var(--color-border)',
                                                                    color: 'var(--color-text-secondary)',
                                                                }}
                                                            >
                                                                "{r.description}"
                                                            </p>
                                                        )}

                                                        <div className="flex items-center gap-4 text-[12.5px] flex-wrap" style={{ color: 'var(--color-text-muted)' }}>
                                                            <span>
                                                                Người báo cáo: <strong style={{ color: 'var(--color-text-primary)' }}>@{r.reporter_username || 'n/a'}</strong>
                                                            </span>
                                                            <span>•</span>
                                                            <span>
                                                                Video bị báo cáo: ID <code className="px-1.5 py-0.5 rounded" style={{ background: 'var(--vt-input)', color: 'var(--color-text-primary)' }}>{r.video_id}</code>
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
                                                <div className="flex items-center gap-2 shrink-0 self-end md:self-center border-t md:border-t-0 pt-3 md:pt-0 w-full md:w-auto justify-end" style={{ borderColor: 'var(--color-border)' }}>
                                                    {r.video_active ? (
                                                        <button
                                                            onClick={() => handleHideVideoWithReason({ id: r.video_id, title: `Video #${r.video_id}`, creator: r.creator_username || 'N/A' })}
                                                            disabled={actionLoading === r.video_id}
                                                            className="px-3 py-1.5 rounded-lg bg-red-500/20 text-red-500 text-[12.5px] font-semibold hover:bg-red-500/30 transition-colors cursor-pointer border-none disabled:opacity-50"
                                                        >
                                                            Ẩn video
                                                        </button>
                                                    ) : (
                                                        <button
                                                            onClick={() => handleRestoreVideo(r.video_id)}
                                                            disabled={actionLoading === r.video_id}
                                                            className="px-3 py-1.5 rounded-lg bg-emerald-500/20 text-emerald-500 text-[12.5px] font-semibold hover:bg-emerald-500/30 transition-colors cursor-pointer border-none disabled:opacity-50"
                                                        >
                                                            Khôi phục
                                                        </button>
                                                    )}

                                                    {r.status !== 'resolved' && (
                                                        <button
                                                            onClick={() => handleUpdateReportStatus(r.id, 'resolved')}
                                                            disabled={actionLoading === `report_${r.id}`}
                                                            className="px-3 py-1.5 rounded-lg bg-blue-500/20 text-blue-500 text-[12.5px] font-semibold hover:bg-blue-500/30 transition-colors cursor-pointer border-none disabled:opacity-50"
                                                        >
                                                            Giải quyết
                                                        </button>
                                                    )}

                                                    <button
                                                        onClick={() => handleDeleteReport(r.id)}
                                                        disabled={actionLoading === `del_report_${r.id}`}
                                                        className="px-3 py-1.5 rounded-lg text-[12.5px] font-semibold hover:opacity-80 transition-opacity cursor-pointer border-none disabled:opacity-50"
                                                        style={{
                                                            background: 'var(--vt-input)',
                                                            color: 'var(--color-text-secondary)',
                                                        }}
                                                    >
                                                        Xóa
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>

                                    {/* Pagination */}
                                    <div className="rounded-xl overflow-hidden" style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}>
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