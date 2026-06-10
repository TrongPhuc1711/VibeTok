import { BookmarkModel } from '../models/bookmarkModel.js';
import { normalizeVideo } from '../models/videoModel.js';

// POST /api/bookmarks/:videoId/toggle
export const toggleBookmark = async (req, res) => {
    try {
        const added = await BookmarkModel.toggle(req.user.id, req.params.videoId);
        res.json({ bookmarked: added, message: added ? 'Đã lưu video' : 'Đã bỏ lưu video' });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi lưu bookmark', error: e.message });
    }
};

// GET /api/bookmarks
export const getMyBookmarks = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, parseInt(req.query.limit) || 12);
        const result = await BookmarkModel.getByUser(req.user.id, { page, limit });
        console.log('[Bookmarks] Raw rows[0]:', JSON.stringify(result.rows[0], null, 2));
        result.rows = result.rows.map(normalizeVideo);
        console.log('[Bookmarks] Normalized[0]:', JSON.stringify(result.rows[0], null, 2));
        res.json(result);
    } catch (e) {
        console.error('[Bookmarks] Error:', e);
        res.status(500).json({ message: 'Lỗi lấy bookmark', error: e.message });
    }
};

// GET /api/bookmarks/check/:videoId
export const checkBookmark = async (req, res) => {
    try {
        const bookmarked = await BookmarkModel.isBookmarked(req.user.id, req.params.videoId);
        res.json({ bookmarked });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi kiểm tra bookmark', error: e.message });
    }
};