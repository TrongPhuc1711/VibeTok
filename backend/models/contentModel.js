import pool from '../config/db.js';
import redis from '../config/redis.js';
import { normalizeVideo } from './videoModel.js';

// Music
export const MusicModel = {
    async getAll({ limit = 20 } = {}) {
        const [rows] = await pool.query(
            'SELECT * FROM music ORDER BY is_trending DESC, usage_count DESC LIMIT ?',
            [limit]
        );
        return rows.map(m => ({
            id:       String(m.id),
            title:    m.title,
            artist:   m.artist,
            duration: Number(m.duration_seconds),
            audioUrl: m.audio_url,
            cover:    m.cover_url || null,
            trending: Boolean(m.is_trending),
            uses:     Number(m.usage_count),
        }));
    },

    async findById(id) {
        const [rows] = await pool.query('SELECT * FROM music WHERE id = ?', [id]);
        if (!rows[0]) return null;
        const m = rows[0];
        return { id: String(m.id), title: m.title, artist: m.artist, duration: Number(m.duration_seconds) };
    },
};

// Hashtag
export const HashtagModel = {
    async getTrending({ limit = 7 } = {}) {
        const [rows] = await pool.query(
            'SELECT * FROM hashtags ORDER BY total_videos DESC, is_trending DESC LIMIT ?',
            [limit]
        );
        return rows.map(h => ({
            id:       String(h.id),
            tag:      `#${h.name}`,
            videos:   Number(h.total_videos),
            trending: Boolean(h.is_trending),
        }));
    },

    // Lấy hashtag theo tên (fuzzy match — tìm tất cả hashtag liên quan)
    async findByName(tagName) {
        const clean = tagName.replace(/^#/, '').toLowerCase();
        const [rows] = await pool.query(
            'SELECT * FROM hashtags WHERE name LIKE ? ORDER BY total_videos DESC',
            [`%${clean}%`]
        );
        if (rows.length === 0) return null;

        // Tổng video từ tất cả hashtag liên quan
        const totalVideos = rows.reduce((sum, h) => sum + Number(h.total_videos), 0);
        // Hashtag chính (nhiều video nhất)
        const primary = rows[0];
        // Danh sách hashtag liên quan
        const relatedTags = rows.map(h => ({
            id: String(h.id),
            tag: `#${h.name}`,
            videos: Number(h.total_videos),
        }));

        return {
            id: String(primary.id),
            tag: `#${clean}`,
            videos: totalVideos,
            trending: Boolean(primary.is_trending),
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
            'SELECT id, name, total_videos FROM hashtags WHERE name LIKE ? ORDER BY total_videos DESC',
            [`%${clean}%`]
        );

        // Tạo danh sách các hashtag name để tìm kiếm fuzzy trong description
        const tagNamesToMatch = new Set();
        tagNamesToMatch.add(`#${clean}`);
        hashRows.forEach(h => {
            tagNamesToMatch.add(`#${h.name.toLowerCase()}`);
        });

        const hashtagIds = hashRows.map(h => h.id);

        let matchConditions = [];
        let queryParams = [];

        if (hashtagIds.length > 0) {
            const placeholders = hashtagIds.map(() => '?').join(',');
            matchConditions.push(`vh.hashtag_id IN (${placeholders})`);
            queryParams.push(...hashtagIds);
        }

        for (const tag of tagNamesToMatch) {
            matchConditions.push(`v.description LIKE ?`);
            queryParams.push(`%${tag}%`);
        }

        if (matchConditions.length === 0) {
            return { videos: [], hasMore: false, total: 0 };
        }

        const matchClause = matchConditions.join(' OR ');

        // Bước 2: Subqueries is_following / is_liked dùng EXISTS (short-circuit)
        const followingExpr = currentUserId
            ? `EXISTS(SELECT 1 FROM follows WHERE follower_id = ${pool.escape(currentUserId)} AND following_id = v.user_id LIMIT 1)`
            : `0`;

        const likedExpr = currentUserId
            ? `EXISTS(SELECT 1 FROM likes WHERE user_id = ${pool.escape(currentUserId)} AND video_id = v.id LIMIT 1)`
            : `0`;

        // Bước 3: Lấy tổng số lượng video chính xác qua count query
        const [countRows] = await pool.query(`
            SELECT COUNT(DISTINCT v.id) AS total
            FROM videos v
            LEFT JOIN video_hashtags vh ON v.id = vh.video_id
            WHERE v.privacy = 'public'
                AND v.is_active = 1
                AND v.is_draft = 0
                AND (${matchClause})
        `, queryParams);
        const total = countRows[0]?.total || 0;

        if (total === 0) {
            return { videos: [], hasMore: false, total: 0 };
        }

        // Bước 4: Main query lấy danh sách video
        const [rows] = await pool.query(`
            SELECT DISTINCT v.*,
                u.id AS user_id, u.username, u.display_name, u.avatar_url, u.role,
                m.id AS music_id, m.title AS music_title, m.artist AS music_artist, m.audio_url, m.cover_url,
                (${followingExpr}) AS is_following,
                (${likedExpr}) AS is_liked
            FROM videos v
            LEFT JOIN video_hashtags vh ON v.id = vh.video_id
            LEFT JOIN users u ON u.id = v.user_id
            LEFT JOIN music m ON m.id = v.music_id
            WHERE v.privacy = 'public'
                AND v.is_active = 1
                AND v.is_draft = 0
                AND (${matchClause})
            ORDER BY v.created_at DESC
            LIMIT ? OFFSET ?
        `, [...queryParams, limit, offset]);

        const videos = rows.map(normalizeVideo);

        // Bước 5: Batch fetch views từ Redis (fire once, không N+1)
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
        const [rows] = await pool.query('SELECT id FROM hashtags WHERE name = ?', [clean]);
        if (rows[0]) return rows[0].id;
        const [result] = await pool.query(
            'INSERT INTO hashtags (name) VALUES (?)',
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
                    'INSERT INTO video_hashtags (video_id, hashtag_id) VALUES (?, ?)',
                    [videoId, hashtagId]
                );
                await pool.query(
                    'UPDATE hashtags SET total_videos = total_videos + 1 WHERE id = ?',
                    [hashtagId]
                );
            } catch (e) { /* ignore dup */ }
        }
    },

    // Tìm kiếm hashtag
    async search(q, limit = 5) {
        const clean = q.replace(/^#/, '').toLowerCase().trim();
        const [rows] = await pool.query(
            'SELECT * FROM hashtags WHERE name LIKE ? ORDER BY total_videos DESC LIMIT ?',
            [`%${clean}%`, limit]
        );
        return rows.map(h => ({
            id:     String(h.id),
            tag:    `#${h.name}`,
            videos: Number(h.total_videos),
        }));
    },
};

// Category
export const CategoryModel = {
    async getAll() {
        const [rows] = await pool.query('SELECT * FROM categories ORDER BY id');
        return rows.map(c => ({
            id:    String(c.id),
            label: c.name,
            value: c.slug,
        }));
    },
};