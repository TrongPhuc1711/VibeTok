import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { toggleBookmark, getMyBookmarks, checkBookmark } from '../controllers/bookmarkController.js';

const router = express.Router();
router.use(verifyToken);

router.get('/', getMyBookmarks);
router.get('/check/:videoId', checkBookmark);
router.post('/:videoId/toggle', toggleBookmark);

export default router;