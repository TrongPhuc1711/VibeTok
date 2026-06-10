import api from '../api/api';

const normalizeBookmarkVideo = (v) => {
    if (!v) return null;
    // If already normalized by backend, return as is
    if (v.videoUrl) return v;

    const fullName = v.ten_hien_thi || '';
    const initials = fullName.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U';

    return {
        id: String(v.id),
        userId: String(v.ma_nguoi_dung),
        caption: v.mo_ta || v.tieu_de || '',
        videoUrl: v.duong_dan_video,
        thumbnail: v.anh_thu_nho || null,
        duration: Number(v.thoi_luong_giay) || 0,
        views: Number(v.luot_xem) || 0,
        likes: Number(v.luot_thich) || 0,
        comments: Number(v.luot_binh_luan) || 0,
        shares: Number(v.luot_chia_se) || 0,
        bookmarks: 0,
        privacy: v.quyen_rieng_tu,
        allowDuet: Boolean(v.cho_phep_duet),
        allowStitch: Boolean(v.cho_phep_stitch),
        location: v.vi_tri || '',
        isDraft: Boolean(v.la_ban_nhap),
        createdAt: v.ngay_tao,
        isLiked: Boolean(v.is_liked),
        isFollowing: Boolean(v.is_following),
        user: {
            id: String(v.ma_nguoi_dung),
            username: v.ten_dang_nhap,
            fullName: fullName,
            anh_dai_dien: v.anh_dai_dien,
            isCreator: v.vai_tro === 'creator' || v.vai_tro === 'admin',
            initials,
            isFollowing: Boolean(v.is_following),
        },
        originalVolume: v.am_luong_goc ?? 1.0,
        musicVolume: v.am_luong_nhac ?? 0.5,
        music: v.music_id ? {
            id: String(v.music_id),
            title: v.tieu_de_nhac,
            artist: v.nghe_si,
            audioUrl: v.duong_dan_am_thanh,
            cover: v.anh_bia,
        } : null,
    };
};

export const toggleBookmark = (videoId) =>
    api.post(`/bookmarks/${videoId}/toggle`).then(r => r.data);

export const checkBookmark = (videoId) =>
    api.get(`/bookmarks/check/${videoId}`).then(r => r.data.bookmarked);

export const getMyBookmarks = (params = {}) =>
    api.get('/bookmarks', { params }).then(r => {
        const data = r.data;
        if (data && Array.isArray(data.rows)) {
            data.rows = data.rows.map(normalizeBookmarkVideo);
        }
        return data;
    });