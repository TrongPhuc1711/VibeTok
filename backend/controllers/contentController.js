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