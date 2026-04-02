import express from 'express';
import { getAllMusic } from '../controllers/contentController.js';
import { getTrendingHashtags, searchHashtags } from '../controllers/contentController.js';
import { getAllCategories } from '../controllers/contentController.js';
import { syncTrendingMusicFromAudius } from '../services/audiusSyncService.js';

const router = express.Router();

router.get('/music', getAllMusic);
router.get('/hashtags/trending', getTrendingHashtags);
router.get('/hashtags/search', searchHashtags);
router.get('/categories', getAllCategories);
router.get('/music/sync-audius', async (req, res) => {
    const result = await syncTrendingMusicFromAudius();
    if (result.success) {
        res.json({ message: `Đã đồng bộ thành công ${result.added} bài hát mới từ Audius!` });
    } else {
        res.status(500).json({ message: 'Đồng bộ thất bại', error: result.error });
    }
});

export default router;