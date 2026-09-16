/**
 * VideoDetailScreen — Xem chi tiết 1 video toàn màn hình.
 * Mở khi nhấn vào bất kỳ video thumbnail nào từ Profile hoặc Explore.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Share,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft } from 'lucide-react-native';

import VideoFeedItem from '../components/VideoFeedItem';
import CommentSheet from '../components/CommentSheet';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  getVideoById,
  likeVideo,
  unlikeVideo,
  shareVideo,
} from '../services/videoService';
import { toggleBookmark } from '../services/bookmarkService';
import { Colors } from '../theme/colors';
import type { VideoItem } from '../hooks/useVideoFeed';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'VideoDetail'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'VideoDetail'>;

const { height: SCREEN_H } = Dimensions.get('window');

export default function VideoDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();
  const { videoId } = route.params;

  const [video, setVideo] = useState<VideoItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [commentOpen, setCommentOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await getVideoById(videoId);
        if (!cancelled) {
          const v = data.video;
          if (v) {
            setVideo(v);
          } else {
            setError('Không tìm thấy video');
          }
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err.response?.data?.message || 'Không thể tải video');
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [videoId]);

  // ── Like ──
  const handleLike = useCallback(async () => {
    if (!video) return;
    const wasLiked = video.isLiked;
    setVideo((v) =>
      v
        ? {
            ...v,
            isLiked: !wasLiked,
            likes: wasLiked ? v.likes - 1 : v.likes + 1,
          }
        : v,
    );

    try {
      if (wasLiked) {
        await unlikeVideo(video.id);
      } else {
        await likeVideo(video.id);
      }
    } catch {
      // Rollback
      setVideo((v) =>
        v
          ? {
              ...v,
              isLiked: wasLiked,
              likes: wasLiked ? v.likes : Math.max(0, v.likes - 1),
            }
          : v,
      );
    }
  }, [video]);

  // ── Bookmark ──
  const handleBookmark = useCallback(async () => {
    if (!video) return;
    const wasBookmarked = video.isBookmarked ?? false;
    setVideo((v) =>
      v ? { ...v, isBookmarked: !wasBookmarked } : v,
    );

    try {
      await toggleBookmark(video.id);
    } catch {
      setVideo((v) =>
        v ? { ...v, isBookmarked: wasBookmarked } : v,
      );
    }
  }, [video]);

  // ── Share ──
  const handleShare = useCallback(async () => {
    if (!video) return;
    try {
      await shareVideo(video.id);
      await Share.share({
        message: `${video.caption || 'Xem video hay trên VibeTok!'}\nhttps://vibe-tok.vercel.app/video/${video.id}`,
      });
    } catch {
      // User cancelled
    }
  }, [video]);

  // ── Avatar press → Profile ──
  const handleAvatarPress = useCallback(() => {
    if (!video?.user?.username) return;
    navigation.navigate('UserProfile', { username: video.user.username });
  }, [video, navigation]);

  if (loading) {
    return (
      <View style={[styles.container, styles.center]}>
        <LoadingSpinner />
      </View>
    );
  }

  if (error || !video) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <TouchableOpacity
          style={[styles.backButton, { top: insets.top + 10 }]}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.errorText}>{error || 'Không tìm thấy video'}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Video item */}
      <VideoFeedItem
        video={video}
        isActive={true}
        isLiked={video.isLiked}
        isBookmarked={video.isBookmarked ?? false}
        onLike={handleLike}
        onComment={() => setCommentOpen(true)}
        onBookmark={handleBookmark}
        onShare={handleShare}
        onAvatarPress={handleAvatarPress}
      />

      {/* Floating back button */}
      <TouchableOpacity
        style={[styles.backButton, { top: insets.top + 12 }]}
        onPress={() => navigation.goBack()}
        activeOpacity={0.7}
      >
        <ArrowLeft size={22} color={Colors.white} />
      </TouchableOpacity>

      {/* Comment Sheet */}
      {commentOpen && (
        <CommentSheet
          visible={commentOpen}
          videoId={video.id}
          totalComments={video.comments}
          onClose={() => setCommentOpen(false)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  backButton: {
    position: 'absolute',
    left: 16,
    zIndex: 999,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorText: {
    color: Colors.textDim,
    fontSize: 15,
  },
});
