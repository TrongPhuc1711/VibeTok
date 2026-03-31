import { useState, useEffect, useCallback } from 'react';
import { getUserProfile, getUserVideos, followUser, unfollowUser } from '../services/userService';

export function useProfile(username) {
    const [profile, setProfile] = useState(null);
    const [videos, setVideos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [following, setFollowing] = useState(false);

    useEffect(() => {
        if (!username) return;
        setLoading(true);
        setError(null);
        Promise.all([getUserProfile(username), getUserVideos(username)])
            .then(([pRes, vRes]) => {
                const user = pRes.data.user;
                setProfile(user);
                setVideos(vRes.data.videos ?? []);
                // ✅ FIX: sync following state from API instead of always false
                setFollowing(user.isFollowing ?? false);
            })
            .catch(e => setError(e.message))
            .finally(() => setLoading(false));
    }, [username]);

    const toggleFollow = useCallback(async () => {
        if (!profile) return;
        // Optimistic update
        const wasFollowing = following;
        setFollowing(!wasFollowing);
        setProfile(p => ({
            ...p,
            followers: Math.max(0, (p.followers || 0) + (wasFollowing ? -1 : 1)),
        }));
        try {
            const fn = wasFollowing ? unfollowUser : followUser;
            const res = await fn(profile.username);
            // Sync real count from server if available
            if (res.data?.followers != null) {
                setProfile(p => ({ ...p, followers: res.data.followers }));
            }
        } catch (e) {
            // Rollback on error
            setFollowing(wasFollowing);
            setProfile(p => ({
                ...p,
                followers: Math.max(0, (p.followers || 0) + (wasFollowing ? 1 : -1)),
            }));
            setError(e.message);
        }
    }, [following, profile]);

    return { profile, videos, loading, error, following, toggleFollow, setProfile };
}