import pool from '../config/db.js';

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
        const [rows] = await pool.query(
            'SELECT * FROM hashtags WHERE ten_hashtag LIKE ? ORDER BY tong_so_video DESC LIMIT ?',
            [`%${q}%`, limit]
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