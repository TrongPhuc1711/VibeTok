/**
 * Explore service — search, trending hashtags, categories.
 */

import api from '../api/api';

export const getCategories = async () => {
  try {
    const res = await api.get('/categories');
    return { data: res.data };
  } catch {
    return { data: { categories: [{ id: '1', label: 'Tất cả', value: 'all' }] } };
  }
};

export const getTrendingHashtags = async ({ limit = 7 } = {}) => {
  try {
    const res = await api.get('/hashtags/trending', { params: { limit } });
    return { data: res.data };
  } catch {
    return { data: { hashtags: [] } };
  }
};

export const getFeaturedCreators = async ({ limit = 5 } = {}) => {
  try {
    const res = await api.get('/users/suggestions', { params: { limit: limit * 3 } });
    const all = res.data.users || [];
    const creators = all.filter((u: any) => u.isCreator);
    const others = all.filter((u: any) => !u.isCreator);
    const merged = [...creators, ...others].slice(0, limit);
    return { data: { creators: merged } };
  } catch {
    return { data: { creators: [] } };
  }
};

export const globalSearch = async ({ q = '', limit = 20 } = {}) => {
  try {
    const [videosRes, usersRes, hashtagsRes] = await Promise.allSettled([
      api.get('/videos/search', { params: { q, limit } }),
      api.get('/users/search', { params: { q, limit: 10 } }),
      api.get('/hashtags/search', { params: { q, limit: 10 } }),
    ]);

    const videos = videosRes.status === 'fulfilled' ? (videosRes.value.data.videos || []) : [];
    const users = usersRes.status === 'fulfilled' ? (usersRes.value.data.users || []) : [];
    const hashtags = hashtagsRes.status === 'fulfilled' ? (hashtagsRes.value.data.hashtags || []) : [];

    return { data: { videos, users, hashtags, query: q } };
  } catch {
    return { data: { videos: [], users: [], hashtags: [], query: q } };
  }
};

export const getHashtagInfo = async (tagName: string) => {
  const res = await api.get(`/hashtags/${encodeURIComponent(tagName)}`);
  return { data: res.data };
};

export const getVideosByHashtag = async (
  tagName: string,
  { page = 1, limit = 12 } = {},
) => {
  const res = await api.get(`/hashtags/${encodeURIComponent(tagName)}/videos`, {
    params: { page, limit },
  });
  return { data: res.data };
};
