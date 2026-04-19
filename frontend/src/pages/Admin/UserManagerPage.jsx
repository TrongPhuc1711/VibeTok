import React, { useState, useEffect, useCallback } from 'react';
import AdminLayout from '../../components/layout/Sidebar/AdminLayout';
import StatCard from '../../components/ui/StatCard';
import StatusBadge from '../../components/ui/StatusBadge';
import AdminBtn from './components/AdminBtn';
import AdminFilters from './components/AdminFilters';
import AdminPagination from './components/AdminPagination';
import { BounceDots } from '../../components/ui/Spinner';
import { useToast } from '../../components/ui/Toast';
import { getUsers, getUserCounts, banUser, unbanUser, resetUserPassword } from '../../services/adminService';

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
            style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            onClick={(e) => e.target === e.currentTarget && onClose()}
        >
            <div
                className="w-[420px] rounded-2xl border overflow-hidden"
                style={{
                    background: '#0f0f1a',
                    borderColor: '#1e1e2e',
                    boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                }}
            >
                {/* Header */}
                <div className="flex items-center justify-between px-5 py-4 border-b" style={{ borderColor: '#1a1a2a' }}>
                    <div>
                        <h3 className="text-white text-[15px] font-display font-bold m-0">Đổi mật khẩu</h3>
                        <p className="text-[#555] text-[11px] font-body mt-0.5 m-0">Người dùng: {user.name} ({user.username})</p>
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
                <div className="px-5 py-4 space-y-3">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/30 rounded-lg px-3 py-2 text-red-400 text-[12px] font-body">
                            {error}
                        </div>
                    )}

                    <div>
                        <label className="block text-[#777] text-[11px] font-body mb-1">Mật khẩu mới</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Tối thiểu 8 ký tự"
                            className="w-full bg-[#111120] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white text-[13px] font-body outline-none placeholder:text-[#333] focus:border-primary/50 transition-colors"
                        />
                    </div>

                    <div>
                        <label className="block text-[#777] text-[11px] font-body mb-1">Xác nhận mật khẩu</label>
                        <input
                            type="password"
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="Nhập lại mật khẩu"
                            className="w-full bg-[#111120] border border-[#1e1e2e] rounded-lg px-3 py-2 text-white text-[13px] font-body outline-none placeholder:text-[#333] focus:border-primary/50 transition-colors"
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
            showSuccess('Thành công', 'Đã vô hiệu hóa người dùng');
            fetchUsers();
            fetchCounts();
        } catch (e) {
            showError('Lỗi', e.response?.data?.message || 'Không thể vô hiệu hóa tài khoản');
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
            <div className="bg-[#0f0f1a] border border-[#1a1a2a] rounded-xl overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center py-16"><BounceDots /></div>
                ) : users.length === 0 ? (
                    <p className="text-[#444] text-[12px] font-body text-center py-16">Không tìm thấy người dùng nào</p>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-[#1a1a2a]">
                                {['Người dùng', 'Email', 'Ngày tham gia', 'Followers', 'Videos', 'Trạng thái', 'Hành động'].map(h => (
                                    <th key={h} className="px-4 py-3 text-left text-[10px] font-body text-[#444] font-medium whitespace-nowrap">{h}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((u, i) => (
                                <tr key={u.id} className={`border-b border-[#1a1a2a]/40 hover:bg-white/[0.02] transition-colors ${i % 2 === 0 ? '' : 'bg-white/[0.01]'}`}>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2.5">
                                            <div className="w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold text-white shrink-0 overflow-hidden" style={{ background: u.avatar ? 'transparent' : u.color }}>
                                                {u.avatar
                                                    ? <img src={u.avatar} alt="" className="w-full h-full object-cover" />
                                                    : u.initials}
                                            </div>
                                            <div>
                                                <p className="text-white text-[12px] font-semibold font-body leading-tight m-0">{u.name}</p>
                                                <p className="text-[#555] text-[10px] font-body m-0">{u.username}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-4 py-3 text-[#666] text-[11px] font-body">{u.email}</td>
                                    <td className="px-4 py-3 text-[#666] text-[11px] font-body whitespace-nowrap">{u.joinDate}</td>
                                    <td className="px-4 py-3 text-[#888] text-[11px] font-body">{fmt(u.followers)}</td>
                                    <td className="px-4 py-3 text-[#888] text-[11px] font-body">{u.videos}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-1 flex-wrap">
                                            <StatusBadge status={u.status} />
                                            {u.role === 'creator' && <StatusBadge status="creator" />}
                                            {u.role === 'admin' && <StatusBadge status="active" label="Admin" />}
                                        </div>
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="flex gap-1">
                                            {u.status === 'active' && u.role !== 'admin' && (
                                                <AdminBtn label="Ban" bg="#f59e0b22" color="#f59e0b"
                                                    onClick={() => handleBan(u.id)}
                                                    disabled={actionLoading === u.id} />
                                            )}
                                            {u.status === 'banned' && (
                                                <AdminBtn label="Unban" bg="#10b98122" color="#10b981"
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
        </AdminLayout>
    );
}
