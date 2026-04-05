import express from 'express';
import { optionalAuth } from '../middlewares/authMiddleware.js';
import { getFollowers, getFollowing } from '../controllers/followListController.js';

const router = express.Router();

// GET /api/users/:username/followers
router.get('/:username/followers', optionalAuth, getFollowers);

// GET /api/users/:username/following
router.get('/:username/following', optionalAuth, getFollowing);

export default router;