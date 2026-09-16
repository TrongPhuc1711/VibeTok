/**
 * Video service — tương đương frontend/src/services/videoService.js
 */

import api from '../api/api';
import { FEED_PAGE_SIZE } from '../constants';

// ── Feed ──
export const getFeed = async ({
  type = 'forYou',
  page = 1,
  limit = FEED_PAGE_SIZE,
} = {}) => {
  const res = await api.get('/videos/feed', { params: { type, page, limit } });
  return { data: res.data };
};

// ── Single video ──
export const getVideoById = async (id: string) => {
  const res = await api.get(`/videos/${id}`);
  return { data: res.data };
};

// ── Comments ──
export const getComments = async (
  videoId: string,
  { page = 1, limit = 20 } = {},
) => {
  const res = await api.get(`/videos/${videoId}/comments`, {
    params: { page, limit },
  });
  return { data: res.data };
};

export const postComment = async (
  videoId: string,
  { content, parentId = null }: { content: string; parentId?: string | null },
) => {
  const res = await api.post(`/videos/${videoId}/comments`, {
    content,
    parentId,
  });
  return { data: res.data };
};

export const getReplies = async (
  videoId: string,
  commentId: string,
  { page = 1, limit = 10 } = {},
) => {
  const res = await api.get(
    `/videos/${videoId}/comments/${commentId}/replies`,
    { params: { page, limit } },
  );
  return { data: res.data };
};

// ── Comment likes ──
export const likeComment = async (videoId: string, commentId: string) => {
  const res = await api.post(`/videos/${videoId}/comments/${commentId}/like`);
  return { data: res.data };
};

export const unlikeComment = async (videoId: string, commentId: string) => {
  const res = await api.delete(`/videos/${videoId}/comments/${commentId}/like`);
  return { data: res.data };
};

// ── Video likes ──
export const likeVideo = async (videoId: string) => {
  const res = await api.post(`/videos/${videoId}/like`);
  return { data: res.data };
};

export const unlikeVideo = async (videoId: string) => {
  const res = await api.delete(`/videos/${videoId}/like`);
  return { data: res.data };
};

// ── View ──
export const viewVideo = async (videoId: string) => {
  const res = await api.post(`/videos/${videoId}/view`);
  return { data: res.data };
};

// ── Share ──
export const shareVideo = async (videoId: string) => {
  const res = await api.post(`/videos/${videoId}/share`);
  return { data: res.data };
};

// ── Search ──
export const searchVideos = async ({
  q = '',
  page = 1,
  limit = 10,
} = {}) => {
  const res = await api.get('/videos/search', { params: { q, page, limit } });
  return { data: res.data };
};

// ── User videos ──
export const getUserVideosByUserId = async (
  userId: string,
  { page = 1, limit = 12 } = {},
) => {
  const res = await api.get(`/videos/user/${userId}`, {
    params: { page, limit },
  });
  return { data: res.data };
};

export const getLikedVideosByUserId = async (
  userId: string,
  { page = 1, limit = 30 } = {},
) => {
  const res = await api.get(`/videos/user/${userId}/liked`, {
    params: { page, limit },
  });
  return { data: res.data };
};

// ── Upload ──
export const uploadVideo = async (formData: FormData, onProgress?: (pct: number) => void) => {
  const res = await api.post('/videos/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
    onUploadProgress: onProgress
      ? (e: any) => onProgress(Math.round((e.loaded * 100) / (e.total || 1)))
      : undefined,
  });
  return { data: res.data };
};

// ── Delete ──
export const deleteVideo = async (videoId: string) => {
  const res = await api.delete(`/videos/${videoId}`);
  return { data: res.data };
};

// ── Repost ──
export const repostVideo = async (videoId: string) => {
  const res = await api.post(`/videos/${videoId}/repost`);
  return { data: res.data };
};

export const getRepostedVideosByUserId = async (
  userId: string,
  { page = 1, limit = 30 } = {},
) => {
  const res = await api.get(`/videos/user/${userId}/reposts`, {
    params: { page, limit },
  });
  return { data: res.data };
};

// ── Report ──
export const reportVideo = async (
  videoId: string,
  { reason, description }: { reason: string; description: string },
) => {
  const res = await api.post(`/videos/${videoId}/report`, {
    reason,
    description,
  });
  return { data: res.data };
};
