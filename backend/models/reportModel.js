import pool from '../config/db.js';

/*
  Tạo báo cáo video mới
*/
export const createReport = async ({ videoId, userId, reason, description }) => {
    const [result] = await pool.query(
        'INSERT INTO video_reports (video_id, user_id, reason, description) VALUES (?, ?, ?, ?)',
        [videoId, userId, reason, description || null]
    );
    return result.insertId;
};

/*
Kiểm tra user đã báo cáo video này chưa (tránh spam)
 */
export const hasUserReported = async (videoId, userId) => {
    const [rows] = await pool.query(
        'SELECT id FROM video_reports WHERE video_id = ? AND user_id = ? LIMIT 1',
        [videoId, userId]
    );
    return rows.length > 0;
};

/*
Lấy danh sách báo cáo cho Admin
 */
export const getReportsForAdmin = async ({ status = 'all', search = '', page = 1, limit = 10 }) => {
    let whereClause = '1=1';
    const params = [];

    if (status && status !== 'all') {
        whereClause += ' AND vr.status = ?';
        params.push(status);
    }

    if (search && search.trim()) {
        whereClause += ' AND (vr.reason LIKE ? OR vr.description LIKE ? OR u.username LIKE ? OR v.description LIKE ?)';
        const q = `%${search.trim()}%`;
        params.push(q, q, q, q);
    }

    const offset = (page - 1) * limit;

    const countSql = `
        SELECT COUNT(*) AS total
        FROM video_reports vr
        LEFT JOIN users u ON vr.user_id = u.id
        LEFT JOIN videos v ON vr.video_id = v.id
        WHERE ${whereClause}
    `;
    const [[{ total }]] = await pool.query(countSql, params);

    const dataSql = `
        SELECT 
            vr.id,
            vr.video_id,
            vr.user_id AS reporter_id,
            vr.reason,
            vr.description,
            vr.status,
            vr.created_at,
            u.username AS reporter_username,
            u.display_name AS reporter_name,
            u.avatar_url AS reporter_avatar,
            v.video_url,
            v.description AS video_description,
            v.is_active AS video_active,
            creator.username AS creator_username,
            creator.display_name AS creator_name
        FROM video_reports vr
        LEFT JOIN users u ON vr.user_id = u.id
        LEFT JOIN videos v ON vr.video_id = v.id
        LEFT JOIN users creator ON v.user_id = creator.id
        WHERE ${whereClause}
        ORDER BY vr.created_at DESC
        LIMIT ? OFFSET ?
    `;
    const [reports] = await pool.query(dataSql, [...params, limit, offset]);

    return {
        reports,
        total,
        page,
        totalPages: Math.ceil(total / limit) || 1,
    };
};

/**
 * Thống kê số lượng báo cáo theo trạng thái
 */
export const getReportCounts = async () => {
    const [[all]] = await pool.query('SELECT COUNT(*) AS count FROM video_reports');
    const [[pending]] = await pool.query("SELECT COUNT(*) AS count FROM video_reports WHERE status = 'pending'");
    const [[reviewed]] = await pool.query("SELECT COUNT(*) AS count FROM video_reports WHERE status = 'reviewed'");
    const [[resolved]] = await pool.query("SELECT COUNT(*) AS count FROM video_reports WHERE status = 'resolved'");

    return {
        all: all.count,
        pending: pending.count,
        reviewed: reviewed.count,
        resolved: resolved.count,
    };
};

/*
Cập nhật trạng thái báo cáo
*/
export const updateReportStatus = async (reportId, status) => {
    await pool.query('UPDATE video_reports SET status = ? WHERE id = ?', [status, reportId]);
};

/*
Xóa báo cáo
 */
export const deleteReport = async (reportId) => {
    await pool.query('DELETE FROM video_reports WHERE id = ?', [reportId]);
};
