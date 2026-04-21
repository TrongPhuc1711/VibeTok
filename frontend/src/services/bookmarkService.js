import api from '../api/api';

export const toggleBookmark = (videoId) =>
    api.post(`/bookmarks/${videoId}/toggle`).then(r => r.data);

export const checkBookmark = (videoId) =>
    api.get(`/bookmarks/check/${videoId}`).then(r => r.data.bookmarked);

export const getMyBookmarks = (params = {}) =>
    api.get('/bookmarks', { params }).then(r => r.data);