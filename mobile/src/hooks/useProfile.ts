/**
 * useProfile — hook load dữ liệu profile + videos của user.
 */

import { useState, useEffect, useCallback } from 'react';
import { getUserProfile, followUser, unfollowUser } from '../services/userService';
import { getUserVideosByUserId, getLikedVideosByUserId } from '../services/videoService';
import { useToast } from '../components/common/Toast';

export interface ProfileData {
  id: string;
  username: string;
  fullName: string;
  anh_dai_dien?: string;
  tieu_su?: string;
  initials: string;
  followersCount: number;
  followingCount: number;
  likesCount: number;
  videosCount: number;
  isFollowing: boolean;
}

export function useProfile(username: string) {
  const { showError } = useToast();

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [likedVideos, setLikedVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [likedLoading, setLikedLoading] = useState(false);
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    if (!username) return;

    let cancelled = false;
    const load = async () => {
      setLoading(true);
      try {
        const { data } = await getUserProfile(username);
        if (cancelled) return;

        const u = data.user;
        setProfile({
          id: String(u.id),
          username: u.username || u.ten_dang_nhap,
          fullName: u.fullName || u.ten_hien_thi || '',
          anh_dai_dien: u.anh_dai_dien,
          tieu_su: u.tieu_su || u.bio || '',
          initials: u.initials || 'U',
          followersCount: Number(u.followersCount ?? u.followers_count ?? 0),
          followingCount: Number(u.followingCount ?? u.following_count ?? 0),
          likesCount: Number(u.likesCount ?? u.likes_count ?? 0),
          videosCount: Number(u.videosCount ?? u.videos_count ?? 0),
          isFollowing: Boolean(u.isFollowing),
        });
        setFollowing(Boolean(u.isFollowing));

        // Load user's videos
        const videoRes = await getUserVideosByUserId(String(u.id));
        if (!cancelled) setVideos(videoRes.data.videos || []);
      } catch (err) {
        console.error('[useProfile]', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [username]);

  const refetch = useCallback(async () => {
    if (!username) return;
    try {
      const { data } = await getUserProfile(username);
      const u = data.user;
      setProfile({
        id: String(u.id),
        username: u.username || u.ten_dang_nhap,
        fullName: u.fullName || u.ten_hien_thi || '',
        anh_dai_dien: u.anh_dai_dien,
        tieu_su: u.tieu_su || u.bio || '',
        initials: u.initials || 'U',
        followersCount: Number(u.followersCount ?? u.followers_count ?? 0),
        followingCount: Number(u.followingCount ?? u.following_count ?? 0),
        likesCount: Number(u.likesCount ?? u.likes_count ?? 0),
        videosCount: Number(u.videosCount ?? u.videos_count ?? 0),
        isFollowing: Boolean(u.isFollowing),
      });
      const videoRes = await getUserVideosByUserId(String(u.id));
      setVideos(videoRes.data.videos || []);
    } catch (err) {
      console.error('[useProfile refetch]', err);
    }
  }, [username]);

  const toggleFollow = useCallback(async () => {
    if (!profile) return;
    try {
      if (following) {
        await unfollowUser(profile.username);
        setProfile((p) => p ? { ...p, followersCount: p.followersCount - 1 } : p);
      } else {
        await followUser(profile.username);
        setProfile((p) => p ? { ...p, followersCount: p.followersCount + 1 } : p);
      }
      setFollowing((f) => !f);
    } catch {
      showError('Lỗi', 'Không thể thực hiện. Vui lòng thử lại.');
    }
  }, [following, profile, showError]);

  const fetchLikedVideos = useCallback(async () => {
    if (!profile) return;
    setLikedLoading(true);
    try {
      const { data } = await getLikedVideosByUserId(profile.id);
      setLikedVideos(data.videos || []);
    } catch (err) {
      console.error('[useProfile] liked error:', err);
    } finally {
      setLikedLoading(false);
    }
  }, [profile]);

  return {
    profile,
    videos,
    likedVideos,
    loading,
    likedLoading,
    following,
    toggleFollow,
    setProfile,
    fetchLikedVideos,
    refetch,
  };
}
