import pool from '../config/db.js';
import redis from '../config/redis.js';
import { getRecordedSearchQueries } from '../utils/searchHelper.js';

export const AdminModel = {

    // Dashboard Stats
    async getOverviewStats() {
        const [[users]] = await pool.query('SELECT COUNT(*) AS total FROM users WHERE is_active = 1');
        const [[videos]] = await pool.query('SELECT COUNT(*) AS total FROM videos WHERE is_active = 1');
        const [[views]] = await pool.query('SELECT COALESCE(SUM(views_count),0) AS total FROM videos WHERE is_active = 1');
        const [[comments]] = await pool.query('SELECT COUNT(*) AS total FROM comments WHERE is_active = 1');
        const [[likes]] = await pool.query('SELECT COUNT(*) AS total FROM likes');

        // Thống kê tháng trước để tính % thay đổi
        const firstOfMonth = new Date(); firstOfMonth.setDate(1); firstOfMonth.setHours(0, 0, 0, 0);
        const firstOfLastMonth = new Date(firstOfMonth); firstOfLastMonth.setMonth(firstOfLastMonth.getMonth() - 1);

        const [[prevUsers]] = await pool.query(
            'SELECT COUNT(*) AS total FROM users WHERE is_active = 1 AND created_at < ?', [firstOfMonth]);
        const [[prevVideos]] = await pool.query(
            'SELECT COUNT(*) AS total FROM videos WHERE is_active = 1 AND created_at < ?', [firstOfMonth]);
        const [[prevViews]] = await pool.query(
            'SELECT COALESCE(SUM(views_count),0) AS total FROM videos WHERE is_active = 1 AND created_at < ?', [firstOfMonth]);
        const [[prevComments]] = await pool.query(
            'SELECT COUNT(*) AS total FROM comments WHERE is_active = 1 AND created_at < ?', [firstOfMonth]);

        const pct = (cur, prev) => prev > 0 ? +((cur - prev) / prev * 100).toFixed(1) : 0;

        return [
            {
                key: 'totalUsers',
                label: 'Tổng người dùng',
                value: users.total, change: pct(users.total, prevUsers.total),
                positive: users.total >= prevUsers.total
            },
            {
                key: 'totalViews',
                label: 'Tổng lượt xem',
                value: views.total, change: pct(views.total, prevViews.total),
                positive: views.total >= prevViews.total
            },
            {
                key: 'totalVideos',
                label: 'Video đã đăng',
                value: videos.total, change: pct(videos.total, prevVideos.total),
                positive: videos.total >= prevVideos.total
            },
            {
                key: 'totalComments',
                label: 'Tổng bình luận',
                value: comments.total, change: pct(comments.total, prevComments.total),
                positive: comments.total >= prevComments.total
            },
        ];
    },

    // User Growth (N ngày gần nhất) 
    async getUserGrowth(days = 12) {
        const [rows] = await pool.query(`
            SELECT DATE(created_at) AS date,
                   COUNT(*) AS newUsers
            FROM users
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
              AND is_active = 1
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [days]);

        return rows.map(r => ({
            date: String(new Date(r.date).getDate()),
            newUsers: Number(r.newUsers),
        }));
    },

    // Content Distribution (theo category) 
    async getContentDistribution() {
        const COLORS = ['#ff2d78', '#ff6b35', '#7c3aed', '#06b6d4', '#10b981', '#f59e0b', '#ec4899', '#8b5cf6', '#3a3a5a'];

        const [rows] = await pool.query(`
            SELECT c.name AS name, COUNT(vc.video_id) AS total
            FROM categories c
            LEFT JOIN video_categories vc ON vc.category_id = c.id
            WHERE c.id != 1
            GROUP BY c.id, c.name
            ORDER BY total DESC
        `);

        const grand = rows.reduce((s, r) => s + Number(r.total), 0) || 1;

        return rows.map((r, i) => ({
            name: r.name,
            value: Math.round(Number(r.total) / grand * 100),
            color: COLORS[i % COLORS.length],
        }));
    },

    // Top Creators 
    async getTopCreators(limit = 5) {
        const [rows] = await pool.query(`
            SELECT id, username, display_name, email, avatar_url,
                   role, followers, total_videos, total_likes, is_active
            FROM users
            WHERE is_active = 1
            ORDER BY followers DESC
            LIMIT ?
        `, [limit]);

        const COLORS = ['#ff2d78', '#ff6b35', '#f59e0b', '#06b6d4', '#7c3aed', '#10b981', '#ec4899'];

        return rows.map((u, i) => {
            const fullName = u.display_name || u.username;
            const initials = fullName.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U';
            return {
                id: String(u.id),
                rank: i + 1,
                name: fullName,
                username: `@${u.username}`,
                avatar: u.avatar_url || null,
                initials,
                color: COLORS[i % COLORS.length],
                followers: AdminModel._fmt(u.followers),
                videos: Number(u.total_videos),
                views: AdminModel._fmt(u.total_likes),
                status: u.is_active ? 'active' : 'banned',
            };
        });
    },

    // All Users (filter/search/pagination)
    async getUsers({ filter = 'all', search = '', page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;
        const params = [];
        const wheres = [];

        if (filter === 'active') wheres.push('u.is_active = 1 AND (u.banned_until IS NULL OR u.banned_until <= NOW())');
        if (filter === 'banned') wheres.push('(u.is_active = 0 OR (u.banned_until IS NOT NULL AND u.banned_until > NOW()))');
        if (filter === 'creator') wheres.push("u.role = 'creator'");
        if (filter === 'admin') wheres.push("u.role = 'admin'");

        if (search.trim()) {
            wheres.push('(u.username LIKE ? OR u.display_name LIKE ? OR u.email LIKE ?)');
            const like = `%${search.trim()}%`;
            params.push(like, like, like);
        }

        const whereClause = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';

        // Count
        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM users u ${whereClause}`, params
        );

        // Data
        const [rows] = await pool.query(`
            SELECT u.id, u.username, u.display_name, u.email, u.avatar_url,
                   u.role, u.followers, u.total_videos, u.is_active,
                   u.is_verified, u.created_at, u.banned_until, u.ban_reason,
                   IF(u.is_active = 0, 'banned', IF(u.banned_until IS NOT NULL AND u.banned_until > NOW(), 'temp_banned', 'active')) AS computed_status
            FROM users u
            ${whereClause}
            ORDER BY u.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        const COLORS = ['#ff2d78', '#ff6b35', '#f59e0b', '#06b6d4', '#7c3aed', '#10b981', '#ec4899', '#8b5cf6'];

        const users = rows.map((u, i) => {
            const fullName = u.display_name || u.username;
            const initials = fullName.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U';
            return {
                id: String(u.id),
                name: fullName,
                username: `@${u.username}`,
                email: u.email,
                avatar: u.avatar_url || null,
                initials,
                color: COLORS[i % COLORS.length],
                joinDate: u.created_at ? new Date(u.created_at).toLocaleDateString('vi-VN') : '',
                followers: Number(u.followers),
                videos: Number(u.total_videos),
                status: u.computed_status,
                role: u.role,
                verified: Boolean(u.is_verified),
                bannedUntil: u.banned_until || null,
                banReason: u.ban_reason || null,
            };
        });

        return {
            users,
            total,
            page,
            totalPages: Math.ceil(total / limit),
        };
    },

    //  User counts (cho sidebar badges) 
    async getUserCounts() {
        const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM users');
        const [[{ active }]] = await pool.query('SELECT COUNT(*) AS active FROM users WHERE is_active = 1 AND (banned_until IS NULL OR banned_until <= NOW())');
        const [[{ banned }]] = await pool.query('SELECT COUNT(*) AS banned FROM users WHERE is_active = 0');
        const [[{ temp_banned }]] = await pool.query('SELECT COUNT(*) AS temp_banned FROM users WHERE banned_until IS NOT NULL AND banned_until > NOW()');
        const [[{ creator }]] = await pool.query("SELECT COUNT(*) AS creator FROM users WHERE role = 'creator' AND is_active = 1");
        return { all: total, active, banned: banned + temp_banned, creator };
    },

    //  Ban / Unban 
    async banUser(userId) {
        const [users] = await pool.query('SELECT id, role, is_active FROM users WHERE id = ?', [userId]);
        if (users.length === 0 || users[0].role === 'admin') {
            return { success: false, message: 'Người dùng không tồn tại hoặc là admin' };
        }
        if (!users[0].is_active) {
            return { success: false, message: 'Tài khoản này đã bị vô hiệu hóa vĩnh viễn trước đó!' };
        }

        const [result] = await pool.query(
            'UPDATE users SET is_active = 0 WHERE id = ? AND role != ?',
            [userId, 'admin']
        );
        return { success: result.affectedRows > 0 };
    },

    async unbanUser(userId) {
        const [result] = await pool.query(
            'UPDATE users SET is_active = 1, banned_until = NULL, ban_reason = NULL WHERE id = ?',
            [userId]
        );
        return { success: result.affectedRows > 0 };
    },

    // Temporary Ban (vô hiệu hóa tạm thời)
    async tempBanUser(userId, durationMinutes, reason = null) {
        // Kiểm tra không phải admin và trạng thái hiện tại
        const [users] = await pool.query(
            `SELECT id, role, is_active, 
                    IF(banned_until IS NOT NULL AND banned_until > NOW(), 1, 0) AS is_temp_banned 
             FROM users WHERE id = ?`,
            [userId]
        );
        if (users.length === 0 || users[0].role === 'admin') {
            return { success: false, message: 'Người dùng không tồn tại hoặc là admin' };
        }
        if (!users[0].is_active) {
            return { success: false, message: 'Tài khoản này đã bị vô hiệu hóa vĩnh viễn, không thể khóa tạm thời!' };
        }
        if (users[0].is_temp_banned) {
            return { success: false, message: 'Tài khoản này hiện đang trong thời gian vô hiệu hóa tạm thời!' };
        }

        const [result] = await pool.query(
            'UPDATE users SET banned_until = DATE_ADD(NOW(), INTERVAL ? MINUTE), ban_reason = ? WHERE id = ? AND role != ?',
            [durationMinutes, reason, userId, 'admin']
        );
        return { success: result.affectedRows > 0 };
    },

    // Admin reset user password
    async resetUserPassword(userId, newPassword) {
        // Kiểm tra user tồn tại và không phải admin
        const [users] = await pool.query(
            'SELECT id, role FROM users WHERE id = ?',
            [userId]
        );
        if (users.length === 0 || users[0].role === 'admin') return false;

        const bcrypt = (await import('bcryptjs')).default;
        const salt = await bcrypt.genSalt(12);
        const hashed = await bcrypt.hash(newPassword, salt);

        const [result] = await pool.query(
            'UPDATE users SET password = ? WHERE id = ? AND role != ?',
            [hashed, userId, 'admin']
        );
        return result.affectedRows > 0;
    },

    //  All Videos (filter/pagination) 
    async getVideos({ status = 'all', search = '', page = 1, limit = 12 } = {}) {
        const offset = (page - 1) * limit;
        const params = [];
        const wheres = [];

        if (status === 'active') wheres.push('v.is_active = 1 AND v.is_draft = 0');
        if (status === 'draft') wheres.push('v.is_draft = 1');
        if (status === 'hidden') wheres.push('v.is_active = 0 AND (v.moderation_status IS NULL OR v.moderation_status != \'rejected\')');
        if (status === 'rejected') wheres.push('v.moderation_status = \'rejected\'');

        if (search.trim()) {
            wheres.push('(v.description LIKE ? OR v.title LIKE ?)');
            const like = `%${search.trim()}%`;
            params.push(like, like);
        }

        const whereClause = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM videos v ${whereClause}`, params
        );

        const [rows] = await pool.query(`
            SELECT v.id, v.user_id, v.title, v.description, v.video_url, v.thumbnail_url,
                   v.duration_seconds, v.privacy, v.views_count, v.likes_count,
                   v.comments_count, v.is_active, v.is_draft, v.created_at,
                   v.moderation_status, v.rejection_reason,
                   u.username, u.display_name, u.avatar_url,
                   IF(u.is_active = 0, 'banned', IF(u.banned_until IS NOT NULL AND u.banned_until > NOW(), 'temp_banned', 'active')) AS creator_status
            FROM videos v
            LEFT JOIN users u ON v.user_id = u.id
            ${whereClause}
            ORDER BY v.created_at DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        const COLORS = ['#ff2d78', '#ff6b35', '#f59e0b', '#06b6d4', '#7c3aed', '#10b981'];

        const videos = rows.map((v, i) => {
            const creatorName = v.display_name || v.username || '';
            const initials = creatorName.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U';
            const duration = v.duration_seconds || 0;
            const mins = Math.floor(duration / 60);
            const secs = duration % 60;
            return {
                id: String(v.id),
                userId: String(v.user_id),
                title: v.title || v.description || 'Không có tiêu đề',
                creator: creatorName,
                creatorStatus: v.creator_status || 'active',
                username: `@${v.username || ''}`,
                avatar: v.avatar_url || null,
                initials,
                color: COLORS[i % COLORS.length],
                thumbnail: v.thumbnail_url,
                videoUrl: v.video_url || null,
                duration: `${mins}:${String(secs).padStart(2, '0')}`,
                views: Number(v.views_count),
                likes: Number(v.likes_count),
                comments: Number(v.comments_count),
                privacy: v.privacy,
                status: v.moderation_status === 'rejected' ? 'rejected' : (!v.is_active ? 'hidden' : v.is_draft ? 'draft' : 'active'),
                moderationStatus: v.moderation_status || 'approved',
                rejectionReason: v.rejection_reason || null,
                createdAt: v.created_at ? new Date(v.created_at).toLocaleDateString('vi-VN') : '',
                submitTime: AdminModel._timeAgo(v.created_at),
            };
        });

        return { videos, total, page, totalPages: Math.ceil(total / limit) };
    },

    //  Video counts 
    async getVideoCounts() {
        const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM videos');
        const [[{ active }]] = await pool.query('SELECT COUNT(*) AS active FROM videos WHERE is_active = 1 AND is_draft = 0');
        const [[{ draft }]] = await pool.query('SELECT COUNT(*) AS draft FROM videos WHERE is_draft = 1');
        const [[{ hidden }]] = await pool.query('SELECT COUNT(*) AS hidden FROM videos WHERE is_active = 0 AND (moderation_status IS NULL OR moderation_status != \'rejected\')');
        const [[{ rejected }]] = await pool.query('SELECT COUNT(*) AS rejected FROM videos WHERE moderation_status = \'rejected\'');
        return { all: total, active, draft, hidden, rejected };
    },

    // Admin approve video bị từ chối
    async approveVideo(videoId) {
        const [r] = await pool.query(
            `UPDATE videos SET moderation_status = 'approved', rejection_reason = NULL, is_active = 1 WHERE id = ?`,
            [videoId]
        );
        return r.affectedRows > 0;
    },

    //  Hide / Restore video 
    async hideVideo(videoId, reason = null) {
        const [r] = await pool.query(
            'UPDATE videos SET is_active = 0, rejection_reason = ? WHERE id = ?',
            [reason, videoId]
        );
        return r.affectedRows > 0;
    },

    async restoreVideo(videoId) {
        const [r] = await pool.query('UPDATE videos SET is_active = 1 WHERE id = ?', [videoId]);
        return r.affectedRows > 0;
    },

    //  Analytics: views per day 
    async getViewsPerDay(days = 7) {
        const [rows] = await pool.query(`
            SELECT DATE(created_at) AS date,
                   COALESCE(SUM(views_count), 0) AS views,
                   COALESCE(SUM(likes_count), 0) AS likes,
                   COALESCE(SUM(shares_count), 0) AS shares
            FROM videos
            WHERE created_at >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
              AND is_active = 1
            GROUP BY DATE(created_at)
            ORDER BY date ASC
        `, [days]);

        return rows.map(r => ({
            date: `T${new Date(r.date).getDate()}`,
            views: Number(r.views),
            likes: Number(r.likes),
            shares: Number(r.shares),
        }));
    },

    //  Sidebar badge counts 
    async getSidebarCounts() {
        const [[{ users }]] = await pool.query('SELECT COUNT(*) AS users FROM users WHERE is_active = 1');
        const [[{ videos }]] = await pool.query('SELECT COUNT(*) AS videos FROM videos WHERE is_active = 1');
        const [[{ moderation }]] = await pool.query(`
            SELECT (
                (SELECT COUNT(*) FROM videos WHERE moderation_status = 'rejected') +
                (SELECT COUNT(*) FROM video_reports WHERE status = 'pending')
            ) AS total
        `);
        return { users, videos, hidden: Number(moderation?.total) || 0 };
    },

    // All Music (filter/search/pagination)
    async getMusic({ filter = 'all', search = '', page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;
        const params = [];
        const wheres = [];

        if (filter === 'trending') wheres.push('m.is_trending = 1');
        if (filter === 'normal') wheres.push('m.is_trending = 0');

        if (search.trim()) {
            wheres.push('(m.title LIKE ? OR m.artist LIKE ?)');
            const like = `%${search.trim()}%`;
            params.push(like, like);
        }

        const whereClause = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM music m ${whereClause}`, params
        );

        const [rows] = await pool.query(`
            SELECT m.*
            FROM music m
            ${whereClause}
            ORDER BY m.id DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        const tracks = rows.map(m => ({
            id: String(m.id),
            title: m.title,
            artist: m.artist,
            duration: Number(m.duration_seconds) || 0,
            audioUrl: m.audio_url,
            cover: m.cover_url || null,
            trending: Boolean(m.is_trending),
            uses: Number(m.usage_count) || 0,
            createdAt: m.created_at ? new Date(m.created_at).toLocaleDateString('vi-VN') : '',
        }));

        return { tracks, total, page, totalPages: Math.ceil(total / limit) };
    },

    // Music counts
    async getMusicCounts() {
        const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM music');
        const [[{ trending }]] = await pool.query('SELECT COUNT(*) AS trending FROM music WHERE is_trending = 1');
        const normal = total - trending;
        return { all: total, trending, normal };
    },

    // Create music
    async createMusic({ title, artist, duration, audioUrl, cover, trending }) {
        const [result] = await pool.query(
            `INSERT INTO music (title, artist, duration_seconds, audio_url, cover_url, is_trending, usage_count)
             VALUES (?, ?, ?, ?, ?, ?, 0)`,
            [title, artist, duration || 0, audioUrl || '', cover || null, trending ? 1 : 0]
        );
        return result.insertId;
    },

    // Update music
    async updateMusic(id, { title, artist, duration, audioUrl, cover, trending }) {
        const fields = [];
        const values = [];

        if (title !== undefined) { fields.push('title = ?'); values.push(title); }
        if (artist !== undefined) { fields.push('artist = ?'); values.push(artist); }
        if (duration !== undefined) { fields.push('duration_seconds = ?'); values.push(duration); }
        if (audioUrl !== undefined) { fields.push('audio_url = ?'); values.push(audioUrl); }
        if (cover !== undefined) { fields.push('cover_url = ?'); values.push(cover); }
        if (trending !== undefined) { fields.push('is_trending = ?'); values.push(trending ? 1 : 0); }

        if (fields.length === 0) return false;

        values.push(id);
        const [result] = await pool.query(
            `UPDATE music SET ${fields.join(', ')} WHERE id = ?`, values
        );
        return result.affectedRows > 0;
    },

    // Delete music
    async deleteMusic(id) {
        // Xóa liên kết với video trước
        await pool.query('UPDATE videos SET music_id = NULL WHERE music_id = ?', [id]);
        const [result] = await pool.query('DELETE FROM music WHERE id = ?', [id]);
        return result.affectedRows > 0;
    },

    // Toggle trending
    async toggleMusicTrending(id) {
        const [rows] = await pool.query('SELECT is_trending FROM music WHERE id = ?', [id]);
        if (rows.length === 0) return null;
        const newVal = rows[0].is_trending ? 0 : 1;
        await pool.query('UPDATE music SET is_trending = ? WHERE id = ?', [newVal, id]);
        return newVal === 1;
    },

    // Top Trending Search Keywords & Videos
    async getSearchTrends(limit = 10) {
        let keywords = [];

        // 1. Đọc từ khóa tìm kiếm thực tế đã được ghi nhận (từ Redis hoặc In-Memory cache)
        try {
            keywords = await getRecordedSearchQueries(limit);
        } catch (e) {
            console.error('getRecordedSearchQueries error:', e.message);
        }

        // 2. Fallback / Bổ sung từ bảng hashtags nếu chưa đủ dữ liệu
        if (keywords.length < limit) {
            const existingNames = new Set(keywords.map(k => k.rawName.toLowerCase()));
            try {
                const [hashtagRows] = await pool.query(`
                    SELECT name, total_videos, is_trending
                    FROM hashtags
                    ORDER BY total_videos DESC, is_trending DESC
                    LIMIT ?
                `, [limit + 5]);

                for (const h of hashtagRows) {
                    if (!existingNames.has(h.name.toLowerCase())) {
                        keywords.push({
                            name: `#${h.name}`,
                            rawName: h.name,
                            count: Number(h.total_videos) || 1,
                            type: 'hashtag',
                        });
                        existingNames.add(h.name.toLowerCase());
                    }
                }
            } catch (err) {
                console.error('Hashtag fallback error:', err.message);
            }
        }

        // Nếu vẫn trống (trường hợp DB trắng), thêm các chủ đề mặc định
        if (keywords.length === 0) {
            const defaults = ['vibes', 'dance', 'trend', 'music', 'funny', 'lifestyle', 'gaming', 'tech', 'travel', 'food'];
            keywords = defaults.slice(0, limit).map((d, i) => ({
                name: `#${d}`,
                rawName: d,
                count: (10 - i) * 10,
                type: 'default',
            }));
        }

        // 3. Sắp xếp toàn bộ từ khóa theo số lượt (count) giảm dần từ cao xuống thấp
        keywords.sort((a, b) => b.count - a.count);
        keywords = keywords.slice(0, limit);

        // Tính % relative popularity và gán thứ hạng
        const maxCount = Math.max(...keywords.map(k => k.count), 1);
        keywords = keywords.map((k, index) => ({
            ...k,
            rank: index + 1,
            percent: Math.max(8, Math.round((k.count / maxCount) * 100)),
            displayCount: AdminModel._fmt(k.count),
        }));

        // 3. Lấy Top Videos thịnh hành / được quan tâm nhiều nhất
        let videos = [];
        try {
            const [videoRows] = await pool.query(`
                SELECT v.id, v.title, v.description, v.thumbnail_url, v.video_url,
                       v.views_count, v.likes_count, v.comments_count, v.duration_seconds, v.created_at,
                       u.id AS user_id, u.username, u.display_name, u.avatar_url
                FROM videos v
                LEFT JOIN users u ON v.user_id = u.id
                WHERE v.is_active = 1 
                  AND v.is_draft = 0 
                  AND (v.moderation_status IS NULL OR v.moderation_status != 'rejected')
                ORDER BY (v.views_count * 2 + v.likes_count * 3 + v.comments_count * 2) DESC, v.views_count DESC, v.id DESC
                LIMIT ?
            `, [limit]);

            const COLORS = ['#ff2d78', '#ff6b35', '#f59e0b', '#06b6d4', '#7c3aed', '#10b981'];

            videos = videoRows.map((v, i) => {
                const creatorName = v.display_name || v.username || 'Creator';
                const initials = creatorName.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U';
                const duration = v.duration_seconds || 0;
                const mins = Math.floor(duration / 60);
                const secs = duration % 60;
                return {
                    id: String(v.id),
                    rank: i + 1,
                    title: v.title || v.description || 'Video thịnh hành',
                    thumbnail: v.thumbnail_url,
                    videoUrl: v.video_url,
                    duration: `${mins}:${String(secs).padStart(2, '0')}`,
                    views: AdminModel._fmt(v.views_count),
                    likes: AdminModel._fmt(v.likes_count),
                    comments: AdminModel._fmt(v.comments_count),
                    rawViews: Number(v.views_count) || 0,
                    creator: {
                        id: String(v.user_id),
                        name: creatorName,
                        username: `@${v.username || ''}`,
                        avatar: v.avatar_url || null,
                        initials,
                        color: COLORS[i % COLORS.length],
                    }
                };
            });
        } catch (err) {
            console.error('getSearchTrends videos error:', err.message);
        }

        return {
            keywords,
            videos,
        };
    },

    //  Helpers 
    _fmt(n) {
        n = Number(n) || 0;
        if (n >= 1e6) return `${(n / 1e6).toFixed(1)}M`;
        if (n >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
        return String(n);
    },

    _timeAgo(date) {
        if (!date) return '';
        const diff = Date.now() - new Date(date).getTime();
        const mins = Math.floor(diff / 60000);
        if (mins < 1) return 'Vừa xong';
        if (mins < 60) return `${mins} phút trước`;
        const hours = Math.floor(mins / 60);
        if (hours < 24) return `${hours} giờ trước`;
        const days = Math.floor(hours / 24);
        return `${days} ngày trước`;
    },
};
