import pool from '../config/db.js';
import { normalizeUser } from './userModel.js';
import redis from '../config/redis.js';

export const normalizeVideo = (v) => {
    if (!v) return null;
    return {
        id: String(v.id),
        userId: String(v.user_id),
        caption: v.description || v.title || '',
        videoUrl: v.video_url,
        thumbnail: v.thumbnail_url || null,
        duration: Number(v.duration_seconds) || 0,
        views: Number(v.views_count) || 0,
        likes: Number(v.likes_count) || 0,
        comments: Number(v.comments_count) || 0,
        shares: Number(v.shares_count) || 0,
        bookmarks: Number(v.bookmark_count) || 0,
        privacy: v.privacy,
        allowDuet: Boolean(v.allow_duet),
        allowStitch: Boolean(v.allow_stitch),
        location: v.location || '',
        isDraft: Boolean(v.is_draft),
        moderationStatus: v.moderation_status || 'approved',
        rejectionReason: v.rejection_reason || null,
        createdAt: v.created_at,
        isLiked: Boolean(v.is_liked),
        isFollowing: Boolean(v.is_following),
        isBookmarked: Boolean(v.is_bookmarked),
        user: v.user_id ? {
            id: String(v.user_id),
            username: v.username,
            fullName: v.display_name,
            anh_dai_dien: v.avatar_url,
            isCreator: v.role === 'creator' || v.role === 'admin',
            initials: (v.display_name || '').trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U',
            isFollowing: Boolean(v.is_following),
        } : null,
        originalVolume: v.original_volume ?? 1.0,
        musicVolume: v.music_volume ?? 0.5,
        music: v.music_id ? {
            id: String(v.music_id),
            title: v.music_title,
            artist: v.music_artist,
            audioUrl: v.audio_url,
            cover: v.cover_url,
        } : null,
    };
};

const buildVideoQuery = (currentUserId = null) => {
    const followingSubquery = currentUserId
        ? `(SELECT COUNT(*) FROM follows 
           WHERE follower_id = ${pool.escape(currentUserId)} 
           AND following_id = v.user_id) > 0`
        : `0`;

    const likedSubquery = currentUserId
        ? `(SELECT COUNT(*) FROM likes 
           WHERE user_id = ${pool.escape(currentUserId)} 
           AND video_id = v.id) > 0`
        : `0`;

    const bookmarkedSubquery = currentUserId
        ? `(SELECT COUNT(*) FROM bookmarks 
           WHERE user_id = ${pool.escape(currentUserId)} 
           AND video_id = v.id) > 0`
        : `0`;

    const bookmarkCountSubquery = `(SELECT COUNT(*) FROM bookmarks WHERE video_id = v.id)`;

    return `
        SELECT v.*,
            u.id AS user_id, u.username, u.display_name, u.avatar_url, u.role,
            m.id AS music_id, m.title AS music_title, m.artist AS music_artist, m.audio_url, m.cover_url,
            (${followingSubquery}) AS is_following,
            (${likedSubquery}) AS is_liked,
            (${bookmarkedSubquery}) AS is_bookmarked,
            (${bookmarkCountSubquery}) AS bookmark_count
        FROM videos v
        LEFT JOIN users u ON v.user_id = u.id
        LEFT JOIN music m ON v.music_id = m.id
    `;
};

