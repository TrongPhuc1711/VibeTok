import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/Sidebar/AdminLayout';
import { CloseAdminIcon } from '../../icons/AdminIcons';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import AdminBtn from './components/AdminBtn';
import AdminFilters from './components/AdminFilters';
import AdminPagination from './components/AdminPagination';
import { BounceDots } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import Avatar from '../../components/common/Avatar/avatar';
import { getUsers, getUserCounts, banUser, unbanUser, tempBanUser, resetUserPassword } from '../../services/adminService';

const fmt = (n) => {
    n = Number(n) || 0;
    if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
    if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
    return String(n);
};

const PAGE_SIZE = 8;

const FILTERS = [
    { label: 'Tất cả', value: 'all' },
    { label: 'Active', value: 'active' },
    { label: 'Creator', value: 'creator' },
    { label: 'Banned', value: 'banned' },
];

// Password Reset Modal
function PasswordResetModal({ user, onClose, onSuccess }) {
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const { showSuccess, showError } = useToast();

    const handleSubmit = async () => {
        setError('');
        if (!password || password.length < 8) {
            setError('Mật khẩu tối thiểu 8 ký tự!');
            return;
        }
        if (password !== confirmPassword) {
            setError('Mật khẩu xác nhận không khớp!');
            return;
        }
        setLoading(true);
        try {
            await resetUserPassword(user.id, password);
            showSuccess('Thành công', `Đã đổi mật khẩu cho ${user.name}`);
            onSuccess();
            onClose();
        } catch (e) {
            const msg = e.response?.data?.message || 'Không thể đổi mật khẩu';
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
                className="w-[420px] rounded-2xl border overflow-hidden"
                style={{
                    background: 'var(--vt-card)',
                    borderColor: 'var(--color-border)',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                        <h3 className="text-[15px] font-display font-bold m-0" style={{ color: 'var(--color-text-primary)' }}>Đổi mật khẩu</h3>
                        <p className="text-[11px] font-body mt-0.5 m-0 text-white">Người dùng: {user.name} ({user.username})</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border cursor-pointer transition-colors"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
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

                    <div>
                        <label className="block text-[11px] font-body mb-1" style={{ color: 'var(--color-text-secondary)' }}>Mật khẩu mới</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Tối thiểu 8 ký tự"
                            className="w-full rounded-lg px-3 py-2 text-[13px] font-body outline-none transition-colors"
                            style={{
                                background: 'var(--vt-input)',
                                border: '1px solid var(--color-border)',
                                color: 'var(--color-text-primary)',
                            }}
                        />
                    </div>

                    <div>
                        <label className="block text-[11px] font-body mb-1" style={{ color: 'var(--color-text-secondary)' }}>Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu"
                            className="w-full rounded-lg px-3 py-2 text-[13px] font-body outline-none transition-colors"
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
                        disabled={loading}
                        className="px-4 py-2 rounded-lg text-[12px] font-body font-semibold text-white cursor-pointer border-none transition-all disabled:opacity-50"
                        style={{
                            background: 'linear-gradient(135deg, #ff2d78, #7c3aed)',
                        }}
                    >
                        {loading ? 'Đang xử lý...' : 'Đổi mật khẩu'}
                    </button>
                </div>
            </div>
        </div>
    );
}

// ═══════ Temp Ban Modal ═══════
const TEMP_BAN_DURATIONS = [
    { label: '30 phút', value: 30 },
    { label: '1 giờ', value: 60 },
    { label: '6 giờ', value: 360 },
    { label: '24 giờ', value: 1440 },
    { label: 'Vĩnh viễn', value: -1 },
];

function TempBanModal({ user, onClose, onSuccess }) {
    const [duration, setDuration] = useState(null);
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const { showSuccess, showError } = useToast();

    const handleSubmit = async () => {
        if (!duration) return;
        setLoading(true);
        try {
            if (duration === -1) {
                // Ban vĩnh viễn
                await banUser(user.id);
                showSuccess('Thành công', `Đã ban vĩnh viễn ${user.name}`);
            } else {
                await tempBanUser(user.id, duration, reason.trim() || null);
                const label = TEMP_BAN_DURATIONS.find(d => d.value === duration)?.label || `${duration} phút`;
                showSuccess('Thành công', `Đã vô hiệu hóa ${user.name} trong ${label}`);
            }
            onSuccess();
            onClose();
        } catch (e) {
            showError('Lỗi', e.response?.data?.message || 'Không thể vô hiệu hóa tài khoản');
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
                        <h3 className="text-[18px] font-display font-bold m-0" style={{ color: 'var(--color-text-primary)' }}>Vô hiệu hóa tạm thời</h3>
                        <p className="text-[12px] font-body mt-0.5 m-0 text-white">Người dùng: {user.name} ({user.username})</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-transparent border cursor-pointer transition-colors"
                        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
                    >
                        <CloseAdminIcon size={12} />
                    </button>
                </div>

                {/* Body */}
                <div className="px-5 py-4">
                    <p className="text-[12px] font-body mb-3" style={{ color: 'var(--color-text-secondary)' }}>Chọn thời gian vô hiệu hóa:</p>

                    <div className="grid grid-cols-2 gap-2 mb-4">
                        {TEMP_BAN_DURATIONS.map(d => (
                            <button
                                key={d.value}
                                onClick={() => setDuration(d.value)}
                                className={`px-4 py-3 rounded-xl text-[13px] font-body font-semibold transition-all cursor-pointer border ${
                                    d.value === -1 ? 'col-span-2' : ''
                                } ${
                                    duration === d.value
                                        ? 'text-white'
                                        : 'bg-transparent hover:bg-black/5 dark:hover:bg-white/[0.03]'
                                }`}
                                style={{
                                    background: duration === d.value
                                        ? (d.value === -1 ? 'linear-gradient(135deg, #dc2626, #991b1b)' : 'linear-gradient(135deg, #f97316, #ef4444)')
                                        : (d.value === -1 ? 'rgba(239, 68, 68, 0.08)' : undefined),
                                    borderColor: duration === d.value ? 'transparent' : (d.value === -1 ? 'rgba(239, 68, 68, 0.3)' : 'var(--color-border)'),
                                    color: duration === d.value ? '#fff' : (d.value === -1 ? '#ef4444' : 'var(--color-text-primary)'),
                                    boxShadow: duration === d.value ? (d.value === -1 ? '0 4px 16px rgba(220, 38, 38, 0.3)' : '0 4px 16px rgba(249, 115, 22, 0.3)') : 'none',
                                }}
                            >
                                {d.label}
                            </button>
                        ))}
                    </div>

                    {/* Reason */}
                    <div>
                        <label className="block text-[11px] font-body mb-1" style={{ color: 'var(--color-text-secondary)' }}>Lý do (tùy chọn)</label>
                        <textarea
                            value={reason}
                            onChange={(e) => setReason(e.target.value)}
                            placeholder="Nhập lý do vô hiệu hóa..."
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
                        disabled={loading || !duration}
                        className="px-4 py-2 rounded-lg text-[12px] font-body font-semibold text-white cursor-pointer border-none transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        style={{ background: loading || !duration ? '#888' : 'linear-gradient(135deg, #f97316, #ef4444)' }}
                    >
                        {loading ? 'Đang xử lý...' : 'Vô hiệu hóa'}
                    </button>
                </div>
            </div>
        </div>
    );
}

export default function UserManagerPage() {
    const { showSuccess, showError } = useToast();
    const [users, setUsers] = useState([]);
    const [counts, setCounts] = useState({ all: 0, active: 0, creator: 0, banned: 0 });
    const [filter, setFilter] = useState('all');
    const [search, setSearch] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);
    const [resetPasswordUser, setResetPasswordUser] = useState(null);
    const [tempBanModalUser, setTempBanModalUser] = useState(null);

    const fetchUsers = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getUsers({ filter, search, page, limit: PAGE_SIZE });
            setUsers(res.users);
            setTotal(res.total);
            setTotalPages(res.totalPages);
        } catch {
            showError('Lỗi', 'Không thể tải danh sách người dùng');
        } finally {
            setLoading(false);
        }
    }, [filter, search, page]);

    const fetchCounts = useCallback(async () => {
        try {
            const c = await getUserCounts();
            setCounts(c);
        } catch { /* ignore */ }
    }, []);

    useEffect(() => { fetchUsers(); }, [fetchUsers]);
    useEffect(() => { fetchCounts(); }, []);

    const handleFilter = (f) => { setFilter(f); setPage(1); };
    const handleSearch = (s) => { setSearch(s); setPage(1); };

    const handleBan = async (id) => {
        setActionLoading(id);
        try {
            await banUser(id);
            showSuccess('Thành công', 'Đã ban người dùng');
            fetchUsers();
            fetchCounts();
        } catch (e) {
            showError('Lỗi', e.response?.data?.message || 'Không thể ban');
        } finally {
            setActionLoading(null);
        }
    };

    const handleUnban = async (id) => {
        setActionLoading(id);
        try {
            await unbanUser(id);
            showSuccess('Thành công', 'Đã mở khóa tài khoản');
            fetchUsers();
            fetchCounts();
        } catch (e) {
            showError('Lỗi', e.response?.data?.message || 'Không thể mở khóa tài khoản');
        } finally {
            setActionLoading(null);
        }
    };

    const filtersWithCounts = FILTERS.map(f => ({
        ...f,
        count: counts[f.value] ?? 0,
    }));

    return (
        <AdminLayout title="Quản lý người dùng">
            {/* Mini stats */}
            <div className="grid grid-cols-4 gap-3 mb-5">
                <StatCard label="Tổng người dùng" value={fmt(counts.all)} change={0} positive accent />
                <StatCard label="Active" value={fmt(counts.active)} change={0} positive />
                <StatCard label="Creator" value={fmt(counts.creator)} change={0} positive />
                <StatCard label="Đã ban" value={String(counts.banned)} change={0} positive={false} />
            </div>

            {/* Filters + search */}
            <AdminFilters
                filters={filtersWithCounts}
                active={filter}
                onChange={handleFilter}
                search={search}
                onSearch={handleSearch}
                placeholder="Tìm người dùng..."
            />

            {/* Table */}
            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--vt-card)', border: '1px solid var(--color-border)' }}>
                {loading ? (
                    <div className="flex items-center justify-center py-16"><BounceDots /></div>
                ) : users.length === 0 ? (
                    <p className="text-[12px] font-body text-center py-16" style={{ color: 'var(--color-text-muted)' }}>Không tìm thấy người dùng nào</p>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                {['Người dùng', 'Email', 'Ngày tham gia', 'Followers', 'Videos', 'Trạng thái', 'Hành động'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-body font-medium whitespace-nowrap" style={{ color: 'var(--color-text-muted)' }}>{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, i) => (
                                <tr key={u.id} className="transition-colors hover:bg-[var(--vt-hover)]" style={{ borderBottom: '1px solid var(--vt-divider)' }}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <Avatar user={{ ...u, fullName: u.name }} size="xs" className="!w-7 !h-7 !text-[9px]" />
                                            <div>
                                                <p className="text-[12px] font-semibold font-body leading-tight m-0" style={{ color: 'var(--color-text-primary)' }}>{u.name}</p>
                                                <p className="text-[10px] font-body m-0" style={{ color: 'var(--color-text-secondary)' }}>{u.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-[11px] font-body" style={{ color: 'var(--color-text-secondary)' }}>{u.email}</td>
                                    <td className="px-4 py-3 text-[11px] font-body whitespace-nowrap" style={{ color: 'var(--color-text-secondary)' }}>{u.joinDate}</td>
                                    <td className="px-4 py-3 text-[11px] font-body" style={{ color: 'var(--color-text-secondary)' }}>{fmt(u.followers)}</td>
                                    <td className="px-4 py-3 text-[11px] font-body" style={{ color: 'var(--color-text-secondary)' }}>{u.videos}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center gap-1 flex-wrap">
                                                <StatusBadge status={u.status} />
                                                {u.role === 'creator' && <StatusBadge status="creator" />}
                                                {u.role === 'admin' && <StatusBadge status="active" label="Admin" />}
                                            </div>
                                            {u.bannedUntil && (
                                                <p className="text-[9px] font-body font-medium" style={{ color: 'var(--color-text-muted)' }}>Đến: {u.bannedUntil}</p>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1 flex-wrap">
                                            {u.status === 'active' && u.role !== 'admin' && (
                                                <AdminBtn label="Vô hiệu hóa" bg="#f9731622" color="#f97316"
                                                    onClick={() => setTempBanModalUser(u)}
                                                    disabled={actionLoading === u.id} />
                                            )}
                                            {(u.status === 'banned' || u.status === 'temp_banned') && (
                                                <AdminBtn label="Mở khóa" bg="#10b98122" color="#10b981"
                                                    onClick={() => handleUnban(u.id)}
                                                    disabled={actionLoading === u.id} />
                                            )}
                                            {u.role !== 'admin' && (
                                                <AdminBtn label="Đổi mật khẩu" bg="#7c3aed22" color="#7c3aed"
                                                    onClick={() => setResetPasswordUser(u)} />
                                            )}
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
                    label="người dùng"
                />
            </div>

            {/* Password Reset Modal */}
            {resetPasswordUser && (
                <PasswordResetModal
                    user={resetPasswordUser}
                    onClose={() => setResetPasswordUser(null)}
                    onSuccess={() => fetchUsers()}
                />
            )}

            {/* Temp Ban Modal */}
            {tempBanModalUser && (
                <TempBanModal
                    user={tempBanModalUser}
                    onClose={() => setTempBanModalUser(null)}
                    onSuccess={() => { fetchUsers(); fetchCounts(); }}
                />
            )}
        </AdminLayout>
    );
}
