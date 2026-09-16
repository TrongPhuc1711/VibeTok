import { useState, useEffect, useCallback, useRef } from 'react';
import { getFeed } from '../services/videoService';
import { FEED_PAGE_SIZE } from '../constants';

export interface VideoItem {
  id: string;
  userId: string;
  caption: string;
  videoUrl: string;
  thumbnail?: string;
  duration: number;
  views: number;
  likes: number;
  comments: number;
  shares: number;
  bookmarks?: number;
  privacy: string;
  createdAt: string;
  isLiked: boolean;
  isFollowing: boolean;
  isBookmarked?: boolean;
  isReposted?: boolean;
  repostedByFriend?: {
    id: string;
    username: string;
    fullName?: string;
  } | null;
  user: {
    id: string;
    username: string;
    fullName: string;
    anh_dai_dien?: string;
    initials: string;
    isFollowing?: boolean;
  };
  music?: {
    id: string;
    title: string;
    artist: string;
    audioUrl?: string;
    cover?: string;
  } | null;
}

interface UseFeedReturn {
  videos: VideoItem[];
  loading: boolean;
  refreshing: boolean;
  hasMore: boolean;
  loadMore: () => void;
  refresh: () => void;
  updateVideo: (id: string, updates: Partial<VideoItem>) => void;
}

export function useVideoFeed(
  feedType: 'forYou' | 'following' = 'forYou',
): UseFeedReturn {
  const [videos, setVideos] = useState<VideoItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const pageRef = useRef(1);
  const loadingRef = useRef(false);

  const fetchPage = useCallback(
    async (page: number, isRefresh = false) => {
      if (loadingRef.current) return;
      loadingRef.current = true;

      try {
        const { data } = await getFeed({
          type: feedType,
          page,
          limit: FEED_PAGE_SIZE,
        });

        const newVideos: VideoItem[] = data.videos || [];

        if (isRefresh) {
          setVideos(newVideos);
        } else {
          setVideos((prev) => {
            // Loại bỏ trùng lặp
            const existingIds = new Set(prev.map((v) => v.id));
            const unique = newVideos.filter((v) => !existingIds.has(v.id));
            return [...prev, ...unique];
          });
        }

        setHasMore(newVideos.length >= FEED_PAGE_SIZE);
        pageRef.current = page;
      } catch (err) {
        console.error('[useVideoFeed] fetch error:', err);
      } finally {
        setLoading(false);
        setRefreshing(false);
        loadingRef.current = false;
      }
    },
    [feedType],
  );

  // Initial load & reset khi đổi feed type
  useEffect(() => {
    setVideos([]);
    setLoading(true);
    setHasMore(true);
    pageRef.current = 1;
    fetchPage(1, true);
  }, [fetchPage]);

  const loadMore = useCallback(() => {
    if (!hasMore || loadingRef.current) return;
    fetchPage(pageRef.current + 1);
  }, [hasMore, fetchPage]);

  const refresh = useCallback(() => {
    setRefreshing(true);
    pageRef.current = 1;
    fetchPage(1, true);
  }, [fetchPage]);

  const updateVideo = useCallback((id: string, updates: Partial<VideoItem>) => {
    setVideos((prev) =>
      prev.map((v) => (v.id === id ? { ...v, ...updates } : v)),
    );
  }, []);

  return { videos, loading, refreshing, hasMore, loadMore, refresh, updateVideo };
}
