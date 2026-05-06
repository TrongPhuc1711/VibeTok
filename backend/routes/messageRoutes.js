import express from 'express';
import { verifyToken } from '../middlewares/authMiddleware.js';
import {
    getInbox,
    getConversation,
    sendMessage,
    getUnreadCount,
    markRead,
    recallMessage,
    searchMessages,
    reactMessage,
    removeReaction,
} from '../controllers/messageController.js';

const router = express.Router();
router.use(verifyToken);

// ── Inbox & unread ──
router.get('/inbox',              getInbox);
router.get('/unread-count',       getUnreadCount);

// ── Message actions (by ID — must be before :username) ──
router.patch('/:id/recall',       recallMessage);
router.post('/:id/react',         reactMessage);      // { emoji }
router.delete('/:id/react',       removeReaction);

// ── Conversation (specific sub-routes first) ──
router.get('/:username/search',   searchMessages);    // ?q=keyword
router.patch('/:username/read',   markRead);
router.get('/:username',          getConversation);
router.post('/:username',         sendMessage);

export default router;