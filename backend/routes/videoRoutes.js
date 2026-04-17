import express from 'express';
import { verifyToken, optionalAuth } from '../middlewares/authMiddleware.js';
import { uploadVideo as uploadVideoMiddleware } from '../middlewares/uploadMiddleware.js';
import {
    getFeed, searchVideos, getVideoById, getVideosByUser,
    uploadVideo, getComments, postComment,
    likeVideo, unlikeVideo, deleteVideo,
} from '../controllers/videoController.js';

const router = express.Router();

// Public — dùng optionalAuth để lấy currentUserId khi đã login
router.get('/feed', optionalAuth, getFeed);
router.get('/search', searchVideos);
// Thêm optionalAuth để backend biết currentUserId → tính is_liked, is_following từ DB
router.get('/user/:userId', optionalAuth, getVideosByUser);
router.get('/:id/comments', getComments);
router.get('/:id', optionalAuth, getVideoById);

// Protected (cần đăng nhập)
router.post('/upload', verifyToken, uploadVideoMiddleware, uploadVideo);
router.post('/:id/comments', verifyToken, postComment);
router.post('/:id/like', verifyToken, likeVideo);
router.delete('/:id/like', verifyToken, unlikeVideo);
router.delete('/:id', verifyToken, deleteVideo);

export default router;