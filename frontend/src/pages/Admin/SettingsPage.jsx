import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/Sidebar/AdminLayout';
import { BounceDots } from '../../components/ui/Spinner';
import Avatar from '../../components/common/Avatar/avatar';
import { useAuthContext } from '../../contexts/AuthContext';
import {
    getAdminSettings,
    updateAdminSettings,
    getSystemHealth,
    syncAudiusMusic,
    flushRedisCache,
    updateAdminProfile,
    changeAdminPassword
} from '../../services/adminService';

export default function SettingsPage() {
    const { user } = useAuthContext();
    const [activeTab, setActiveTab] = useState('config'); // 'config' | 'operations' | 'diagnostics' | 'profile'
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState(null); // { type: 'success'|'error', text: string }

    // Tab 1: System Settings State
    const [settings, setSettings] = useState({
        general: {
            appName: 'VibeTok',
            tagline: '',
            supportEmail: '',
            maintenanceMode: false,
            maintenanceMessage: '',
        },
        upload: {
            maxVideoSizeMB: 100,
            maxVideoDurationSec: 180,
            allowedFormats: ['mp4', 'webm', 'mov'],
        },
        moderation: {
            bannedKeywords: [],
        },
        security: {
            allowRegistration: true,
            requireEmailVerification: false,
        }
    });
    const [savingSettings, setSavingSettings] = useState(false);
    const [newKeyword, setNewKeyword] = useState('');

    // Tab 2: Operations State
    const [opLoading, setOpLoading] = useState({ audius: false, cache: false });
    const [opResults, setOpResults] = useState({ audius: null, cache: null });

    // Tab 3: Diagnostics State
    const [health, setHealth] = useState(null);
    const [refreshingHealth, setRefreshingHealth] = useState(false);

    // Tab 4: Profile & Password State
    const [profileForm, setProfileForm] = useState({
        display_name: user?.fullName || '',
        bio: user?.bio || '',
        avatar_url: user?.avatar_url || user?.anh_dai_dien || '',
    });
    const [savingProfile, setSavingProfile] = useState(false);

    const [passwordForm, setPasswordForm] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });
    const [savingPassword, setSavingPassword] = useState(false);

    // Auto-dismiss toast
    useEffect(() => {
        if (toast) {
            const t = setTimeout(() => setToast(null), 4000);
            return () => clearTimeout(t);
        }
    }, [toast]);

    const showToast = (type, text) => {
        setToast({ type, text });
    };

    // Load initial settings & health
    useEffect(() => {
        setLoading(true);
        Promise.all([
            getAdminSettings().catch(() => null),
            getSystemHealth().catch(() => null),
        ]).then(([sData, hData]) => {
            if (sData) setSettings(sData);
            if (hData) setHealth(hData);
        }).finally(() => setLoading(false));
    }, []);

    // Refresh Health
    const handleRefreshHealth = async () => {
        setRefreshingHealth(true);
        try {
            const h = await getSystemHealth();
            setHealth(h);
            showToast('success', 'Đã cập nhật trạng thái hệ thống mới nhất!');
        } catch (e) {
            showToast('error', 'Không thể lấy thông tin hệ thống.');
        } finally {
            setRefreshingHealth(false);
        }
    };

    // Save System Settings
    const handleSaveSettings = async (e) => {
        if (e) e.preventDefault();
        setSavingSettings(true);
        try {
            const res = await updateAdminSettings(settings);
            if (res.settings) setSettings(res.settings);
            showToast('success', 'Đã lưu cấu hình hệ thống thành công!');
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Lỗi khi lưu cấu hình');
        } finally {
            setSavingSettings(false);
        }
    };

    // Keyword tag helpers
    const handleAddKeyword = (e) => {
        if (e.key === 'Enter' || e.type === 'click') {
            e.preventDefault();
            const kw = newKeyword.trim().toLowerCase();
            if (!kw) return;
            const currentList = settings.moderation?.bannedKeywords || [];
            if (!currentList.includes(kw)) {
                setSettings({
                    ...settings,
                    moderation: {
                        ...settings.moderation,
                        bannedKeywords: [...currentList, kw],
                    }
                });
            }
            setNewKeyword('');
        }
    };

    const handleRemoveKeyword = (kwToRemove) => {
        setSettings({
            ...settings,
            moderation: {
                ...settings.moderation,
                bannedKeywords: (settings.moderation?.bannedKeywords || []).filter(k => k !== kwToRemove),
            }
        });
    };

    // Trigger Audius Sync
    const handleSyncAudius = async () => {
        setOpLoading(prev => ({ ...prev, audius: true }));
        try {
            const res = await syncAudiusMusic();
            setOpResults(prev => ({ ...prev, audius: { success: true, text: res.message } }));
            showToast('success', res.message);
        } catch (err) {
            const msg = err.response?.data?.message || 'Lỗi đồng bộ nhạc từ Audius';
            setOpResults(prev => ({ ...prev, audius: { success: false, text: msg } }));
            showToast('error', msg);
        } finally {
            setOpLoading(prev => ({ ...prev, audius: false }));
        }
    };

    // Trigger Flush Cache
    const handleFlushCache = async () => {
        setOpLoading(prev => ({ ...prev, cache: true }));
        try {
            const res = await flushRedisCache();
            setOpResults(prev => ({ ...prev, cache: { success: true, text: res.message } }));
            showToast('success', res.message);
        } catch (err) {
            const msg = err.response?.data?.message || 'Lỗi dọn dẹp cache';
            setOpResults(prev => ({ ...prev, cache: { success: false, text: msg } }));
            showToast('error', msg);
        } finally {
            setOpLoading(prev => ({ ...prev, cache: false }));
        }
    };

    // Update Profile
    const handleUpdateProfile = async (e) => {
        e.preventDefault();
        setSavingProfile(true);
        try {
            const res = await updateAdminProfile(profileForm);
            showToast('success', 'Cập nhật hồ sơ Admin thành công!');
            if (res.user && user) {
                const updatedUser = { ...user, fullName: res.user.display_name, bio: res.user.bio, anh_dai_dien: res.user.avatar_url };
                localStorage.setItem('user', JSON.stringify(updatedUser));
            }
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Lỗi cập nhật hồ sơ');
        } finally {
            setSavingProfile(false);
        }
    };

    // Change Password
    const handleChangePassword = async (e) => {
        e.preventDefault();
        if (passwordForm.newPassword !== passwordForm.confirmPassword) {
            return showToast('error', 'Mật khẩu xác nhận không khớp!');
        }
        if (passwordForm.newPassword.length < 8) {
            return showToast('error', 'Mật khẩu mới phải có tối thiểu 8 ký tự!');
        }
        setSavingPassword(true);
        try {
            await changeAdminPassword({
                currentPassword: passwordForm.currentPassword,
                newPassword: passwordForm.newPassword,
            });
            showToast('success', 'Đổi mật khẩu Admin thành công!');
            setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
        } catch (err) {
            showToast('error', err.response?.data?.message || 'Lỗi đổi mật khẩu');
        } finally {
            setSavingPassword(false);
        }
    };

    const formatUptime = (seconds) => {
        if (!seconds) return '0s';
        const d = Math.floor(seconds / 86400);
        const h = Math.floor((seconds % 86400) / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = seconds % 60;
        const parts = [];
        if (d > 0) parts.push(`${d} ngày`);
        if (h > 0) parts.push(`${h} giờ`);
        if (m > 0) parts.push(`${m} phút`);
        parts.push(`${s}s`);
        return parts.join(' ');
    };

    if (loading) {
        return (
            <AdminLayout title="Cài đặt hệ thống" subtitle="Quản trị tham số và vận hành VibeTok">
                <div className="flex items-center justify-center h-64"><BounceDots /></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title="Cài đặt hệ thống"
            subtitle="Quản trị tham số vận hành, tác vụ nền và tài khoản bảo mật"
        >
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-lg border text-sm font-medium transition-all transform animate-in fade-in duration-200 ${
                    toast.type === 'success'
                        ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30'
                        : 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30'
                }`}>
                    {toast.type === 'success' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 6L9 17l-5-5"/></svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    )}
                    <span>{toast.text}</span>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b mb-6 pb-2" style={{ borderColor: 'var(--color-border)' }}>
                {[
                    { id: 'config', label: 'Cài đặt hệ thống', icon: '⚙️' },
                    { id: 'operations', label: 'Vận hành & Tác vụ', icon: '⚡' },
                    { id: 'diagnostics', label: 'Trạng thái máy chủ', icon: '🖥️' },
                    { id: 'profile', label: 'Tài khoản & Bảo mật', icon: '👤' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold font-body cursor-pointer transition-all duration-150 border-none ${
                            activeTab === tab.id
                                ? 'bg-[#ff2d78] text-white shadow-md shadow-[#ff2d78]/20'
                                : 'bg-transparent hover:bg-[var(--vt-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: SYSTEM CONFIG (Cài đặt hệ thống) */}
            {/* ========================================================================= */}
            {activeTab === 'config' && (
                <div className="space-y-6 max-w-4xl">
                    {/* General Settings */}
                    <div className="rounded-2xl p-5 border" style={{ background: 'var(--vt-card)', borderColor: 'var(--color-border)' }}>
                        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                            <span className="text-xl">🌐</span>
                            <div>
                                <h3 className="text-[15px] font-bold font-display m-0" style={{ color: 'var(--color-text-primary)' }}>Thông tin chung nền tảng</h3>
                                <p className="text-[11px] font-body m-0" style={{ color: 'var(--color-text-muted)' }}>Cấu hình tên thương hiệu, khẩu hiệu và trạng thái bảo trì</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Tên ứng dụng (App Name)</label>
                                <input
                                    type="text"
                                    value={settings.general?.appName || ''}
                                    onChange={e => setSettings({ ...settings, general: { ...settings.general, appName: e.target.value } })}
                                    className="w-full px-3.5 py-2 rounded-xl text-xs font-body outline-none border transition-colors"
                                    style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                                    placeholder="VibeTok"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Email hỗ trợ (Support Email)</label>
                                <input
                                    type="email"
                                    value={settings.general?.supportEmail || ''}
                                    onChange={e => setSettings({ ...settings, general: { ...settings.general, supportEmail: e.target.value } })}
                                    className="w-full px-3.5 py-2 rounded-xl text-xs font-body outline-none border transition-colors"
                                    style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                                    placeholder="support@vibetok.com"
                                />
                            </div>
                        </div>

                        <div className="mb-4">
                            <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Khẩu hiệu / Slogan</label>
                            <input
                                type="text"
                                value={settings.general?.tagline || ''}
                                onChange={e => setSettings({ ...settings, general: { ...settings.general, tagline: e.target.value } })}
                                className="w-full px-3.5 py-2 rounded-xl text-xs font-body outline-none border transition-colors"
                                style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                                placeholder="Nền tảng chia sẻ video ngắn sáng tạo"
                            />
                        </div>

                        {/* Maintenance Mode Toggle */}
                        <div className="flex items-center justify-between p-3.5 rounded-xl border mt-3" style={{ background: 'rgba(255, 45, 120, 0.04)', borderColor: 'rgba(255, 45, 120, 0.2)' }}>
                            <div>
                                <p className="text-xs font-bold font-body m-0" style={{ color: 'var(--color-text-primary)' }}>Chế độ bảo trì hệ thống (Maintenance Mode)</p>
                                <p className="text-[11px] font-body m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>Khi bật, chỉ tài khoản Admin mới có thể truy cập hệ thống</p>
                            </div>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={Boolean(settings.general?.maintenanceMode)}
                                    onChange={e => setSettings({ ...settings, general: { ...settings.general, maintenanceMode: e.target.checked } })}
                                    className="sr-only peer"
                                />
                                <div className="w-11 h-6 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff2d78]"></div>
                            </label>
                        </div>

                        {settings.general?.maintenanceMode && (
                            <div className="mt-3">
                                <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Thông báo bảo trì</label>
                                <textarea
                                    rows={2}
                                    value={settings.general?.maintenanceMessage || ''}
                                    onChange={e => setSettings({ ...settings, general: { ...settings.general, maintenanceMessage: e.target.value } })}
                                    className="w-full px-3.5 py-2 rounded-xl text-xs font-body outline-none border transition-colors"
                                    style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                                    placeholder="Hệ thống VibeTok đang được nâng cấp định kỳ..."
                                />
                            </div>
                        )}
                    </div>

                    {/* Media & Upload Settings */}
                    <div className="rounded-2xl p-5 border" style={{ background: 'var(--vt-card)', borderColor: 'var(--color-border)' }}>
                        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                            <span className="text-xl">🎬</span>
                            <div>
                                <h3 className="text-[15px] font-bold font-display m-0" style={{ color: 'var(--color-text-primary)' }}>Giới hạn tải lên & Đa phương tiện</h3>
                                <p className="text-[11px] font-body m-0" style={{ color: 'var(--color-text-muted)' }}>Cấu hình dung lượng và thời lượng video cho phép người dùng đăng</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Dung lượng video tối đa (MB)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={10}
                                        max={500}
                                        value={settings.upload?.maxVideoSizeMB || 100}
                                        onChange={e => setSettings({ ...settings, upload: { ...settings.upload, maxVideoSizeMB: Number(e.target.value) } })}
                                        className="w-full px-3.5 py-2 rounded-xl text-xs font-body outline-none border transition-colors"
                                        style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                                    />
                                    <span className="text-xs font-body text-muted shrink-0">MB</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Thời lượng video tối đa (Giây)</label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="number"
                                        min={15}
                                        max={600}
                                        value={settings.upload?.maxVideoDurationSec || 180}
                                        onChange={e => setSettings({ ...settings, upload: { ...settings.upload, maxVideoDurationSec: Number(e.target.value) } })}
                                        className="w-full px-3.5 py-2 rounded-xl text-xs font-body outline-none border transition-colors"
                                        style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                                    />
                                    <span className="text-xs font-body text-muted shrink-0">Giây (~{Math.round((settings.upload?.maxVideoDurationSec || 180) / 60)}p)</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Content Safety & Banned Keywords */}
                    <div className="rounded-2xl p-5 border" style={{ background: 'var(--vt-card)', borderColor: 'var(--color-border)' }}>
                        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                            <span className="text-xl">🛡️</span>
                            <div>
                                <h3 className="text-[15px] font-bold font-display m-0" style={{ color: 'var(--color-text-primary)' }}>Bộ lọc & An toàn nội dung</h3>
                                <p className="text-[11px] font-body m-0" style={{ color: 'var(--color-text-muted)' }}>Hệ thống tự động kiểm duyệt bằng Gemini AI và quản lý danh sách từ khóa cấm</p>
                            </div>
                        </div>

                        {/* Status banner */}
                        <div className="flex items-center gap-3 p-3.5 rounded-xl border mb-4 bg-emerald-500/10 border-emerald-500/20 text-emerald-400">
                            <span className="text-lg">🤖</span>
                            <div className="text-xs font-body">
                                <p className="font-semibold m-0">Kiểm duyệt tự động Gemini AI đang hoạt động</p>
                                <p className="m-0 text-[11px] opacity-80 mt-0.5">Tất cả video và nội dung mới tải lên đều được AI tự động phân tích và kiểm tra an toàn theo thời gian thực.</p>
                            </div>
                        </div>

                        {/* Banned Keywords */}
                        <div className="mt-2">
                            <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Danh sách từ khóa cấm (Banned Keywords)</label>
                            <p className="text-[10px] font-body mb-2 text-muted">Bình luận hoặc caption chứa các từ khóa này sẽ tự động bị cảnh báo hoặc chặn</p>

                            <div className="flex items-center gap-2 mb-3">
                                <input
                                    type="text"
                                    value={newKeyword}
                                    onChange={e => setNewKeyword(e.target.value)}
                                    onKeyDown={handleAddKeyword}
                                    placeholder="Nhập từ cấm rồi nhấn Enter hoặc bấm Thêm..."
                                    className="flex-1 px-3.5 py-2 rounded-xl text-xs font-body outline-none border transition-colors"
                                    style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddKeyword}
                                    className="px-4 py-2 rounded-xl text-xs font-semibold font-body text-white bg-[#ff2d78] hover:bg-[#e0246a] border-none cursor-pointer transition-colors"
                                >
                                    Thêm
                                </button>
                            </div>

                            {/* Tags list */}
                            <div className="flex flex-wrap gap-2 p-3 rounded-xl border min-h-[48px]" style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)' }}>
                                {(settings.moderation?.bannedKeywords || []).map(kw => (
                                    <span
                                        key={kw}
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium font-body bg-red-500/10 text-red-400 border border-red-500/20"
                                    >
                                        <span>{kw}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveKeyword(kw)}
                                            className="hover:text-red-300 border-none bg-transparent cursor-pointer p-0 text-xs"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                ))}
                                {(!settings.moderation?.bannedKeywords || settings.moderation?.bannedKeywords.length === 0) && (
                                    <span className="text-xs font-body text-muted italic">Chưa có từ khóa cấm nào.</span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Button */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={handleSaveSettings}
                            disabled={savingSettings}
                            className="flex items-center gap-2 px-6 py-2.5 rounded-xl text-xs font-semibold font-body text-white bg-[#ff2d78] hover:bg-[#e0246a] shadow-lg shadow-[#ff2d78]/25 border-none cursor-pointer transition-all duration-200 disabled:opacity-50"
                        >
                            {savingSettings && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                            <span>Lưu tất cả thay đổi</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: SYSTEM OPERATIONS (Vận hành & Tác vụ) */}
            {/* ========================================================================= */}
            {activeTab === 'operations' && (
                <div className="space-y-4 max-w-4xl">
                    <p className="text-xs font-body text-muted mb-4">Kích hoạt trực tiếp các tác vụ nền của máy chủ khi cần thiết.</p>

                    {/* Operation 1: Audius Music Sync */}
                    <div className="rounded-2xl p-5 border flex items-center justify-between gap-6" style={{ background: 'var(--vt-card)', borderColor: 'var(--color-border)' }}>
                        <div className="flex items-start gap-3.5 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-purple-500/15 text-purple-400 flex items-center justify-center text-lg shrink-0">
                                🎵
                            </div>
                            <div>
                                <h4 className="text-[14px] font-bold font-display m-0" style={{ color: 'var(--color-text-primary)' }}>Đồng bộ nhạc thịnh hành từ Audius</h4>
                                <p className="text-xs font-body m-0 mt-1 text-muted">
                                    Cào top 50 bài hát đang trending trên Audius API và lưu bài hát mới vào cơ sở dữ liệu VibeTok.
                                </p>
                                {opResults.audius && (
                                    <p className={`text-xs font-body mt-2 font-medium ${opResults.audius.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                        ➜ {opResults.audius.text}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleSyncAudius}
                            disabled={opLoading.audius}
                            className="px-4 py-2 rounded-xl text-xs font-semibold font-body text-white bg-purple-600 hover:bg-purple-500 border-none cursor-pointer transition-all duration-200 shrink-0 flex items-center gap-2 disabled:opacity-50"
                        >
                            {opLoading.audius && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                            <span>Đồng bộ ngay</span>
                        </button>
                    </div>

                    {/* Operation 2: Flush Redis Cache */}
                    <div className="rounded-2xl p-5 border flex items-center justify-between gap-6" style={{ background: 'var(--vt-card)', borderColor: 'var(--color-border)' }}>
                        <div className="flex items-start gap-3.5 flex-1">
                            <div className="w-10 h-10 rounded-xl bg-amber-500/15 text-amber-400 flex items-center justify-center text-lg shrink-0">
                                🧹
                            </div>
                            <div>
                                <h4 className="text-[14px] font-bold font-display m-0" style={{ color: 'var(--color-text-primary)' }}>Làm mới bộ nhớ đệm (Flush Cache)</h4>
                                <p className="text-xs font-body m-0 mt-1 text-muted">
                                    Xóa sạch cache luồng video (feed) và video thịnh hành để hệ thống cập nhật nội dung mới nhất.
                                </p>
                                {opResults.cache && (
                                    <p className={`text-xs font-body mt-2 font-medium ${opResults.cache.success ? 'text-emerald-400' : 'text-red-400'}`}>
                                        ➜ {opResults.cache.text}
                                    </p>
                                )}
                            </div>
                        </div>

                        <button
                            type="button"
                            onClick={handleFlushCache}
                            disabled={opLoading.cache}
                            className="px-4 py-2 rounded-xl text-xs font-semibold font-body text-white bg-amber-600 hover:bg-amber-500 border-none cursor-pointer transition-all duration-200 shrink-0 flex items-center gap-2 disabled:opacity-50"
                        >
                            {opLoading.cache && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                            <span>Xóa Cache</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 3: SYSTEM DIAGNOSTICS (Trạng thái máy chủ) */}
            {/* ========================================================================= */}
            {activeTab === 'diagnostics' && (
                <div className="space-y-6 max-w-4xl">
                    <div className="flex items-center justify-between">
                        <p className="text-xs font-body text-muted m-0">Trạng thái sức khỏe thời gian thực của máy chủ và các dịch vụ liên kết.</p>
                        <button
                            type="button"
                            onClick={handleRefreshHealth}
                            disabled={refreshingHealth}
                            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium font-body border cursor-pointer transition-colors"
                            style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                        >
                            <svg className={`w-3.5 h-3.5 ${refreshingHealth ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M23 4v6h-6M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                            <span>Làm mới</span>
                        </button>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {/* MySQL Database Card */}
                        <div className="rounded-2xl p-4 border" style={{ background: 'var(--vt-card)', borderColor: 'var(--color-border)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold font-body text-muted">CƠ SỞ DỮ LIỆU (MYSQL)</span>
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    health?.database?.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                    {health?.database?.status === 'connected' ? 'Đang kết nối' : 'Mất kết nối'}
                                </span>
                            </div>
                            <div className="space-y-1.5 text-xs font-body">
                                <div className="flex justify-between">
                                    <span className="text-muted">Tên database:</span>
                                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{health?.database?.databaseName || 'vibetok'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Độ trễ truy vấn (Ping):</span>
                                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{health?.database?.latencyMs ?? 0} ms</span>
                                </div>
                            </div>
                        </div>

                        {/* Redis Card */}
                        <div className="rounded-2xl p-4 border" style={{ background: 'var(--vt-card)', borderColor: 'var(--color-border)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold font-body text-muted">BỘ NHỚ ĐỆM (REDIS)</span>
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    health?.redis?.status === 'connected' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'
                                }`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                    {health?.redis?.status === 'connected' ? 'Hoạt động' : 'Lỗi'}
                                </span>
                            </div>
                            <div className="space-y-1.5 text-xs font-body">
                                <div className="flex justify-between">
                                    <span className="text-muted">Tổng Keys lưu trữ:</span>
                                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{health?.redis?.keysCount ?? 0} keys</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Chức năng:</span>
                                    <span className="font-semibold text-muted">Cache Feed & Dirty sync</span>
                                </div>
                            </div>
                        </div>

                        {/* Gemini AI Card */}
                        <div className="rounded-2xl p-4 border" style={{ background: 'var(--vt-card)', borderColor: 'var(--color-border)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold font-body text-muted">KIỂM DUYỆT (GEMINI AI)</span>
                                <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                                    health?.geminiAi?.status === 'configured' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-amber-500/10 text-amber-400'
                                }`}>
                                    <span className="w-1.5 h-1.5 rounded-full bg-current"></span>
                                    {health?.geminiAi?.status === 'configured' ? 'Đã cấu hình API Key' : 'Chưa có Key'}
                                </span>
                            </div>
                            <div className="space-y-1.5 text-xs font-body">
                                <div className="flex justify-between">
                                    <span className="text-muted">Model mặc định:</span>
                                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{health?.geminiAi?.model || 'gemini-3.5-flash'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Server Runtime Card */}
                        <div className="rounded-2xl p-4 border" style={{ background: 'var(--vt-card)', borderColor: 'var(--color-border)' }}>
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-xs font-semibold font-body text-muted">MÁY CHỦ (NODE.JS)</span>
                                <span className="text-[11px] font-bold text-muted font-mono">{health?.nodeVersion || 'v20.x'}</span>
                            </div>
                            <div className="space-y-1.5 text-xs font-body">
                                <div className="flex justify-between">
                                    <span className="text-muted">Thời gian chạy (Uptime):</span>
                                    <span className="font-semibold font-mono" style={{ color: 'var(--color-text-primary)' }}>{formatUptime(health?.uptime)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted">Hệ điều hành:</span>
                                    <span className="font-semibold" style={{ color: 'var(--color-text-primary)' }}>{health?.platform || 'Windows'}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Memory Card */}
                    <div className="rounded-2xl p-5 border" style={{ background: 'var(--vt-card)', borderColor: 'var(--color-border)' }}>
                        <h4 className="text-xs font-semibold font-body text-muted mb-3 uppercase">Sử dụng bộ nhớ RAM (Memory Heap)</h4>
                        <div className="grid grid-cols-3 gap-4 mb-3">
                            <div className="p-3 rounded-xl border" style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)' }}>
                                <p className="text-[11px] font-body text-muted m-0">Heap Used</p>
                                <p className="text-base font-bold font-mono m-0 mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{health?.memory?.heapUsedMB || 0} MB</p>
                            </div>
                            <div className="p-3 rounded-xl border" style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)' }}>
                                <p className="text-[11px] font-body text-muted m-0">Heap Total</p>
                                <p className="text-base font-bold font-mono m-0 mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{health?.memory?.heapTotalMB || 0} MB</p>
                            </div>
                            <div className="p-3 rounded-xl border" style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)' }}>
                                <p className="text-[11px] font-body text-muted m-0">RSS Process</p>
                                <p className="text-base font-bold font-mono m-0 mt-0.5" style={{ color: 'var(--color-text-primary)' }}>{health?.memory?.rssMB || 0} MB</p>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 4: ADMIN PROFILE & SECURITY (Tài khoản & Bảo mật) */}
            {/* ========================================================================= */}
            {activeTab === 'profile' && (
                <div className="space-y-6 max-w-2xl">
                    {/* Admin Profile Form */}
                    <form onSubmit={handleUpdateProfile} className="rounded-2xl p-5 border" style={{ background: 'var(--vt-card)', borderColor: 'var(--color-border)' }}>
                        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                            <span className="text-xl">👤</span>
                            <div>
                                <h3 className="text-[15px] font-bold font-display m-0" style={{ color: 'var(--color-text-primary)' }}>Thông tin tài khoản Admin</h3>
                                <p className="text-[11px] font-body m-0" style={{ color: 'var(--color-text-muted)' }}>Cập nhật tên hiển thị và thông tin hồ sơ của bạn</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-4 mb-4">
                            <Avatar user={user} className="!w-16 !h-16 !text-lg" />
                            <div>
                                <p className="text-sm font-bold font-body m-0" style={{ color: 'var(--color-text-primary)' }}>@{user?.username || 'admin'}</p>
                                <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-[#ff2d78]/15 text-[#ff2d78] mt-1">
                                    {user?.vai_tro || 'Super Admin'}
                                </span>
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Họ và tên hiển thị</label>
                                <input
                                    type="text"
                                    value={profileForm.display_name}
                                    onChange={e => setProfileForm({ ...profileForm, display_name: e.target.value })}
                                    className="w-full px-3.5 py-2 rounded-xl text-xs font-body outline-none border transition-colors"
                                    style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                                    placeholder="Tên quản trị viên"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Tiểu sử (Bio)</label>
                                <textarea
                                    rows={2}
                                    value={profileForm.bio}
                                    onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                                    className="w-full px-3.5 py-2 rounded-xl text-xs font-body outline-none border transition-colors"
                                    style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                                    placeholder="Mô tả ngắn gọn về quản trị viên..."
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={savingProfile}
                            className="px-5 py-2 rounded-xl text-xs font-semibold font-body text-white bg-[#ff2d78] hover:bg-[#e0246a] border-none cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {savingProfile && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                            <span>Cập nhật hồ sơ</span>
                        </button>
                    </form>

                    {/* Change Password Form */}
                    <form onSubmit={handleChangePassword} className="rounded-2xl p-5 border" style={{ background: 'var(--vt-card)', borderColor: 'var(--color-border)' }}>
                        <div className="flex items-center gap-2.5 mb-4 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                            <span className="text-xl">🔐</span>
                            <div>
                                <h3 className="text-[15px] font-bold font-display m-0" style={{ color: 'var(--color-text-primary)' }}>Đổi mật khẩu Admin</h3>
                                <p className="text-[11px] font-body m-0" style={{ color: 'var(--color-text-muted)' }}>Đảm bảo mật khẩu có tối thiểu 8 ký tự để bảo mật an toàn</p>
                            </div>
                        </div>

                        <div className="space-y-3 mb-4">
                            <div>
                                <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Mật khẩu hiện tại</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordForm.currentPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                    className="w-full px-3.5 py-2 rounded-xl text-xs font-body outline-none border transition-colors"
                                    style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                                    placeholder="••••••••"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Mật khẩu mới</label>
                                <input
                                    type="password"
                                    required
                                    minLength={8}
                                    value={passwordForm.newPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                    className="w-full px-3.5 py-2 rounded-xl text-xs font-body outline-none border transition-colors"
                                    style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                                    placeholder="Tối thiểu 8 ký tự"
                                />
                            </div>

                            <div>
                                <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>Xác nhận mật khẩu mới</label>
                                <input
                                    type="password"
                                    required
                                    value={passwordForm.confirmPassword}
                                    onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                    className="w-full px-3.5 py-2 rounded-xl text-xs font-body outline-none border transition-colors"
                                    style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-primary)' }}
                                    placeholder="Nhập lại mật khẩu mới"
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={savingPassword}
                            className="px-5 py-2 rounded-xl text-xs font-semibold font-body text-white bg-gray-800 hover:bg-gray-700 border-none cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50"
                        >
                            {savingPassword && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                            <span>Đổi mật khẩu</span>
                        </button>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}
