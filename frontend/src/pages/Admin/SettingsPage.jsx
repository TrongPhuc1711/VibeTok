import React, { useState, useEffect } from 'react';
import AdminLayout from '../../components/layout/Sidebar/AdminLayout';
import { BounceDots } from '../../components/ui/Spinner';
import Avatar from '../../components/common/Avatar/avatar';
import { useAuthContext } from '../../contexts/AuthContext';
import {
    getAdminSettings,
    updateAdminSettings,
    updateAdminProfile,
    changeAdminPassword
} from '../../services/adminService';

export default function SettingsPage() {
    const { user } = useAuthContext();
    const [activeTab, setActiveTab] = useState('config'); // 'config' | 'profile'
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

    // Tab 2: Profile & Password State
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

    // Load initial settings
    useEffect(() => {
        setLoading(true);
        getAdminSettings()
            .then(sData => {
                if (sData) setSettings(sData);
            })
            .catch(() => null)
            .finally(() => setLoading(false));
    }, []);

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

    if (loading) {
        return (
            <AdminLayout title="Cài đặt hệ thống" subtitle="Quản trị tham số và tài khoản VibeTok">
                <div className="flex items-center justify-center h-64"><BounceDots /></div>
            </AdminLayout>
        );
    }

    return (
        <AdminLayout
            title="Cài đặt hệ thống"
            subtitle="Quản trị cấu hình nền tảng, giới hạn upload, bộ lọc và tài khoản"
        >
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 flex items-center gap-2.5 px-4 py-3 rounded-xl shadow-xl border text-sm font-medium transition-all transform animate-in fade-in duration-200 ${
                    toast.type === 'success'
                        ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/30 backdrop-blur-md'
                        : 'bg-[#ef4444]/15 text-[#ef4444] border-[#ef4444]/30 backdrop-blur-md'
                }`}>
                    {toast.type === 'success' ? (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M20 6L9 17l-5-5"/></svg>
                    ) : (
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
                    )}
                    <span>{toast.text}</span>
                </div>
            )}

            {/* Navigation Tabs */}
            <div className="flex items-center gap-2 border-b mb-6 pb-3" style={{ borderColor: 'var(--color-border)' }}>
                {[
                    { id: 'config', label: 'Cài đặt hệ thống', icon: '⚙️' },
                    { id: 'profile', label: 'Tài khoản & Bảo mật', icon: '👤' },
                ].map(tab => (
                    <button
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold font-body cursor-pointer transition-all duration-150 border-none ${
                            activeTab === tab.id
                                ? 'bg-[#ff2d78] text-white shadow-md shadow-[#ff2d78]/25'
                                : 'bg-transparent hover:bg-[var(--vt-hover)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                        }`}
                    >
                        <span>{tab.icon}</span>
                        <span>{tab.label}</span>
                    </button>
                ))}
            </div>

            {/* ========================================================================= */}
            {/* TAB 1: SYSTEM CONFIG (Cài đặt hệ thống - Giao diện Rộng & Hiện Đại) */}
            {/* ========================================================================= */}
            {activeTab === 'config' && (
                <div className="space-y-6 w-full max-w-[1300px]">
                    {/* Top Grid: 2 Columns */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Section 1: Thông tin chung nền tảng */}
                        <div
                            className="rounded-2xl p-6 border transition-all"
                            style={{
                                background: 'var(--vt-card)',
                                borderColor: 'var(--color-border)',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                            }}
                        >
                            <div className="flex items-center gap-3 mb-5 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: 'rgba(255, 45, 120, 0.1)', color: '#ff2d78' }}>
                                    🌐
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold font-display m-0 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                                        Thông tin chung nền tảng
                                    </h3>
                                    <p className="text-[11px] font-body m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                        Cấu hình tên thương hiệu, email hỗ trợ và chế độ bảo trì
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                            Tên ứng dụng (App Name)
                                        </label>
                                        <input
                                            type="text"
                                            value={settings.general?.appName || ''}
                                            onChange={e => setSettings({ ...settings, general: { ...settings.general, appName: e.target.value } })}
                                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-body outline-none border transition-colors focus:border-[#ff2d78]"
                                            style={{
                                                background: 'var(--vt-input)',
                                                borderColor: 'var(--color-border)',
                                                color: 'var(--color-text-primary)'
                                            }}
                                            placeholder="VibeTok"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                            Email hỗ trợ (Support Email)
                                        </label>
                                        <input
                                            type="email"
                                            value={settings.general?.supportEmail || ''}
                                            onChange={e => setSettings({ ...settings, general: { ...settings.general, supportEmail: e.target.value } })}
                                            className="w-full px-3.5 py-2.5 rounded-xl text-xs font-body outline-none border transition-colors focus:border-[#ff2d78]"
                                            style={{
                                                background: 'var(--vt-input)',
                                                borderColor: 'var(--color-border)',
                                                color: 'var(--color-text-primary)'
                                            }}
                                            placeholder="support@vibetok.com"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                        Khẩu hiệu / Slogan
                                    </label>
                                    <input
                                        type="text"
                                        value={settings.general?.tagline || ''}
                                        onChange={e => setSettings({ ...settings, general: { ...settings.general, tagline: e.target.value } })}
                                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-body outline-none border transition-colors focus:border-[#ff2d78]"
                                        style={{
                                            background: 'var(--vt-input)',
                                            borderColor: 'var(--color-border)',
                                            color: 'var(--color-text-primary)'
                                        }}
                                        placeholder="Nền tảng chia sẻ video ngắn sáng tạo"
                                    />
                                </div>

                                {/* Maintenance Mode Switch */}
                                <div
                                    className="p-4 rounded-xl border transition-all mt-2"
                                    style={{
                                        background: 'rgba(255, 45, 120, 0.04)',
                                        borderColor: 'rgba(255, 45, 120, 0.2)'
                                    }}
                                >
                                    <div className="flex items-center justify-between">
                                        <div>
                                            <p className="text-xs font-bold font-body m-0" style={{ color: 'var(--color-text-primary)' }}>
                                                Chế độ bảo trì hệ thống (Maintenance Mode)
                                            </p>
                                            <p className="text-[11px] font-body m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                                Khi bật, chỉ tài khoản Admin mới có thể đăng nhập và truy cập
                                            </p>
                                        </div>
                                        <label className="relative inline-flex items-center cursor-pointer shrink-0 ml-3">
                                            <input
                                                type="checkbox"
                                                checked={Boolean(settings.general?.maintenanceMode)}
                                                onChange={e => setSettings({ ...settings, general: { ...settings.general, maintenanceMode: e.target.checked } })}
                                                className="sr-only peer"
                                            />
                                            <div className="w-11 h-6 bg-gray-500/40 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#ff2d78]"></div>
                                        </label>
                                    </div>

                                    {settings.general?.maintenanceMode && (
                                        <div className="mt-3 pt-3 border-t" style={{ borderColor: 'rgba(255, 45, 120, 0.15)' }}>
                                            <label className="block text-xs font-semibold font-body mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                                Thông báo hiển thị cho người dùng:
                                            </label>
                                            <textarea
                                                rows={2}
                                                value={settings.general?.maintenanceMessage || ''}
                                                onChange={e => setSettings({ ...settings, general: { ...settings.general, maintenanceMessage: e.target.value } })}
                                                className="w-full px-3 py-2 rounded-xl text-xs font-body outline-none border transition-colors focus:border-[#ff2d78]"
                                                style={{
                                                    background: 'var(--vt-input)',
                                                    borderColor: 'var(--color-border)',
                                                    color: 'var(--color-text-primary)'
                                                }}
                                                placeholder="Hệ thống VibeTok đang được nâng cấp định kỳ..."
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Section 2: Giới hạn tải lên & Đa phương tiện */}
                        <div
                            className="rounded-2xl p-6 border transition-all flex flex-col justify-between"
                            style={{
                                background: 'var(--vt-card)',
                                borderColor: 'var(--color-border)',
                                boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                            }}
                        >
                            <div>
                                <div className="flex items-center gap-3 mb-5 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                                    <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: 'rgba(59, 130, 246, 0.1)', color: '#3b82f6' }}>
                                        🎬
                                    </div>
                                    <div>
                                        <h3 className="text-[15px] font-bold font-display m-0 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                                            Giới hạn tải lên video
                                        </h3>
                                        <p className="text-[11px] font-body m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                            Cấu hình dung lượng và thời lượng video cho phép tải lên
                                        </p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                                Dung lượng video tối đa
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={10}
                                                    max={500}
                                                    value={settings.upload?.maxVideoSizeMB || 100}
                                                    onChange={e => setSettings({ ...settings, upload: { ...settings.upload, maxVideoSizeMB: Number(e.target.value) } })}
                                                    className="w-full pl-3.5 pr-12 py-2.5 rounded-xl text-xs font-body outline-none border transition-colors focus:border-[#ff2d78]"
                                                    style={{
                                                        background: 'var(--vt-input)',
                                                        borderColor: 'var(--color-border)',
                                                        color: 'var(--color-text-primary)'
                                                    }}
                                                />
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold font-body text-muted pointer-events-none">
                                                    MB
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-body mt-1 block" style={{ color: 'var(--color-text-muted)' }}>
                                                Khuyến nghị: 50MB - 200MB
                                            </span>
                                        </div>

                                        <div>
                                            <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                                Thời lượng video tối đa
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="number"
                                                    min={15}
                                                    max={600}
                                                    value={settings.upload?.maxVideoDurationSec || 180}
                                                    onChange={e => setSettings({ ...settings, upload: { ...settings.upload, maxVideoDurationSec: Number(e.target.value) } })}
                                                    className="w-full pl-3.5 pr-14 py-2.5 rounded-xl text-xs font-body outline-none border transition-colors focus:border-[#ff2d78]"
                                                    style={{
                                                        background: 'var(--vt-input)',
                                                        borderColor: 'var(--color-border)',
                                                        color: 'var(--color-text-primary)'
                                                    }}
                                                />
                                                <span className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-semibold font-body text-muted pointer-events-none">
                                                    Giây
                                                </span>
                                            </div>
                                            <span className="text-[10px] font-body mt-1 block" style={{ color: 'var(--color-text-muted)' }}>
                                                Tương đương ~{Math.round((settings.upload?.maxVideoDurationSec || 180) / 60)} phút
                                            </span>
                                        </div>
                                    </div>

                                    <div>
                                        <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                            Định dạng file hỗ trợ
                                        </label>
                                        <div className="flex items-center gap-2">
                                            {['MP4', 'WEBM', 'MOV'].map(fmt => (
                                                <span
                                                    key={fmt}
                                                    className="px-3 py-1.5 rounded-lg text-xs font-bold font-body"
                                                    style={{
                                                        background: 'var(--vt-input)',
                                                        border: '1px solid var(--color-border)',
                                                        color: 'var(--color-text-primary)'
                                                    }}
                                                >
                                                    .{fmt.toLowerCase()}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="mt-4 p-3 rounded-xl border text-[11px] font-body" style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}>
                                💡 Video đăng lên sẽ được hệ thống nén và tối ưu hoá tự động trước khi phân phối tới người xem.
                            </div>
                        </div>
                    </div>

                    {/* Bottom Section: Bộ lọc & An toàn nội dung (Full Width) */}
                    <div
                        className="rounded-2xl p-6 border transition-all"
                        style={{
                            background: 'var(--vt-card)',
                            borderColor: 'var(--color-border)',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                        }}
                    >
                        <div className="flex items-center gap-3 mb-5 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                            <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981' }}>
                                🛡️
                            </div>
                            <div>
                                <h3 className="text-[15px] font-bold font-display m-0 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                                    Bộ lọc & An toàn nội dung
                                </h3>
                                <p className="text-[11px] font-body m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                    Hệ thống kiểm duyệt tự động Gemini AI và quản lý danh sách từ khóa cấm
                                </p>
                            </div>
                        </div>

                        {/* AI Moderation Live Status Banner */}
                        <div
                            className="flex items-center gap-3.5 p-4 rounded-xl border mb-5"
                            style={{
                                background: 'rgba(16, 185, 129, 0.08)',
                                borderColor: 'rgba(16, 185, 129, 0.25)',
                                color: '#10b981'
                            }}
                        >
                            <span className="text-xl shrink-0">🤖</span>
                            <div className="text-xs font-body">
                                <p className="font-bold m-0 text-[13px]">
                                    Hệ thống kiểm duyệt tự động Gemini AI đang hoạt động
                                </p>
                                <p className="m-0 text-[11px] opacity-80 mt-0.5">
                                    Tất cả video và hình ảnh khi đăng tải đều được AI tự động phân tích phát hiện nội dung độc hại (bạo lực, 18+, tự hại, ngôn từ thù địch) theo thời gian thực.
                                </p>
                            </div>
                        </div>

                        {/* Banned Keywords */}
                        <div>
                            <label className="block text-xs font-semibold font-body mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                Danh sách từ khóa cấm (Banned Keywords)
                            </label>
                            <p className="text-[11px] font-body mb-3" style={{ color: 'var(--color-text-muted)' }}>
                                Các bình luận hoặc caption chứa các từ khóa này sẽ tự động bị hệ thống cảnh báo hoặc chặn
                            </p>

                            <div className="flex items-center gap-3 mb-4">
                                <input
                                    type="text"
                                    value={newKeyword}
                                    onChange={e => setNewKeyword(e.target.value)}
                                    onKeyDown={handleAddKeyword}
                                    placeholder="Nhập từ cấm rồi nhấn Enter hoặc bấm Thêm..."
                                    className="flex-1 px-4 py-2.5 rounded-xl text-xs font-body outline-none border transition-colors focus:border-[#ff2d78]"
                                    style={{
                                        background: 'var(--vt-input)',
                                        borderColor: 'var(--color-border)',
                                        color: 'var(--color-text-primary)'
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={handleAddKeyword}
                                    className="px-5 py-2.5 rounded-xl text-xs font-semibold font-body text-white bg-[#ff2d78] hover:bg-[#e0246a] border-none cursor-pointer transition-colors shrink-0"
                                >
                                    + Thêm từ khóa
                                </button>
                            </div>

                            {/* Tags list */}
                            <div
                                className="flex flex-wrap gap-2.5 p-4 rounded-xl border min-h-[56px]"
                                style={{
                                    background: 'var(--vt-input)',
                                    borderColor: 'var(--color-border)'
                                }}
                            >
                                {(settings.moderation?.bannedKeywords || []).map(kw => (
                                    <span
                                        key={kw}
                                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold font-body transition-all"
                                        style={{
                                            background: 'rgba(255, 45, 120, 0.1)',
                                            border: '1px solid rgba(255, 45, 120, 0.3)',
                                            color: '#ff2d78'
                                        }}
                                    >
                                        <span>{kw}</span>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveKeyword(kw)}
                                            className="hover:opacity-75 border-none bg-transparent cursor-pointer p-0 text-xs text-current font-bold"
                                            title="Xóa"
                                        >
                                            ✕
                                        </button>
                                    </span>
                                ))}
                                {(!settings.moderation?.bannedKeywords || settings.moderation?.bannedKeywords.length === 0) && (
                                    <span className="text-xs font-body text-muted italic self-center">
                                        Chưa có từ khóa cấm nào.
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Submit Bar */}
                    <div className="flex justify-end pt-2">
                        <button
                            type="button"
                            onClick={handleSaveSettings}
                            disabled={savingSettings}
                            className="flex items-center gap-2.5 px-7 py-3 rounded-xl text-[13px] font-bold font-body text-white bg-[#ff2d78] hover:bg-[#e0246a] shadow-lg shadow-[#ff2d78]/30 border-none cursor-pointer transition-all duration-200 disabled:opacity-50"
                        >
                            {savingSettings && <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                            <span>Lưu tất cả thay đổi</span>
                        </button>
                    </div>
                </div>
            )}

            {/* ========================================================================= */}
            {/* TAB 2: ADMIN PROFILE & SECURITY (Giao diện Rộng 2 Cột) */}
            {/* ========================================================================= */}
            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 w-full max-w-[1300px]">
                    {/* Card 1: Admin Profile Form */}
                    <form
                        onSubmit={handleUpdateProfile}
                        className="rounded-2xl p-6 border transition-all flex flex-col justify-between"
                        style={{
                            background: 'var(--vt-card)',
                            borderColor: 'var(--color-border)',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                        }}
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-5 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: 'rgba(255, 45, 120, 0.1)', color: '#ff2d78' }}>
                                    👤
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold font-display m-0 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                                        Thông tin tài khoản Admin
                                    </h3>
                                    <p className="text-[11px] font-body m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                        Cập nhật họ tên hiển thị và tiểu sử quản trị viên
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-4 mb-6 p-4 rounded-xl border" style={{ background: 'var(--vt-input)', borderColor: 'var(--color-border)' }}>
                                <Avatar user={user} className="!w-16 !h-16 !text-lg shrink-0 shadow-md" />
                                <div>
                                    <p className="text-base font-bold font-body m-0" style={{ color: 'var(--color-text-primary)' }}>
                                        @{user?.username || 'admin'}
                                    </p>
                                    <p className="text-xs font-body m-0 mt-0.5 text-muted">
                                        {user?.email || 'admin@vibetok.com'}
                                    </p>
                                    <span className="inline-block text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-[#ff2d78]/15 text-[#ff2d78] mt-2 border border-[#ff2d78]/25">
                                        {user?.vai_tro || 'Super Admin'}
                                    </span>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                        Họ và tên hiển thị
                                    </label>
                                    <input
                                        type="text"
                                        value={profileForm.display_name}
                                        onChange={e => setProfileForm({ ...profileForm, display_name: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-body outline-none border transition-colors focus:border-[#ff2d78]"
                                        style={{
                                            background: 'var(--vt-input)',
                                            borderColor: 'var(--color-border)',
                                            color: 'var(--color-text-primary)'
                                        }}
                                        placeholder="Tên quản trị viên"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                        Tiểu sử (Bio)
                                    </label>
                                    <textarea
                                        rows={3}
                                        value={profileForm.bio}
                                        onChange={e => setProfileForm({ ...profileForm, bio: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-body outline-none border transition-colors focus:border-[#ff2d78]"
                                        style={{
                                            background: 'var(--vt-input)',
                                            borderColor: 'var(--color-border)',
                                            color: 'var(--color-text-primary)'
                                        }}
                                        placeholder="Mô tả ngắn gọn về quản trị viên..."
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-5 mt-4 border-t flex justify-end" style={{ borderColor: 'var(--color-border)' }}>
                            <button
                                type="submit"
                                disabled={savingProfile}
                                className="px-6 py-2.5 rounded-xl text-xs font-bold font-body text-white bg-[#ff2d78] hover:bg-[#e0246a] shadow-md shadow-[#ff2d78]/25 border-none cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {savingProfile && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                <span>Cập nhật hồ sơ</span>
                            </button>
                        </div>
                    </form>

                    {/* Card 2: Change Password Form */}
                    <form
                        onSubmit={handleChangePassword}
                        className="rounded-2xl p-6 border transition-all flex flex-col justify-between"
                        style={{
                            background: 'var(--vt-card)',
                            borderColor: 'var(--color-border)',
                            boxShadow: '0 2px 12px rgba(0,0,0,0.06)'
                        }}
                    >
                        <div>
                            <div className="flex items-center gap-3 mb-5 pb-3 border-b" style={{ borderColor: 'var(--color-border)' }}>
                                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-base shrink-0" style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444' }}>
                                    🔐
                                </div>
                                <div>
                                    <h3 className="text-[15px] font-bold font-display m-0 leading-tight" style={{ color: 'var(--color-text-primary)' }}>
                                        Đổi mật khẩu Admin
                                    </h3>
                                    <p className="text-[11px] font-body m-0 mt-0.5" style={{ color: 'var(--color-text-muted)' }}>
                                        Đảm bảo mật khẩu an toàn có tối thiểu 8 ký tự
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-4">
                                <div>
                                    <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                        Mật khẩu hiện tại
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordForm.currentPassword}
                                        onChange={e => setPasswordForm({ ...passwordForm, currentPassword: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-body outline-none border transition-colors focus:border-[#ff2d78]"
                                        style={{
                                            background: 'var(--vt-input)',
                                            borderColor: 'var(--color-border)',
                                            color: 'var(--color-text-primary)'
                                        }}
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                        Mật khẩu mới
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        minLength={8}
                                        value={passwordForm.newPassword}
                                        onChange={e => setPasswordForm({ ...passwordForm, newPassword: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-body outline-none border transition-colors focus:border-[#ff2d78]"
                                        style={{
                                            background: 'var(--vt-input)',
                                            borderColor: 'var(--color-border)',
                                            color: 'var(--color-text-primary)'
                                        }}
                                        placeholder="Tối thiểu 8 ký tự"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs font-semibold font-body mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                                        Xác nhận mật khẩu mới
                                    </label>
                                    <input
                                        type="password"
                                        required
                                        value={passwordForm.confirmPassword}
                                        onChange={e => setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })}
                                        className="w-full px-3.5 py-2.5 rounded-xl text-xs font-body outline-none border transition-colors focus:border-[#ff2d78]"
                                        style={{
                                            background: 'var(--vt-input)',
                                            borderColor: 'var(--color-border)',
                                            color: 'var(--color-text-primary)'
                                        }}
                                        placeholder="Nhập lại mật khẩu mới"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="pt-5 mt-4 border-t flex justify-end" style={{ borderColor: 'var(--color-border)' }}>
                            <button
                                type="submit"
                                disabled={savingPassword}
                                className="px-6 py-2.5 rounded-xl text-xs font-bold font-body text-white bg-zinc-800 hover:bg-zinc-700 dark:bg-zinc-700 dark:hover:bg-zinc-600 border-none cursor-pointer transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                {savingPassword && <span className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></span>}
                                <span>Đổi mật khẩu</span>
                            </button>
                        </div>
                    </form>
                </div>
            )}
        </AdminLayout>
    );
}
