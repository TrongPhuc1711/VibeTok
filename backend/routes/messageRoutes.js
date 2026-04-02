import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
    getInbox, getConversation, sendMessage, getUnreadCount, markRead,
} from '../controllers/messageController.js';

const router = express.Router();
router.use(verifyToken);

router.get('/inbox',           getInbox);
router.get('/unread-count',    getUnreadCount);
router.get('/:username',       getConversation);
router.post('/:username',      sendMessage);
router.patch('/:username/read', markRead);

export default router;