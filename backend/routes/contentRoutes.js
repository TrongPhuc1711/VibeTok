import express from 'express';
import { getAllMusic }                            from '../controllers/contentController.js';
import { getTrendingHashtags, searchHashtags }    from '../controllers/contentController.js';
import { getAllCategories }                        from '../controllers/contentController.js';

const router = express.Router();

router.get('/music',               getAllMusic);
router.get('/hashtags/trending',   getTrendingHashtags);
router.get('/hashtags/search',     searchHashtags);
router.get('/categories',          getAllCategories);

export default router;