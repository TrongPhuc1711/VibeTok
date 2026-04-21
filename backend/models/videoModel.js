import pool from '../config/db.js';
import { normalizeUser } from './userModel.js';

export const normalizeVideo = (v) => {
    if (!v) return null;
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
        user: v.user_id ? {
            id: String(v.user_id),
            username: v.ten_dang_nhap,
            fullName: v.ten_hien_thi,
            anh_dai_dien: v.anh_dai_dien,
            isCreator: v.vai_tro === 'creator' || v.vai_tro === 'admin',
            initials: (v.ten_hien_thi || '').trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U',
            isFollowing: Boolean(v.is_following),
        } : null,
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

const buildVideoQuery = (currentUserId = null) => {
    const followingSubquery = currentUserId
        ? `(SELECT COUNT(*) FROM follows 
           WHERE ma_nguoi_theo_doi = ${pool.escape(currentUserId)} 
           AND ma_nguoi_duoc_theo_doi = v.ma_nguoi_dung) > 0`
        : `0`;

    const likedSubquery = currentUserId
        ? `(SELECT COUNT(*) FROM likes 
           WHERE ma_nguoi_dung = ${pool.escape(currentUserId)} 
           AND ma_video = v.id) > 0`
        : `0`;

    return `
        SELECT v.*,
            u.id AS user_id, u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien, u.vai_tro,
            m.id AS music_id, m.tieu_de AS tieu_de_nhac, m.nghe_si, m.duong_dan_am_thanh, m.anh_bia,
            (${followingSubquery}) AS is_following,
            (${likedSubquery}) AS is_liked
        FROM videos v
        LEFT JOIN users u ON v.ma_nguoi_dung = u.id
        LEFT JOIN music m ON v.ma_am_nhac = m.id
    `;
};

export const VideoModel = {
    async getFeed({ page = 1, limit = 5, currentUserId = null, type = 'forYou' } = {}) {
        const offset = (page - 1) * limit;
        const query = buildVideoQuery(currentUserId);

        let whereClause = `WHERE v.quyen_rieng_tu = 'public' AND v.hoat_dong = 1 AND v.la_ban_nhap = 0`;
        let countWhere = `WHERE quyen_rieng_tu='public' AND hoat_dong=1 AND la_ban_nhap=0`;

        if (type === 'following' && currentUserId) {
            const escapedId = pool.escape(currentUserId);
            whereClause += ` AND v.ma_nguoi_dung IN (
                SELECT ma_nguoi_duoc_theo_doi FROM follows WHERE ma_nguoi_theo_doi = ${escapedId}
            )`;
            countWhere += ` AND ma_nguoi_dung IN (
                SELECT ma_nguoi_duoc_theo_doi FROM follows WHERE ma_nguoi_theo_doi = ${escapedId}
            )`;
        }

        const [rows] = await pool.query(
            `${query} ${whereClause} ORDER BY v.ngay_tao DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM videos ${countWhere}`
        );

        return {
            videos: rows.map(normalizeVideo),
            hasMore: offset + rows.length < total,
            total,
        };
    },

    async getByUserId(userId, { page = 1, limit = 12, currentUserId = null } = {}) {
        const offset = (page - 1) * limit;
        const query = buildVideoQuery(currentUserId);
        const [rows] = await pool.query(
            `${query}
             WHERE v.ma_nguoi_dung = ? AND v.hoat_dong = 1 AND v.la_ban_nhap = 0
             ORDER BY v.ngay_tao DESC LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );
        return rows.map(normalizeVideo);
    },

    async findById(id) {
        const [rows] = await pool.query(
            `${buildVideoQuery(null)} WHERE v.id = ? AND v.hoat_dong = 1`,
            [id]
        );
        return normalizeVideo(rows[0]) || null;
    },

    // Find even if deleted (for cleanup after delete)
    async findDeletedById(id) {
        const [rows] = await pool.query(
            `${buildVideoQuery(null)} WHERE v.id = ?`,
            [id]
        );
        return normalizeVideo(rows[0]) || null;
    },

    async findByIdWithAuth(id, currentUserId = null) {
        const [rows] = await pool.query(
            `${buildVideoQuery(currentUserId)} WHERE v.id = ? AND v.hoat_dong = 1`,
            [id]
        );
        return normalizeVideo(rows[0]) || null;
    },

    async search({ q = '', page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;
        const like = `%${q.replace(/%/g, '\\%').replace(/_/g, '\\_')}%`;
        const query = buildVideoQuery(null);
        const [rows] = await pool.query(
            `${query}
             WHERE v.quyen_rieng_tu = 'public' AND v.hoat_dong = 1 AND v.la_ban_nhap = 0
               AND (v.mo_ta LIKE ? OR v.tieu_de LIKE ?)
             ORDER BY v.luot_xem DESC LIMIT ? OFFSET ?`,
            [like, like, limit, offset]
        );
        return rows.map(normalizeVideo);
    },

    async create({ userId, musicId, originalVolume, musicVolume, caption, videoUrl, thumbnail, duration, privacy, allowDuet, allowStitch, location, isDraft, scheduleAt }) {
        const [result] = await pool.query(
            `INSERT INTO videos (ma_nguoi_dung, ma_am_nhac, am_luong_goc, am_luong_nhac, mo_ta, duong_dan_video, anh_thu_nho,
                thoi_luong_giay, quyen_rieng_tu, cho_phep_duet, cho_phep_stitch, vi_tri,
                ngay_len_lich, la_ban_nhap, hoat_dong)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)`,
            [userId, musicId || null, originalVolume, musicVolume, caption, videoUrl, thumbnail || null,
                duration || 0, privacy || 'public', allowDuet ? 1 : 0, allowStitch ? 1 : 0,
                location || null, scheduleAt || null, isDraft ? 1 : 0]
        );
        return result.insertId;
    },

    // Owner soft-delete
    async softDelete(videoId, userId) {
        const [result] = await pool.query(
            'UPDATE videos SET hoat_dong = 0 WHERE id = ? AND ma_nguoi_dung = ?',
            [videoId, userId]
        );
        return result.affectedRows > 0;
    },

    // Admin soft-delete (no owner check)
    async softDeleteByAdmin(videoId) {
        const [result] = await pool.query(
            'UPDATE videos SET hoat_dong = 0 WHERE id = ?',
            [videoId]
        );
        return result.affectedRows > 0;
    },

    async incrementViews(videoId) {
        await pool.query('UPDATE videos SET luot_xem = luot_xem + 1 WHERE id = ?', [videoId]);
    },

    async updateLikeCount(videoId, delta = 1) {
        await pool.query(
            'UPDATE videos SET luot_thich = GREATEST(0, luot_thich + ?) WHERE id = ?',
            [delta, videoId]
        );
    },

    async updateCommentCount(videoId, delta = 1) {
        await pool.query(
            'UPDATE videos SET luot_binh_luan = GREATEST(0, luot_binh_luan + ?) WHERE id = ?',
            [delta, videoId]
        );
    },
};