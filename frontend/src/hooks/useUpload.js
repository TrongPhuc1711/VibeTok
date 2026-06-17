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
    music: null,          
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

    const submit = useCallback(async (isDraft = false, extraData = {}, images = []) => {
        const { valid, errors: e } = validateForm(form, uploadSchema);
        if (!file && images.length === 0 && !isDraft) { 
            const errs = { ...e, file: 'Vui lòng chọn video hoặc ảnh' };
            setErrors(errs); 
            return { success: false, errors: errs }; 
        }
        if (!valid) { 
            setErrors(e); 
            return { success: false, errors: e }; 
        }

        setUploading(true);
        setProgress(0);

        try {
            const data = new FormData();
            if (file) {
                data.append('video', file);
            } else if (images.length > 0) {
                images.forEach(img => {
                    data.append('images', img.file);
                });
            }
            data.append('caption',     form.caption || '');
            data.append('privacy',     form.privacy || 'public');
            data.append('allowDuet',   String(form.allowDuet  ?? true));
            data.append('allowStitch', String(form.allowStitch ?? true));
            data.append('location',    form.location || '');
            data.append('isDraft',     String(isDraft));
            if (form.music?.id) data.append('musicId', String(form.music.id));
            if (extraData.originalVolume !== undefined) data.append('originalVolume', String(extraData.originalVolume));
            if (extraData.musicVolume !== undefined) data.append('musicVolume', String(extraData.musicVolume));

            await api.post('/videos/upload', data, {
                headers: { 'Content-Type': 'multipart/form-data' },
                timeout: 5 * 60 * 1000, // 5 phút cho upload (nhiều ảnh qua Cloudinary cần thời gian)
                onUploadProgress: (e) => {
                    const pct = Math.round((e.loaded * 100) / (e.total || 1));
                    setProgress(pct);
                },
            });

            setProgress(100);
            onSuccess?.();
            return { success: true };
        } catch (err) {
            console.error('[useUpload] Upload failed:', err);
            let msg = 'Đăng video thất bại';
            let rejectionInfo = null;

            if (err.response?.status === 403 && err.response?.data?.reason) {
                // Video bị kiểm duyệt từ chối
                msg = err.response.data.message || 'Video bị từ chối do vi phạm chính sách cộng đồng';
                rejectionInfo = {
                    reason: err.response.data.reason,
                    categories: err.response.data.categories || [],
                };
            } else if (err.response?.data?.message) {
                msg = err.response.data.message;
            } else if (err.code === 'ECONNABORTED') {
                msg = 'Upload quá thời gian. Vui lòng thử lại với file nhỏ hơn.';
            } else if (err.response?.status) {
                msg = `Request failed with status code ${err.response.status}`;
            } else if (err.message) {
                msg = err.message;
            }
            setErrors(p => ({ ...p, submit: msg }));
            return { success: false, errors: { submit: msg }, rejectionInfo };
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