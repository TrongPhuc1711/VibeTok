import { useState, useCallback } from 'react';
import { uploadVideo } from '../services/videoService';
import { mockTracks } from '../services/mockData';
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
        const interval = setInterval(() => setProgress(p => p >= 90 ? p : p + Math.random() * 12), 200);
        try {
            await uploadVideo({ ...form, isDraft });
            setProgress(100);
            onSuccess?.();
            return true;
        } catch (err) {
            setErrors(p => ({ ...p, submit: err.message || 'Đăng video thất bại' }));
            return false;
        } finally {
            clearInterval(interval);
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