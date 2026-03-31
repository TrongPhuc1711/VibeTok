import { useState, useEffect, useCallback } from 'react';
import { getUserProfile, followUser, unfollowUser } from '../services/userService';
import { getUserVideosByUserId } from '../services/videoService';

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
        setProfile(null);
        setVideos([]);

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

    return { profile, videos, loading, error, following, toggleFollow, setProfile };
}