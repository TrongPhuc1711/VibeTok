import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import { uploadAvatar } from '../middlewares/uploadMiddleware.js';
import {
    getUserProfile, getSuggestions,
    followUser, unfollowUser,
    updateMyProfile
} from '../controllers/userController.js';
import { getFollowers, getFollowing } from '../controllers/followListController.js';

const router = express.Router();

// Public
router.get('/suggestions', getSuggestions);
router.get('/:username/followers', getFollowers);   // ai follow user này
router.get('/:username/following', getFollowing);   // user này follow ai
router.get('/:username', getUserProfile);

// Protected 
router.patch('/me', verifyToken, uploadAvatar, updateMyProfile);
router.post('/:username/follow', verifyToken, followUser);
router.delete('/:username/follow', verifyToken, unfollowUser);

export default router;