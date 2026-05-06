import api from '../api/api';

// ── Inbox ──
export const getInbox = async () => {
    const res = await api.get('/messages/inbox');
    return { data: res.data };
};

// ── Conversation ──
export const getConversation = async (username, { page = 1, limit = 50 } = {}) => {
    const res = await api.get(`/messages/${username}`, { params: { page, limit } });
    return { data: res.data };
};

export const sendMessage = async (username, content, type = 'text') => {
    const res = await api.post(`/messages/${username}`, { content, type });
    return { data: res.data };
};

export const markRead = async (username) => {
    await api.patch(`/messages/${username}/read`);
};

// ── Search ──
export const searchMessages = async (username, query) => {
    const res = await api.get(`/messages/${username}/search`, { params: { q: query } });
    return res.data.results || [];
};

// ── Unread count ──
export const getUnreadCount = async () => {
    const res = await api.get('/messages/unread-count');
    return res.data.count;
};

// ── Recall (thu hồi) ──
export const recallMessage = async (messageId) => {
    const res = await api.patch(`/messages/${messageId}/recall`);
    return res.data;
};

// ── Reactions ──
export const reactMessage = async (messageId, emoji) => {
    const res = await api.post(`/messages/${messageId}/react`, { emoji });
    return res.data;
};

export const removeReaction = async (messageId) => {
    const res = await api.delete(`/messages/${messageId}/react`);
    return res.data;
};