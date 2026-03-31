import React, { useState, useRef, useEffect } from 'react';
import { updateProfile } from '../../../services/userService';
import { setStoredUser, getStoredUser } from '../../../utils/helpers';
import api from '../../../api/api';

/**
 * EditProfileModal — Modal sửa hồ sơ kiểu TikTok
 *
 * Props:
 *  profile  – object (dữ liệu profile hiện tại)
 *  onClose  – () => void
 *  onSaved  – (updatedProfile) => void
 */
export default function EditProfileModal({ profile, onClose, onSaved }) {
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    ten_hien_thi: profile?.fullName || '',
    tieu_su:      profile?.bio      || '',
    vi_tri:       profile?.location || '',
  });
  const [avatarFile,    setAvatarFile]    = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(profile?.anh_dai_dien || null);
  const [saving,        setSaving]        = useState(false);
  const [error,         setError]         = useState('');

  // Đóng khi nhấn Escape
  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose(); };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [onClose]);

  const setField = (field) => (e) => {
    setForm(p => ({ ...p, [field]: e.target.value }));
    setError('');
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Chỉ chấp nhận file ảnh (jpg, png, webp...)');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      setError('Ảnh tối đa 5MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  };

  const handleSave = async () => {
    if (!form.ten_hien_thi.trim()) {
      setError('Tên không được để trống');
      return;
    }
    if (form.ten_hien_thi.trim().length > 50) {
      setError('Tên tối đa 50 ký tự');
      return;
    }

    setSaving(true);
    setError('');
    try {
      let updatedUser = null;

      if (avatarFile) {
        // Upload avatar + profile trong 1 request
        const fd = new FormData();
        fd.append('avatar',       avatarFile);
        fd.append('ten_hien_thi', form.ten_hien_thi.trim());
        fd.append('tieu_su',      form.tieu_su.trim());
        fd.append('vi_tri',       form.vi_tri.trim());
        const res = await api.patch('/users/me', fd, {
          headers: { 'Content-Type': 'multipart/form-data' },
        });
        updatedUser = res.data.user;
      } else {
        // Chỉ cập nhật text
        const res = await updateProfile({
          ten_hien_thi: form.ten_hien_thi.trim(),
          tieu_su:      form.tieu_su.trim(),
          vi_tri:       form.vi_tri.trim(),
        });
        updatedUser = res.data.user;
      }

      // Sync localStorage
      const stored = getStoredUser();
      if (stored) {
        setStoredUser({
          ...stored,
          fullName:     form.ten_hien_thi.trim(),
          ten_hien_thi: form.ten_hien_thi.trim(),
          ...(updatedUser?.anh_dai_dien ? { anh_dai_dien: updatedUser.anh_dai_dien } : {}),
        });
      }

      onSaved?.(updatedUser);
      onClose();
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Cập nhật thất bại');
    } finally {
      setSaving(false);
    }
  };

  const bioMax = 80;
  const initials = (profile?.fullName || profile?.username || 'U')
    .trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U';

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-[680px] bg-[#121212] rounded-2xl border border-[#2a2a2a] shadow-2xl flex flex-col max-h-[90vh] animate-fade-in">

        {/* ── Header ── */}
        <div className="flex items-center justify-between px-6 py-5 border-b border-[#2a2a2a] shrink-0">
          <h2 className="text-white text-[18px] font-semibold font-body">Sửa hồ sơ</h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-[#2a2a2a] hover:bg-[#333] border-none cursor-pointer flex items-center justify-center text-[#888] hover:text-white transition-colors text-lg"
          >
            ×
          </button>
        </div>

        {/* ── Scrollable body ── */}
        <div className="flex-1 overflow-auto">

          {/* Avatar row */}
          <Row label="Ảnh hồ sơ">
            <div className="flex items-center justify-center py-2">
              <div
                className="relative group cursor-pointer"
                onClick={() => fileRef.current?.click()}
              >
                {/* Avatar circle */}
                <div className="w-[96px] h-[96px] rounded-full overflow-hidden bg-gradient-to-br from-[#ff2d78] to-[#ff6b35] flex items-center justify-center text-2xl font-bold text-white border-2 border-[#2a2a2a]">
                  {avatarPreview ? (
                    <img src={avatarPreview} alt="avatar" className="w-full h-full object-cover" />
                  ) : (
                    <span>{initials}</span>
                  )}
                </div>

                {/* Hover overlay */}
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <CameraIcon />
                </div>

                {/* Edit badge */}
                <div className="absolute bottom-0 right-0 w-[28px] h-[28px] rounded-full bg-[#2a2a2a] border border-[#444] flex items-center justify-center shadow-md">
                  <PencilIcon />
                </div>
              </div>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleAvatarChange}
              />
            </div>
          </Row>

          {/* VibeTok ID — readonly */}
          <Row label="VibeTok ID">
            <div>
              <input
                type="text"
                value={profile?.username || ''}
                disabled
                className="w-full bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg px-4 py-3 text-[#666] text-[14px] font-body cursor-not-allowed outline-none"
              />
              <p className="text-[#555] text-[12px] mt-1.5 font-body">
                www.vibetok.app/@{profile?.username}
              </p>
              <p className="text-[#404040] text-[11px] mt-1 font-body leading-relaxed">
                VibeTok ID chỉ có thể bao gồm chữ cái, chữ số, dấu gạch dưới và dấu chấm. Khi thay đổi VibeTok ID, liên kết hồ sơ của bạn cũng sẽ thay đổi.
              </p>
            </div>
          </Row>

          {/* Tên hiển thị */}
          <Row label="Tên">
            <div>
              <input
                type="text"
                value={form.ten_hien_thi}
                onChange={setField('ten_hien_thi')}
                maxLength={50}
                placeholder="Nhập tên hiển thị..."
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-[14px] font-body outline-none focus:border-[#444] transition-colors placeholder:text-[#444]"
              />
              <p className="text-[#555] text-[12px] mt-1.5 font-body">
                Bạn chỉ có thể thay đổi biệt danh 7 ngày một lần.
              </p>
            </div>
          </Row>

          {/* Tiểu sử */}
          <Row label="Tiểu sử">
            <div>
              <textarea
                value={form.tieu_su}
                onChange={(e) => {
                  if (e.target.value.length <= bioMax) setField('tieu_su')(e);
                }}
                rows={4}
                placeholder="Giới thiệu về bản thân..."
                className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-[14px] font-body outline-none focus:border-[#444] transition-colors resize-none placeholder:text-[#444]"
              />
              <p className="text-[#555] text-[12px] mt-1 font-body text-right">
                {form.tieu_su.length}/{bioMax}
              </p>
            </div>
          </Row>

          {/* Vị trí */}
          <Row label="Vị trí" noBorder>
            <input
              type="text"
              value={form.vi_tri}
              onChange={setField('vi_tri')}
              maxLength={100}
              placeholder="Thành phố, quốc gia..."
              className="w-full bg-[#1e1e1e] border border-[#2a2a2a] rounded-lg px-4 py-3 text-white text-[14px] font-body outline-none focus:border-[#444] transition-colors placeholder:text-[#444]"
            />
          </Row>

        </div>

        {/* ── Footer ── */}
        <div className="shrink-0 border-t border-[#2a2a2a] px-6 py-4 flex flex-col gap-2">
          {error && (
            <p className="text-red-400 text-[12px] font-body text-center">{error}</p>
          )}
          <div className="flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2.5 rounded-lg bg-transparent border border-[#333] text-[#aaa] text-[14px] font-semibold font-body cursor-pointer hover:border-[#555] hover:text-white transition-colors disabled:opacity-50"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={saving || !form.ten_hien_thi.trim()}
              className="px-8 py-2.5 rounded-lg bg-[#2a2a2a] hover:bg-[#333] border border-[#444] text-white text-[14px] font-semibold font-body cursor-pointer transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {saving && <SpinIcon />}
              {saving ? 'Đang lưu...' : 'Lưu'}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

/* ── Row layout helper ── */
function Row({ label, children, noBorder = false }) {
  return (
    <div className={`grid grid-cols-[160px_1fr] gap-6 px-6 py-5 ${!noBorder ? 'border-b border-[#1e1e1e]' : ''}`}>
      <div className="flex items-start pt-3">
        <span className="text-white text-[14px] font-semibold font-body">{label}</span>
      </div>
      <div className="flex flex-col">
        {children}
      </div>
    </div>
  );
}

/* ── Icons ── */
function CameraIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round">
      <path d="M2 8.5C2 7.4 2.9 6.5 4 6.5h1.5l1.5-2h8l1.5 2H18c1.1 0 2 .9 2 2v9c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2v-9z"/>
      <circle cx="12" cy="12" r="3"/>
    </svg>
  );
}

function PencilIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" stroke="#aaa" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M9 2l2 2L4 11H2V9L9 2z"/>
    </svg>
  );
}

function SpinIcon() {
  return (
    <svg className="animate-spin" width="14" height="14" viewBox="0 0 14 14" fill="none">
      <circle cx="7" cy="7" r="5.5" stroke="currentColor" strokeWidth="1.5"
        strokeDasharray="20" strokeDashoffset="10" strokeLinecap="round"/>
    </svg>
  );
}