import { useState, useEffect, useCallback, useRef } from 'react';
import { getFeed, getVideoById } from '../services/videoService';

export function useVideoFeed(type = 'forYou', { startVideoId = null } = {}) {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);
    const fetchingRef = useRef(false); // prevent duplicate fetches
    const startVideoHandled = useRef(false);

    const fetchVideos = useCallback(async (p = 1, reset = false) => {
        // Prevent concurrent fetches
        if (fetchingRef.current && !reset) return;
        fetchingRef.current = true;

        try {
            if (p === 1) setLoading(true);
            else setLoadingMore(true);

            const res = await getFeed({ type, page: p });
            if (!mountedRef.current) return;

            const incoming = res.data.videos || [];

            setVideos(prev => {
                if (reset || p === 1) return incoming;
                // Deduplicate by id
                const existingIds = new Set(prev.map(v => v.id));
                const newOnes = incoming.filter(v => !existingIds.has(v.id));
                return [...prev, ...newOnes];
            });

            setHasMore(res.data.hasMore ?? (incoming.length > 0));
            setPage(p);
            setError(null);
        } catch (e) {
            if (!mountedRef.current) return;
            console.error('[useVideoFeed] fetch error:', e);
            setError(e.response?.data?.message || e.message || 'Lỗi khi tải video');
            // Don't clear videos on error if we already have some
        } finally {
            if (mountedRef.current) {
                if (p === 1) setLoading(false);
                else setLoadingMore(false);
            }
            fetchingRef.current = false;
        }
    }, [type]);

    // Fetch with startVideoId: fetch the pinned video first, then load feed
    const fetchWithStartVideo = useCallback(async (videoId) => {
        fetchingRef.current = true;
        setLoading(true);

        try {
            // Fetch both the pinned video and the first page of feed in parallel
            const [pinnedRes, feedRes] = await Promise.allSettled([
                getVideoById(videoId),
                getFeed({ type, page: 1 }),
            ]);

            if (!mountedRef.current) return;

            let pinnedVideo = null;
            if (pinnedRes.status === 'fulfilled') {
                pinnedVideo = pinnedRes.value.data.video;
            }

            const feedVideos = feedRes.status === 'fulfilled'
                ? (feedRes.value.data.videos || [])
                : [];

            // Build final list: pinned video first, then feed (without duplicate)
            const finalVideos = [];
            if (pinnedVideo) {
                finalVideos.push(pinnedVideo);
            }
            const pinnedId = pinnedVideo?.id;
            feedVideos.forEach(v => {
                if (v.id !== pinnedId) {
                    finalVideos.push(v);
                }
            });

            setVideos(finalVideos);
            setHasMore(feedRes.status === 'fulfilled'
                ? (feedRes.value.data.hasMore ?? (feedVideos.length > 0))
                : true
            );
            setPage(1);
            setError(null);
        } catch (e) {
            if (!mountedRef.current) return;
            console.error('[useVideoFeed] fetch with start video error:', e);
            setError(e.response?.data?.message || e.message || 'Lỗi khi tải video');
        } finally {
            if (mountedRef.current) {
                setLoading(false);
            }
            fetchingRef.current = false;
        }
    }, [type]);

    // Reset and refetch when type changes
    useEffect(() => {
        mountedRef.current = true;
        fetchingRef.current = false;
        startVideoHandled.current = false;
        setVideos([]);
        setPage(1);
        setHasMore(true);
        setError(null);

        if (startVideoId && !startVideoHandled.current) {
            startVideoHandled.current = true;
            fetchWithStartVideo(startVideoId);
        } else {
            fetchVideos(1, true);
        }

        return () => { mountedRef.current = false; };
    }, [fetchVideos, fetchWithStartVideo, startVideoId]);

    const loadMore = useCallback(() => {
        if (!loadingMore && !loading && hasMore && !fetchingRef.current) {
            fetchVideos(page + 1);
        }
    }, [loadingMore, loading, hasMore, page, fetchVideos]);

    const refresh = useCallback(() => {
        fetchingRef.current = false;
        fetchVideos(1, true);
    }, [fetchVideos]);

    // Remove a video from the feed (e.g., after deletion)
    const removeVideo = useCallback((videoId) => {
        setVideos(prev => prev.filter(v => v.id !== videoId));
    }, []);

    // Update a video in the feed (e.g., after like)
    const updateVideo = useCallback((videoId, updates) => {
        setVideos(prev => prev.map(v => v.id === videoId ? { ...v, ...updates } : v));
    }, []);

    return {
        videos,
        loading,
        loadingMore,
        hasMore,
        error,
        loadMore,
        refresh,
        removeVideo,
        updateVideo,
    };
}