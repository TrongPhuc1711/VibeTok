import pool from '../config/db.js';
import redis from '../config/redis.js';
import { normalizeVideo } from './videoModel.js';

// Music
export const MusicModel = {
    async getAll({ limit = 20 } = {}) {
        const [rows] = await pool.query(
            'SELECT * FROM music ORDER BY dang_thinh_hanh DESC, luot_su_dung DESC LIMIT ?',
            [limit]
        );
        return rows.map(m => ({
            id:       String(m.id),
            title:    m.tieu_de,
            artist:   m.nghe_si,
            duration: Number(m.thoi_luong_giay),
            audioUrl: m.duong_dan_am_thanh,
            cover:    m.anh_bia || null,
            trending: Boolean(m.dang_thinh_hanh),
            uses:     Number(m.luot_su_dung),
        }));
    },

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM music WHERE id = ?', [id]);
        if (!rows[0]) return null;
        const m = rows[0];
        return { id: String(m.id), title: m.tieu_de, artist: m.nghe_si, duration: Number(m.thoi_luong_giay) };
    },
};

// Hashtag
export const HashtagModel = {
    async getTrending({ limit = 7 } = {}) {
        const [rows] = await pool.query(
            'SELECT * FROM hashtags ORDER BY tong_so_video DESC, dang_thinh_hanh DESC LIMIT ?',
            [limit]
        );
        return rows.map(h => ({
            id:       String(h.id),
            tag:      `#${h.ten_hashtag}`,
            videos:   Number(h.tong_so_video),
            trending: Boolean(h.dang_thinh_hanh),
        }));
    },

    // Lấy hashtag theo tên (fuzzy match — tìm tất cả hashtag liên quan)
    async findByName(tagName) {
        const clean = tagName.replace(/^#/, '').toLowerCase();
        const [rows] = await pool.query(
            'SELECT * FROM hashtags WHERE ten_hashtag LIKE ? ORDER BY tong_so_video DESC',
            [`%${clean}%`]
        );
        if (rows.length === 0) return null;

        // Tổng video từ tất cả hashtag liên quan
        const totalVideos = rows.reduce((sum, h) => sum + Number(h.tong_so_video), 0);
        // Hashtag chính (nhiều video nhất)
        const primary = rows[0];
        // Danh sách hashtag liên quan
        const relatedTags = rows.map(h => ({
            id: String(h.id),
            tag: `#${h.ten_hashtag}`,
            videos: Number(h.tong_so_video),
        }));

        return {
            id: String(primary.id),
            tag: `#${clean}`,
            videos: totalVideos,
            trending: Boolean(primary.dang_thinh_hanh),
            relatedTags,
        };
    },

    /**
     * Lấy danh sách video theo hashtag — FUZZY MATCH + OPTIMIZED:
     * 1. LIKE tìm tất cả hashtag liên quan (vd: "dance" → dance, dancing, dancelove...)
     * 2. IN (ids) trên video_hashtags → videos với filter đẩy vào JOIN condition
     * 3. EXISTS thay COUNT(*) cho is_liked / is_following (short-circuit)
     * 4. DISTINCT tránh video trùng khi 1 video có nhiều hashtag match
     */
    async getVideosByHashtag(tagName, { page = 1, limit = 12, currentUserId = null } = {}) {
        const clean = tagName.replace(/^#/, '').toLowerCase();
        const offset = (page - 1) * limit;

        // Bước 1: Tìm TẤT CẢ hashtag liên quan bằng LIKE (fuzzy match)
        // vd: "dance" → #dance, #dancing, #dancefloor, #dancelove...
        const [hashRows] = await pool.query(
            'SELECT id, tong_so_video FROM hashtags WHERE ten_hashtag LIKE ? ORDER BY tong_so_video DESC',
            [`%${clean}%`]
        );
        if (hashRows.length === 0) return { videos: [], hasMore: false, total: 0 };

        const hashtagIds = hashRows.map(h => h.id);
        // Tổng video từ tất cả hashtag liên quan (dùng cached count)
        const total = hashRows.reduce((sum, h) => sum + Number(h.tong_so_video), 0);

        // Bước 2: Subqueries is_following / is_liked dùng EXISTS (short-circuit)
        const followingExpr = currentUserId
            ? `EXISTS(SELECT 1 FROM follows WHERE ma_nguoi_theo_doi = ${pool.escape(currentUserId)} AND ma_nguoi_duoc_theo_doi = v.ma_nguoi_dung LIMIT 1)`
            : `0`;

        const likedExpr = currentUserId
            ? `EXISTS(SELECT 1 FROM likes WHERE ma_nguoi_dung = ${pool.escape(currentUserId)} AND ma_video = v.id LIMIT 1)`
            : `0`;

        // Bước 3: Main query — DISTINCT vì 1 video có thể match nhiều hashtag
        // IN (?) trên indexed ma_hashtag column
        const placeholders = hashtagIds.map(() => '?').join(',');
        const [rows] = await pool.query(`
            SELECT DISTINCT v.*,
                u.id AS user_id, u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien, u.vai_tro,
                m.id AS music_id, m.tieu_de AS tieu_de_nhac, m.nghe_si, m.duong_dan_am_thanh, m.anh_bia,
                (${followingExpr}) AS is_following,
                (${likedExpr}) AS is_liked
            FROM video_hashtags vh
            INNER JOIN videos v ON v.id = vh.ma_video
                AND v.quyen_rieng_tu = 'public'
                AND v.hoat_dong = 1
                AND v.la_ban_nhap = 0
            LEFT JOIN users u ON u.id = v.ma_nguoi_dung
            LEFT JOIN music m ON m.id = v.ma_am_nhac
            WHERE vh.ma_hashtag IN (${placeholders})
            ORDER BY v.ngay_tao DESC
            LIMIT ? OFFSET ?
        `, [...hashtagIds, limit, offset]);

        const videos = rows.map(normalizeVideo);

        // Bước 4: Batch fetch views từ Redis (fire once, không N+1)
        if (videos.length > 0) {
            const keys = videos.map(v => `video:${v.id}:views`);
            try {
                const cachedViews = await redis.mget(keys);
                videos.forEach((video, idx) => {
                    const views = cachedViews[idx];
                    if (views !== null) video.views = Number(views);
                });
            } catch (err) {
                console.error('Error fetching batch views from Redis:', err);
            }
        }

        return { videos, hasMore: offset + rows.length < total, total };
    },

    // Tìm hoặc tạo hashtag, trả về id
    async findOrCreate(tagName) {
        const clean = tagName.replace(/^#/, '').toLowerCase();
        const [rows] = await pool.query('SELECT id FROM hashtags WHERE ten_hashtag = ?', [clean]);
        if (rows[0]) return rows[0].id;
        const [result] = await pool.query(
            'INSERT INTO hashtags (ten_hashtag) VALUES (?)',
            [clean]
        );
        return result.insertId;
    },

    // Gán hashtags cho video
    async attachToVideo(videoId, tagNames) {
        for (const tag of tagNames) {
            const hashtagId = await this.findOrCreate(tag);
            try {
                await pool.query(
                    'INSERT INTO video_hashtags (ma_video, ma_hashtag) VALUES (?, ?)',
                    [videoId, hashtagId]
                );
                await pool.query(
                    'UPDATE hashtags SET tong_so_video = tong_so_video + 1 WHERE id = ?',
                    [hashtagId]
                );
            } catch (e) { /* ignore dup */ }
        }
    },

    // Tìm kiếm hashtag
    async search(q, limit = 5) {
        const clean = q.replace(/^#/, '').toLowerCase().trim();
        const [rows] = await pool.query(
            'SELECT * FROM hashtags WHERE ten_hashtag LIKE ? ORDER BY tong_so_video DESC LIMIT ?',
            [`%${clean}%`, limit]
        );
        return rows.map(h => ({
            id:     String(h.id),
            tag:    `#${h.ten_hashtag}`,
            videos: Number(h.tong_so_video),
        }));
    },
};

// Category
export const CategoryModel = {
    async getAll() {
        const [rows] = await pool.query('SELECT * FROM categories ORDER BY id');
        return rows.map(c => ({
            id:    String(c.id),
            label: c.ten_danh_muc,
            value: c.duong_dan_tinh,
        }));
    },
};