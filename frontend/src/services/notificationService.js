import api from '../api/api';

export const getNotifications = async ({ page = 1, limit = 20 } = {}) => {
  try {
    const res = await api.get('/notifications', { params: { page, limit } });
    return { data: res.data };
  } catch {
    return { data: { notifications: [], total: 0, unread: 0 } };
  }
};

export const markAsRead = async (notificationId) => {
  try {
    await api.patch(`/notifications/${notificationId}/read`);
  } catch (e) { console.error(e); }
};

export const markAllAsRead = async () => {
  try {
    await api.patch('/notifications/read-all');
  } catch (e) { console.error(e); }
};