import { useState, useEffect, useCallback } from 'react';
import { getUserProfile, followUser, unfollowUser } from '../services/userService';
import { getUserVideosByUserId, getLikedVideosByUserId, getRepostedVideosByUserId } from '../services/videoService';

export function useProfile(username) {
    const [profile, setProfile] = useState(null);
    const [videos, setVideos] = useState([]);
    const [likedVideos, setLikedVideos] = useState([]);
    const [likedLoading, setLikedLoading] = useState(false);
    const [repostedVideos, setRepostedVideos] = useState([]);
    const [repostedLoading, setRepostedLoading] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [following, setFollowing] = useState(false);

    useEffect(() => {
        if (!username) return;
        setLoading(true);
        setError(null);
        setProfile(null);
        setVideos([]);
        setLikedVideos([]);
        setRepostedVideos([]);

        getUserProfile(username)
            .then(async (pRes) => {
                const user = pRes.data.user;
                setProfile(user);
                setFollowing(user.isFollowing ?? false);

                try {
                    const vRes = await getUserVideosByUserId(user.id);
                    setVideos(vRes.data.videos ?? []);
                } catch {
                    setVideos([]);
                }
            })
            .catch(e => setError(e.message ?? 'Không tìm thấy người dùng'))
            .finally(() => setLoading(false));
    }, [username]);

    // Fetch liked videos separately (lazy, called when tab is activated)
    const fetchLikedVideos = useCallback(async () => {
        if (!profile?.id || likedLoading) return;
        setLikedLoading(true);
        try {
            const res = await getLikedVideosByUserId(profile.id, { limit: 30 });
            setLikedVideos(res.data.videos ?? []);
        } catch {
            setLikedVideos([]);
        } finally {
            setLikedLoading(false);
        }
    }, [profile?.id, likedLoading]);

    // Fetch reposted videos separately (lazy)
    const fetchRepostedVideos = useCallback(async () => {
        if (!profile?.id || repostedLoading) return;
        setRepostedLoading(true);
        try {
            const res = await getRepostedVideosByUserId(profile.id, { limit: 30 });
            setRepostedVideos(res.data.videos ?? []);
        } catch {
            setRepostedVideos([]);
        } finally {
            setRepostedLoading(false);
        }
    }, [profile?.id, repostedLoading]);

    const toggleFollow = useCallback(async () => {
        if (!profile) return;
        const wasFollowing = following;
        setFollowing(!wasFollowing);
        setProfile(p => ({
            ...p,
            followers: Math.max(0, (p.followers || 0) + (wasFollowing ? -1 : 1)),
        }));
        try {
            const fn = wasFollowing ? unfollowUser : followUser;
            const res = await fn(profile.username);
            if (res.data?.followers != null) {
                setProfile(p => ({ ...p, followers: res.data.followers }));
            }
        } catch (e) {
            // Rollback
            setFollowing(wasFollowing);
            setProfile(p => ({
                ...p,
                followers: Math.max(0, (p.followers || 0) + (wasFollowing ? 1 : -1)),
            }));
            setError(e.message);
        }
    }, [following, profile]);

    return { profile, videos, likedVideos, likedLoading, fetchLikedVideos, repostedVideos, repostedLoading, fetchRepostedVideos, loading, error, following, toggleFollow, setProfile };
}