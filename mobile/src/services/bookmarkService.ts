/**
 * Bookmark service — toggle, check, list.
 */

import api from '../api/api';

export const toggleBookmark = (videoId: string) =>
  api.post(`/bookmarks/${videoId}/toggle`).then((r) => r.data);

export const checkBookmark = (videoId: string) =>
  api.get(`/bookmarks/check/${videoId}`).then((r) => r.data.bookmarked);

export const getMyBookmarks = (params: Record<string, any> = {}) =>
  api.get('/bookmarks', { params }).then((r) => r.data);
