import api from '../api/api';

export const getInbox = async () => {
    const res = await api.get('/messages/inbox');
    return { data: res.data };
};

export const getConversation = async (username, { page = 1, limit = 50 } = {}) => {
    const res = await api.get(`/messages/${username}`, { params: { page, limit } });
    return { data: res.data };
};

export const sendMessage = async (username, content) => {
    const res = await api.post(`/messages/${username}`, { content });
    return { data: res.data };
};

export const markRead = async (username) => {
    await api.patch(`/messages/${username}/read`);
};

export const getUnreadCount = async () => {
    const res = await api.get('/messages/unread-count');
    return res.data.count;
};