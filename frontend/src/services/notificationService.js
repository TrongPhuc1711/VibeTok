import api from '../api/api';

export const getNotifications = async ({ page = 1, limit = 20 } = {}) => {
  try {
    const res = await api.get('/notifications', { params: { page, limit } });
    return { data: res.data };
  } catch {
    // Trả về empty thay vì mock data — tránh hiển thị dữ liệu giả cho user
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

// export const getMessages = async () => {
//   try {
//     const res = await api.get('/messages/conversations');
//     return { data: res.data };
//   } catch {
//     return { data: { conversations: getMockConversations() } };
//   }
// };

// export const getConversation = async (userId) => {
//   try {
//     const res = await api.get(`/messages/conversations/${userId}`);
//     return { data: res.data };
//   } catch {
//     return { data: { messages: [] } };
//   }
// };

// export const sendMessage = async (toUserId, content) => {
//   try {
//     const res = await api.post('/messages', { toUserId, content });
//     return { data: res.data };
//   } catch (e) {
//     throw new Error(e.response?.data?.message || 'Gửi tin nhắn thất bại');
//   }
// };

export const getMockNotifications = () => [
  {
    id: 'n1', type: 'like', read: false, createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
    actor: { id: 'u1', username: 'trangdancer', fullName: 'Trang Dancer', initials: 'TD', anh_dai_dien: null, color: '#ff6b35' },
    meta: { videoId: 'v1', videoThumb: null, caption: 'Dance challenge mới nhất 🔥' },
  },
  {
    id: 'n2', type: 'follow', read: false, createdAt: new Date(Date.now() - 15 * 60000).toISOString(),
    actor: { id: 'u2', username: 'nguyenvibe', fullName: 'Nguyen Vibe', initials: 'NV', anh_dai_dien: null, color: '#7c3aed' },
    meta: {},
  },
  {
    id: 'n3', type: 'comment', read: false, createdAt: new Date(Date.now() - 30 * 60000).toISOString(),
    actor: { id: 'u3', username: 'hailofi', fullName: 'Hai Lofi', initials: 'HL', anh_dai_dien: null, color: '#06b6d4' },
    meta: { videoId: 'v2', videoThumb: null, caption: 'Hoàng hôn Đà Lạt', comment: 'Đẹp quá bạn ơi! 😍' },
  },
  {
    id: 'n4', type: 'mention', read: true, createdAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    actor: { id: 'u4', username: 'linhbeats', fullName: 'Linh Beats', initials: 'LB', anh_dai_dien: null, color: '#ec4899' },
    meta: { videoId: 'v3', comment: '@bạn xem thử cái này nè' },
  },
  {
    id: 'n5', type: 'like', read: true, createdAt: new Date(Date.now() - 5 * 3600000).toISOString(),
    actor: { id: 'u5', username: 'minhtravel', fullName: 'Minh Travel', initials: 'MT', anh_dai_dien: null, color: '#f59e0b' },
    meta: { videoId: 'v1', caption: 'Dance challenge mới nhất 🔥' },
  },
  {
    id: 'n6', type: 'follow', read: true, createdAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    actor: { id: 'u6', username: 'ducgaming', fullName: 'Duc Gaming', initials: 'DG', anh_dai_dien: null, color: '#10b981' },
    meta: {},
  },
];

export const getMockConversations = () => [
  {
    id: 'c1', unreadCount: 2, updatedAt: new Date(Date.now() - 2 * 60000).toISOString(),
    partner: { id: 'u1', username: 'trangdancer', fullName: 'Trang Dancer', initials: 'TD', anh_dai_dien: null, color: '#ff6b35', isOnline: true },
    lastMessage: { content: 'Ey bạn đã xem video mới của mình chưa?', senderId: 'u1' },
  },
  {
    id: 'c2', unreadCount: 1, updatedAt: new Date(Date.now() - 15 * 60000).toISOString(),
    partner: { id: 'u2', username: 'nguyenvibe', fullName: 'Nguyen Vibe', initials: 'NV', anh_dai_dien: null, color: '#7c3aed', isOnline: false },
    lastMessage: { content: 'Collab nhé! Mình có idea hay lắm 🎬', senderId: 'u2' },
  },
  {
    id: 'c3', unreadCount: 0, updatedAt: new Date(Date.now() - 2 * 3600000).toISOString(),
    partner: { id: 'u3', username: 'minhlofi', fullName: 'Minh Lofi', initials: 'ML', anh_dai_dien: null, color: '#059669', isOnline: true },
    lastMessage: { content: 'ok nha 👍', senderId: 'me' },
  },
  {
    id: 'c4', unreadCount: 0, updatedAt: new Date(Date.now() - 24 * 3600000).toISOString(),
    partner: { id: 'u4', username: 'haibeats', fullName: 'Hai Beats', initials: 'HB', anh_dai_dien: null, color: '#d97706', isOnline: false },
    lastMessage: { content: 'Bạn đang dùng nhạc của mình đó 🎵', senderId: 'u4' },
  },
];