export const VideoModel = {
    async getFeed({ page = 1, limit = 5, currentUserId = null, type = 'forYou' } = {}) {
        const offset = (page - 1) * limit;
        const query = buildVideoQuery(currentUserId);

        let whereClause = `WHERE v.privacy = 'public' AND v.is_active = 1 AND v.is_draft = 0 AND v.moderation_status = 'approved'`;
        let countWhere = `WHERE privacy='public' AND is_active=1 AND is_draft=0 AND moderation_status='approved'`;

        if (type === 'following' && currentUserId) {
            const escapedId = pool.escape(currentUserId);
            whereClause += ` AND v.user_id IN (
                SELECT following_id FROM follows WHERE follower_id = ${escapedId}
            )`;
            countWhere += ` AND user_id IN (
                SELECT following_id FROM follows WHERE follower_id = ${escapedId}
            )`;
        }


        const [rows] = await pool.query(
            `${query} ${whereClause} ORDER BY v.created_at DESC LIMIT ? OFFSET ?`,
            [limit, offset]
        );

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM videos ${countWhere}`
        );

        const videos = rows.map(normalizeVideo);
        if (videos.length > 0) {
            const keys = videos.map(v => `video:${v.id}:views`);
            try {
                const cachedViews = await redis.mget(keys);
                videos.forEach((video, idx) => {
                    const views = cachedViews[idx];
                    if (views !== null) {
                        video.views = Number(views);
                    }
                });
            } catch (err) {
                console.error('Error fetching batch views from Redis:', err);
            }
        }

        return {
            videos,
            hasMore: offset + rows.length < total,
            total,
        };
    },

    async getByUserId(userId, { page = 1, limit = 12, currentUserId = null } = {}) {
        const offset = (page - 1) * limit;
        const query = buildVideoQuery(currentUserId);
        const [rows] = await pool.query(
            `${query}
             WHERE v.user_id = ? AND v.is_active = 1 AND v.is_draft = 0
             ORDER BY v.created_at DESC LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );
        const videos = rows.map(normalizeVideo);
        if (videos.length > 0) {
            const keys = videos.map(v => `video:${v.id}:views`);
            try {
                const cachedViews = await redis.mget(keys);
                videos.forEach((video, idx) => {
                    const views = cachedViews[idx];
                    if (views !== null) {
                        video.views = Number(views);
                    }
                });
            } catch (err) {
                console.error('Error fetching batch views from Redis:', err);
            }
        }
        return videos;
    },

    async findById(id) {
        const [rows] = await pool.query(
            `${buildVideoQuery(null)} WHERE v.id = ? AND v.is_active = 1`,
            [id]
        );
        const video = normalizeVideo(rows[0]) || null;
        if (video) {
            const redisViews = await redis.get(`video:${id}:views`);
            if (redisViews !== null) {
                video.views = Number(redisViews);
            }
        }
        return video;
    },

    // Find even if deleted (for cleanup after delete)
    async findDeletedById(id) {
        const [rows] = await pool.query(
            `${buildVideoQuery(null)} WHERE v.id = ?`,
            [id]
        );
        const video = normalizeVideo(rows[0]) || null;
        if (video) {
            const redisViews = await redis.get(`video:${id}:views`);
            if (redisViews !== null) {
                video.views = Number(redisViews);
            }
        }
        return video;
    },

    async findByIdWithAuth(id, currentUserId = null) {
        const [rows] = await pool.query(
            `${buildVideoQuery(currentUserId)} WHERE v.id = ? AND v.is_active = 1`,
            [id]
        );
        const video = normalizeVideo(rows[0]) || null;
        if (video) {
            const redisViews = await redis.get(`video:${id}:views`);
            if (redisViews !== null) {
                video.views = Number(redisViews);
            }
        }
        return video;
    },

    async search({ q = '', page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;
        const query = buildVideoQuery(null);

        if (!q.trim()) {
            const [rows] = await pool.query(
                `${query}
                 WHERE v.privacy = 'public' AND v.is_active = 1 AND v.is_draft = 0 AND v.moderation_status = 'approved'
                 ORDER BY v.views_count DESC LIMIT ? OFFSET ?`,
                [limit, offset]
            );
            return rows.map(normalizeVideo);
        }

        const [rows] = await pool.query(
            `${query}
             WHERE v.privacy = 'public' AND v.is_active = 1 AND v.is_draft = 0 AND v.moderation_status = 'approved'
               AND MATCH(v.title, v.description) AGAINST(? IN NATURAL LANGUAGE MODE)
             LIMIT ? OFFSET ?`,
            [q.trim(), limit, offset]
        );
        return rows.map(normalizeVideo);
    },

    async create({ userId, musicId, originalVolume, musicVolume, caption, videoUrl, thumbnail, duration, privacy, allowDuet, allowStitch, location, isDraft, scheduleAt, moderationStatus = 'approved', rejectionReason = null }) {
        const [result] = await pool.query(
            `INSERT INTO videos (user_id, music_id, original_volume, music_volume, description, video_url, thumbnail_url,
                duration_seconds, privacy, allow_duet, allow_stitch, location,
                scheduled_at, is_draft, is_active, moderation_status, rejection_reason)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [userId, musicId || null, originalVolume, musicVolume, caption, videoUrl, thumbnail || null,
                duration || 0, privacy || 'public', allowDuet ? 1 : 0, allowStitch ? 1 : 0,
                location || null, scheduleAt || null, isDraft ? 1 : 0,
                moderationStatus === 'rejected' ? 0 : 1,
                moderationStatus, rejectionReason]
        );
        return Number(result.insertId);
    },

    // Owner soft-delete
    async softDelete(videoId, userId) {
        const [result] = await pool.query(
            'UPDATE videos SET is_active = 0 WHERE id = ? AND user_id = ?',
            [videoId, userId]
        );
        return result.affectedRows > 0;
    },

    // Admin soft-delete (no owner check)
    async softDeleteByAdmin(videoId) {
        const [result] = await pool.query(
            'UPDATE videos SET is_active = 0 WHERE id = ?',
            [videoId]
        );
        return result.affectedRows > 0;
    },

    async incrementViews(videoId) {
        const key = `video:${videoId}:views`;
        try {
            const exists = await redis.exists(key);
            if (!exists) {
                const [rows] = await pool.query('SELECT views_count FROM videos WHERE id = ?', [videoId]);
                const dbViews = rows[0]?.views_count || 0;
                await redis.set(key, dbViews + 1);
            } else {
                await redis.incr(key);
            }
            await redis.sadd('video:dirty_views', videoId);
        } catch (err) {
            console.error('Error incrementing views in Redis:', err);
            // Fallback directly to DB if Redis fails
            await pool.query('UPDATE videos SET views_count = views_count + 1 WHERE id = ?', [videoId]);
        }
    },

    async updateLikeCount(videoId, delta = 1) {
        await pool.query(
            'UPDATE videos SET likes_count = GREATEST(0, likes_count + ?) WHERE id = ?',
            [delta, videoId]
        );
    },

    async getLikedByUserId(userId, { page = 1, limit = 12, currentUserId = null } = {}) {
        const offset = (page - 1) * limit;
        const query = buildVideoQuery(currentUserId || userId);
        const [rows] = await pool.query(
            `${query}
             INNER JOIN likes l ON l.video_id = v.id AND l.user_id = ?
             WHERE v.is_active = 1 AND v.is_draft = 0
             ORDER BY l.created_at DESC LIMIT ? OFFSET ?`,
            [userId, limit, offset]
        );
        const videos = rows.map(normalizeVideo);
        if (videos.length > 0) {
            const keys = videos.map(v => `video:${v.id}:views`);
            try {
                const cachedViews = await redis.mget(keys);
                videos.forEach((video, idx) => {
                    const views = cachedViews[idx];
                    if (views !== null) {
                        video.views = Number(views);
                    }
                });
            } catch (err) {
                console.error('Error fetching batch views from Redis:', err);
            }
        }
        return videos;
    },

    async updateCommentCount(videoId, delta = 1) {
        await pool.query(
            'UPDATE videos SET comments_count = GREATEST(0, comments_count + ?) WHERE id = ?',
            [delta, videoId]
        );
    },

    async updateShareCount(videoId, delta = 1) {
        await pool.query(
            'UPDATE videos SET shares_count = GREATEST(0, shares_count + ?) WHERE id = ?',
            [delta, videoId]
        );
    },

    /**
     * Cập nhật trạng thái kiểm duyệt video
     * @param {number} videoId
     * @param {'approved'|'rejected'|'pending'} status
     * @param {string|null} reason - Lý do từ chối (nếu rejected)
     */
    async updateModerationStatus(videoId, status, reason = null) {
        // Khi approved → hiển thị (is_active = 1)
        // Khi rejected → ẩn đi (is_active = 0)
        const isActive = status === 'rejected' ? 0 : 1;
        await pool.query(
            `UPDATE videos SET moderation_status = ?, rejection_reason = ?, is_active = ? WHERE id = ?`,
            [status, reason, isActive, videoId]
        );
    },
};