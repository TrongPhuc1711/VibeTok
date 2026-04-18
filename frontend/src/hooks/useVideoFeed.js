import { useState, useEffect, useCallback, useRef } from 'react';
import { getFeed } from '../services/videoService';

export function useVideoFeed(type = 'forYou') {
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [page, setPage] = useState(1);
    const [hasMore, setHasMore] = useState(true);
    const [error, setError] = useState(null);
    const mountedRef = useRef(true);
    const fetchingRef = useRef(false); // prevent duplicate fetches

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

    // Reset and refetch when type changes
    useEffect(() => {
        mountedRef.current = true;
        fetchingRef.current = false;
        setVideos([]);
        setPage(1);
        setHasMore(true);
        setError(null);
        fetchVideos(1, true);

        return () => { mountedRef.current = false; };
    }, [fetchVideos]); // fetchVideos recreated when type changes

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