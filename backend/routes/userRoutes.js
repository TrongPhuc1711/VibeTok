import express from 'express';
import { verifyToken, optionalAuth } from '../middlewares/authMiddleware.js';
import { uploadAvatar } from '../middlewares/uploadMiddleware.js';
import {
    getUserProfile, getSuggestions,
    followUser, unfollowUser,
    updateMyProfile
} from '../controllers/userController.js';
import { getFollowers, getFollowing } from '../controllers/followListController.js';

const router = express.Router();

// Public (nhưng dùng optionalAuth để biết user hiện tại → check isFollowing đúng)
router.get('/suggestions', optionalAuth, getSuggestions);
router.get('/:username/followers', optionalAuth, getFollowers);
router.get('/:username/following', optionalAuth, getFollowing);
router.get('/:username', optionalAuth, getUserProfile);

// Protected 
router.patch('/me', verifyToken, uploadAvatar, updateMyProfile);
router.post('/:username/follow', verifyToken, followUser);
router.delete('/:username/follow', verifyToken, unfollowUser);

export default router;