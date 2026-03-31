import { useState, useCallback } from 'react';
import api from '../api/api';
import { validateForm, uploadSchema } from '../utils/validators';
import { MAX_VIDEO_SIZE_MB } from '../utils/constants';

const INITIAL_FORM = {
    caption: '',
    privacy: 'public',
    allowDuet: true,
    allowStitch: true,
    location: '',
    music: mockTracks[0],
    scheduleType: 'now',
    thumbnail: 'auto',
};

export function useUpload({ onSuccess } = {}) {
    const [form, setForm] = useState(INITIAL_FORM);
    const [file, setFile] = useState(null);
    const [errors, setErrors] = useState({});
    const [uploading, setUploading] = useState(false);
    const [progress, setProgress] = useState(0);

    const setField = useCallback((field) => (value) => {
        setForm(p => ({ ...p, [field]: value }));
        setErrors(p => ({ ...p, [field]: '' }));
    }, []);

    const selectFile = useCallback((f) => {
        if (!f) return;
        if (!f.type.startsWith('video/')) {
            setErrors(p => ({ ...p, file: 'Chỉ chấp nhận file video (mp4, mov...)' }));
            return;
        }
        if (f.size > MAX_VIDEO_SIZE_MB * 1024 * 1024) {
            setErrors(p => ({ ...p, file: `File tối đa ${MAX_VIDEO_SIZE_MB}MB` }));
            return;
        }
        setFile(f);
        setErrors(p => ({ ...p, file: '' }));
    }, []);

    const submit = useCallback(async (isDraft = false) => {
        const { valid, errors: e } = validateForm(form, uploadSchema);
        if (!file && !isDraft) { setErrors({ ...e, file: 'Vui lòng chọn video' }); return false; }
        if (!valid) { setErrors(e); return false; }

        setUploading(true);
        setProgress(0);

        try {
            // Build FormData trực tiếp ở đây để chắc chắn file được đính kèm
            const data = new FormData();
            if (file) data.append('video', file);
            data.append('caption',     form.caption || '');
            data.append('privacy',     form.privacy || 'public');
            data.append('allowDuet',   String(form.allowDuet  ?? true));
            data.append('allowStitch', String(form.allowStitch ?? true));
            data.append('location',    form.location || '');
            data.append('isDraft',     String(isDraft));
            if (form.music?.id) data.append('musicId', String(form.music.id));

            await api.post('/videos/upload', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
                onUploadProgress: (e) => {
                    const pct = Math.round((e.loaded * 100) / (e.total || 1));
                    setProgress(pct);
                },
            });

            setProgress(100);
            onSuccess?.();
            return true;
        } catch (err) {
            const msg = err.response?.data?.message || err.message || 'Đăng video thất bại';
            setErrors(p => ({ ...p, submit: msg }));
            return false;
        } finally {
            setUploading(false);
        }
    }, [form, file, onSuccess]);

    const reset = useCallback(() => {
        setForm(INITIAL_FORM);
        setFile(null);
        setErrors({});
        setProgress(0);
    }, []);

    return { form, file, errors, uploading, progress, setField, selectFile, submit, reset };
}