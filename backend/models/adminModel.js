import pool from '../config/db.js';

export const AdminModel = {

    // Dashboard Stats
    async getOverviewStats() {
        const [[users]] = await pool.query('SELECT COUNT(*) AS total FROM users WHERE hoat_dong = 1');
        const [[videos]] = await pool.query('SELECT COUNT(*) AS total FROM videos WHERE hoat_dong = 1');
        const [[views]] = await pool.query('SELECT COALESCE(SUM(luot_xem),0) AS total FROM videos WHERE hoat_dong = 1');
        const [[comments]] = await pool.query('SELECT COUNT(*) AS total FROM comments WHERE hoat_dong = 1');
        const [[likes]] = await pool.query('SELECT COUNT(*) AS total FROM likes');

        // Thống kê tháng trước để tính % thay đổi
        const firstOfMonth = new Date(); firstOfMonth.setDate(1); firstOfMonth.setHours(0, 0, 0, 0);
        const firstOfLastMonth = new Date(firstOfMonth); firstOfLastMonth.setMonth(firstOfLastMonth.getMonth() - 1);

        const [[prevUsers]] = await pool.query(
            'SELECT COUNT(*) AS total FROM users WHERE hoat_dong = 1 AND ngay_tao < ?', [firstOfMonth]);
        const [[prevVideos]] = await pool.query(
            'SELECT COUNT(*) AS total FROM videos WHERE hoat_dong = 1 AND ngay_tao < ?', [firstOfMonth]);
        const [[prevViews]] = await pool.query(
            'SELECT COALESCE(SUM(luot_xem),0) AS total FROM videos WHERE hoat_dong = 1 AND ngay_tao < ?', [firstOfMonth]);
        const [[prevComments]] = await pool.query(
            'SELECT COUNT(*) AS total FROM comments WHERE hoat_dong = 1 AND ngay_tao < ?', [firstOfMonth]);

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
            SELECT DATE(ngay_tao) AS date,
                   COUNT(*) AS newUsers
            FROM users
            WHERE ngay_tao >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
              AND hoat_dong = 1
            GROUP BY DATE(ngay_tao)
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
            SELECT c.ten_danh_muc AS name, COUNT(vc.ma_video) AS total
            FROM categories c
            LEFT JOIN video_categories vc ON vc.ma_danh_muc = c.id
            WHERE c.id != 1
            GROUP BY c.id, c.ten_danh_muc
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
            SELECT id, ten_dang_nhap, ten_hien_thi, email, anh_dai_dien,
                   vai_tro, so_nguoi_theo_doi, tong_so_video, tong_luot_thich, hoat_dong
            FROM users
            WHERE hoat_dong = 1
            ORDER BY so_nguoi_theo_doi DESC
            LIMIT ?
        `, [limit]);

        const COLORS = ['#ff2d78', '#ff6b35', '#f59e0b', '#06b6d4', '#7c3aed', '#10b981', '#ec4899'];

        return rows.map((u, i) => {
            const fullName = u.ten_hien_thi || u.ten_dang_nhap;
            const initials = fullName.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U';
            return {
                id: String(u.id),
                rank: i + 1,
                name: fullName,
                username: `@${u.ten_dang_nhap}`,
                initials,
                color: COLORS[i % COLORS.length],
                followers: AdminModel._fmt(u.so_nguoi_theo_doi),
                videos: Number(u.tong_so_video),
                views: AdminModel._fmt(u.tong_luot_thich),
                status: u.hoat_dong ? 'active' : 'banned',
            };
        });
    },

    // All Users (filter/search/pagination)
    async getUsers({ filter = 'all', search = '', page = 1, limit = 10 } = {}) {
        const offset = (page - 1) * limit;
        const params = [];
        const wheres = [];

        if (filter === 'active') wheres.push('u.hoat_dong = 1');
        if (filter === 'banned') wheres.push('u.hoat_dong = 0');
        if (filter === 'creator') wheres.push("u.vai_tro = 'creator'");
        if (filter === 'admin') wheres.push("u.vai_tro = 'admin'");

        if (search.trim()) {
            wheres.push('(u.ten_dang_nhap LIKE ? OR u.ten_hien_thi LIKE ? OR u.email LIKE ?)');
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
            SELECT u.id, u.ten_dang_nhap, u.ten_hien_thi, u.email, u.anh_dai_dien,
                   u.vai_tro, u.so_nguoi_theo_doi, u.tong_so_video, u.hoat_dong,
                   u.da_xac_minh, u.ngay_tao
            FROM users u
            ${whereClause}
            ORDER BY u.ngay_tao DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        const COLORS = ['#ff2d78', '#ff6b35', '#f59e0b', '#06b6d4', '#7c3aed', '#10b981', '#ec4899', '#8b5cf6'];

        const users = rows.map((u, i) => {
            const fullName = u.ten_hien_thi || u.ten_dang_nhap;
            const initials = fullName.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U';
            return {
                id: String(u.id),
                name: fullName,
                username: `@${u.ten_dang_nhap}`,
                email: u.email,
                initials,
                color: COLORS[i % COLORS.length],
                joinDate: u.ngay_tao ? new Date(u.ngay_tao).toLocaleDateString('vi-VN') : '',
                followers: Number(u.so_nguoi_theo_doi),
                videos: Number(u.tong_so_video),
                status: u.hoat_dong ? 'active' : 'banned',
                role: u.vai_tro,
                verified: Boolean(u.da_xac_minh),
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
        const [[{ active }]] = await pool.query('SELECT COUNT(*) AS active FROM users WHERE hoat_dong = 1');
        const [[{ banned }]] = await pool.query('SELECT COUNT(*) AS banned FROM users WHERE hoat_dong = 0');
        const [[{ creator }]] = await pool.query("SELECT COUNT(*) AS creator FROM users WHERE vai_tro = 'creator' AND hoat_dong = 1");
        return { all: total, active, banned, creator };
    },

    //  Ban / Unban 
    async banUser(userId) {
        const [result] = await pool.query(
            'UPDATE users SET hoat_dong = 0 WHERE id = ? AND vai_tro != ?',
            [userId, 'admin']
        );
        return result.affectedRows > 0;
    },

    async unbanUser(userId) {
        const [result] = await pool.query(
            'UPDATE users SET hoat_dong = 1 WHERE id = ?',
            [userId]
        );
        return result.affectedRows > 0;
    },

    //  All Videos (filter/pagination) 
    async getVideos({ status = 'all', search = '', page = 1, limit = 12 } = {}) {
        const offset = (page - 1) * limit;
        const params = [];
        const wheres = [];

        if (status === 'active') wheres.push('v.hoat_dong = 1 AND v.la_ban_nhap = 0');
        if (status === 'draft') wheres.push('v.la_ban_nhap = 1');
        if (status === 'hidden') wheres.push('v.hoat_dong = 0');

        if (search.trim()) {
            wheres.push('(v.mo_ta LIKE ? OR v.tieu_de LIKE ?)');
            const like = `%${search.trim()}%`;
            params.push(like, like);
        }

        const whereClause = wheres.length ? 'WHERE ' + wheres.join(' AND ') : '';

        const [[{ total }]] = await pool.query(
            `SELECT COUNT(*) AS total FROM videos v ${whereClause}`, params
        );

        const [rows] = await pool.query(`
            SELECT v.id, v.tieu_de, v.mo_ta, v.duong_dan_video, v.anh_thu_nho,
                   v.thoi_luong_giay, v.quyen_rieng_tu, v.luot_xem, v.luot_thich,
                   v.luot_binh_luan, v.hoat_dong, v.la_ban_nhap, v.ngay_tao,
                   u.ten_dang_nhap, u.ten_hien_thi, u.anh_dai_dien
            FROM videos v
            LEFT JOIN users u ON v.ma_nguoi_dung = u.id
            ${whereClause}
            ORDER BY v.ngay_tao DESC
            LIMIT ? OFFSET ?
        `, [...params, limit, offset]);

        const COLORS = ['#ff2d78', '#ff6b35', '#f59e0b', '#06b6d4', '#7c3aed', '#10b981'];

        const videos = rows.map((v, i) => {
            const creatorName = v.ten_hien_thi || v.ten_dang_nhap || '';
            const initials = creatorName.trim().split(/\s+/).map(w => w[0]?.toUpperCase() ?? '').slice(0, 2).join('') || 'U';
            const duration = v.thoi_luong_giay || 0;
            const mins = Math.floor(duration / 60);
            const secs = duration % 60;
            return {
                id: String(v.id),
                title: v.tieu_de || v.mo_ta || 'Không có tiêu đề',
                creator: creatorName,
                username: `@${v.ten_dang_nhap || ''}`,
                initials,
                color: COLORS[i % COLORS.length],
                thumbnail: v.anh_thu_nho,
                duration: `${mins}:${String(secs).padStart(2, '0')}`,
                views: Number(v.luot_xem),
                likes: Number(v.luot_thich),
                comments: Number(v.luot_binh_luan),
                privacy: v.quyen_rieng_tu,
                status: !v.hoat_dong ? 'hidden' : v.la_ban_nhap ? 'draft' : 'active',
                createdAt: v.ngay_tao ? new Date(v.ngay_tao).toLocaleDateString('vi-VN') : '',
                submitTime: AdminModel._timeAgo(v.ngay_tao),
            };
        });

        return { videos, total, page, totalPages: Math.ceil(total / limit) };
    },

    //  Video counts 
    async getVideoCounts() {
        const [[{ total }]] = await pool.query('SELECT COUNT(*) AS total FROM videos');
        const [[{ active }]] = await pool.query('SELECT COUNT(*) AS active FROM videos WHERE hoat_dong = 1 AND la_ban_nhap = 0');
        const [[{ draft }]] = await pool.query('SELECT COUNT(*) AS draft FROM videos WHERE la_ban_nhap = 1');
        const [[{ hidden }]] = await pool.query('SELECT COUNT(*) AS hidden FROM videos WHERE hoat_dong = 0');
        return { all: total, active, draft, hidden };
    },

    //  Hide / Restore video 
    async hideVideo(videoId) {
        const [r] = await pool.query('UPDATE videos SET hoat_dong = 0 WHERE id = ?', [videoId]);
        return r.affectedRows > 0;
    },

    async restoreVideo(videoId) {
        const [r] = await pool.query('UPDATE videos SET hoat_dong = 1 WHERE id = ?', [videoId]);
        return r.affectedRows > 0;
    },

    //  Analytics: views per day 
    async getViewsPerDay(days = 7) {
        const [rows] = await pool.query(`
            SELECT DATE(ngay_tao) AS date,
                   COALESCE(SUM(luot_xem), 0) AS views,
                   COALESCE(SUM(luot_thich), 0) AS likes,
                   COALESCE(SUM(luot_chia_se), 0) AS shares
            FROM videos
            WHERE ngay_tao >= DATE_SUB(CURDATE(), INTERVAL ? DAY)
              AND hoat_dong = 1
            GROUP BY DATE(ngay_tao)
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
        const [[{ users }]] = await pool.query('SELECT COUNT(*) AS users FROM users WHERE hoat_dong = 1');
        const [[{ videos }]] = await pool.query('SELECT COUNT(*) AS videos FROM videos WHERE hoat_dong = 1');
        const [[{ hidden }]] = await pool.query('SELECT COUNT(*) AS hidden FROM videos WHERE hoat_dong = 0');
        return { users, videos, hidden };
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
