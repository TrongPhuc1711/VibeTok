import { MusicModel, HashtagModel, CategoryModel } from '../models/contentModel.js';

// Music Controller
// GET /api/music
export const getAllMusic = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 20;
        const tracks = await MusicModel.getAll({ limit });
        res.json({ tracks });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi lấy danh sách nhạc', error: e.message });
    }
};

// Hashtag Controller 
// GET /api/hashtags/trending
export const getTrendingHashtags = async (req, res) => {
    try {
        const limit = parseInt(req.query.limit) || 7;
        const hashtags = await HashtagModel.getTrending({ limit });
        res.json({ hashtags });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi lấy hashtag trending', error: e.message });
    }
};

// GET /api/hashtags/search
export const searchHashtags = async (req, res) => {
    try {
        const { q = '', limit = 5 } = req.query;
        const hashtags = await HashtagModel.search(q, Number(limit));
        res.json({ hashtags });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi tìm hashtag', error: e.message });
    }
};

// GET /api/hashtags/:tagName — lấy thông tin hashtag
export const getHashtagByName = async (req, res) => {
    try {
        const hashtag = await HashtagModel.findByName(req.params.tagName);
        if (!hashtag) return res.status(404).json({ message: 'Hashtag không tồn tại' });
        res.json({ hashtag });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi lấy hashtag', error: e.message });
    }
};

// GET /api/hashtags/:tagName/videos — lấy video theo hashtag (paginated)
export const getVideosByHashtag = async (req, res) => {
    try {
        const page = Math.max(1, parseInt(req.query.page) || 1);
        const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 12));
        const currentUserId = req.user?.id ?? null;
        const data = await HashtagModel.getVideosByHashtag(req.params.tagName, {
            page, limit, currentUserId,
        });
        res.json(data);
    } catch (e) {
        console.error('getVideosByHashtag error:', e);
        res.status(500).json({ message: 'Lỗi lấy video theo hashtag', error: e.message });
    }
};

// Category Controller
// GET /api/categories
export const getAllCategories = async (req, res) => {
    try {
        const categories = await CategoryModel.getAll();
        res.json({ categories });
    } catch (e) {
        res.status(500).json({ message: 'Lỗi lấy danh mục', error: e.message });
    }
};