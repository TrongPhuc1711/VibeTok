import React, { useState, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Share,
  Dimensions,
  StyleSheet,
  RefreshControl,
  Platform,
  type ViewToken,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Film } from 'lucide-react-native';

import VideoFeedItem from '../components/VideoFeedItem';
import CommentSheet from '../components/CommentSheet';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useVideoFeed, type VideoItem } from '../hooks/useVideoFeed';
import { likeVideo, unlikeVideo, shareVideo } from '../services/videoService';
import { toggleBookmark } from '../services/bookmarkService';
import { Colors } from '../theme/colors';
import { FEED_TABS } from '../constants';
import type { RootStackParamList } from '../navigation/types';

const { height: SCREEN_H } = Dimensions.get('window');
const TAB_BAR_H = 60;
const VIDEO_H = SCREEN_H - TAB_BAR_H;

type Nav = NativeStackNavigationProp<RootStackParamList>;

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();

  const [feedType, setFeedType] = useState<'forYou' | 'following'>('forYou');
  const [activeIndex, setActiveIndex] = useState(0);
  const [commentVideoId, setCommentVideoId] = useState<string | null>(null);

  const { videos, loading, refreshing, hasMore, loadMore, refresh, updateVideo } =
    useVideoFeed(feedType);

  // Track visible video for auto-play
  const viewabilityConfig = useRef({ viewAreaCoveragePercentThreshold: 60 });
  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        setActiveIndex(viewableItems[0].index);
      }
    },
  );

  // ── Like ──
  const handleLike = useCallback(
    async (video: VideoItem) => {
      const wasLiked = video.isLiked;
      // Optimistic update
      updateVideo(video.id, {
        isLiked: !wasLiked,
        likes: wasLiked ? video.likes - 1 : video.likes + 1,
      });
      try {
        if (wasLiked) {
          await unlikeVideo(video.id);
        } else {
          await likeVideo(video.id);
        }
      } catch {
        // Rollback
        updateVideo(video.id, { isLiked: wasLiked, likes: video.likes });
      }
    },
    [updateVideo],
  );

  // ── Bookmark ──
  const handleBookmark = useCallback(
    async (video: VideoItem) => {
      const wasBookmarked = video.isBookmarked ?? false;
      updateVideo(video.id, { isBookmarked: !wasBookmarked });
      try {
        await toggleBookmark(video.id);
      } catch {
        updateVideo(video.id, { isBookmarked: wasBookmarked });
      }
    },
    [updateVideo],
  );

  // ── Share ──
  const handleShare = useCallback(async (video: VideoItem) => {
    try {
      await shareVideo(video.id);
      await Share.share({
        message: `${video.caption || 'Xem video hay trên VibeTok!'}\nhttps://vibe-tok.vercel.app/video/${video.id}`,
      });
    } catch {
      // User cancelled share
    }
  }, []);

  // ── Avatar press → Profile ──
  const handleAvatarPress = useCallback(
    (video: VideoItem) => {
      navigation.navigate('UserProfile', { username: video.user.username });
    },
    [navigation],
  );

  // Render video item
  const renderItem = useCallback(
    ({ item, index }: { item: VideoItem; index: number }) => (
      <VideoFeedItem
        video={item}
        isActive={index === activeIndex}
        isLiked={item.isLiked}
        isBookmarked={item.isBookmarked ?? false}
        onLike={() => handleLike(item)}
        onComment={() => setCommentVideoId(item.id)}
        onBookmark={() => handleBookmark(item)}
        onShare={() => handleShare(item)}
        onAvatarPress={() => handleAvatarPress(item)}
      />
    ),
    [activeIndex, handleLike, handleBookmark, handleShare, handleAvatarPress],
  );

  const activeVideo = videos[activeIndex];

  return (
    <View style={styles.container}>
      {/* ── Feed type tabs (overlay trên video) ── */}
      <View style={[styles.tabContainer, { top: insets.top + 8 }]}>
        <TouchableOpacity
          onPress={() => setFeedType('following')}
          style={styles.tabButton}
        >
          <Text
            style={[
              styles.tabText,
              feedType === 'following' && styles.tabTextActive,
            ]}
          >
            Đang theo dõi
          </Text>
          {feedType === 'following' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>

        <View style={styles.tabDivider} />

        <TouchableOpacity
          onPress={() => setFeedType('forYou')}
          style={styles.tabButton}
        >
          <Text
            style={[
              styles.tabText,
              feedType === 'forYou' && styles.tabTextActive,
            ]}
          >
            Dành cho bạn
          </Text>
          {feedType === 'forYou' && <View style={styles.tabIndicator} />}
        </TouchableOpacity>
      </View>

      {/* ── Video feed ── */}
      {loading && videos.length === 0 ? (
        <LoadingSpinner fullScreen />
      ) : (
        <FlatList
          data={videos}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          pagingEnabled
          snapToInterval={VIDEO_H}
          snapToAlignment="start"
          decelerationRate="fast"
          showsVerticalScrollIndicator={false}
          getItemLayout={(_, index) => ({
            length: VIDEO_H,
            offset: VIDEO_H * index,
            index,
          })}
          onViewableItemsChanged={onViewableItemsChanged.current}
          viewabilityConfig={viewabilityConfig.current}
          onEndReached={loadMore}
          onEndReachedThreshold={0.5}
          windowSize={3}
          maxToRenderPerBatch={2}
          initialNumToRender={2}
          removeClippedSubviews={Platform.OS === 'android'}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={Colors.primary}
            />
          }
          ListEmptyComponent={
            <View style={[styles.emptyContainer, { height: VIDEO_H }]}>
              <Film size={56} color={Colors.textDim} strokeWidth={1.2} />
              <Text style={styles.emptyText}>
                {feedType === 'following'
                  ? 'Những người bạn follow chưa đăng video nào'
                  : 'Không có video nào. Hãy theo dõi thêm creator!'}
              </Text>
            </View>
          }
        />
      )}

      {/* ── Comment sheet ── */}
      {commentVideoId && activeVideo && (
        <CommentSheet
          visible={!!commentVideoId}
          videoId={commentVideoId}
          totalComments={activeVideo.comments}
          onClose={() => setCommentVideoId(null)}
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
  tabContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 100,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 20,
  },
  tabButton: {
    alignItems: 'center',
    paddingVertical: 6,
  },
  tabText: {
    color: 'rgba(255,255,255,0.6)',
    fontSize: 16,
    fontWeight: '600',
  },
  tabTextActive: {
    color: Colors.white,
    fontWeight: '700',
  },
  tabIndicator: {
    width: 28,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: Colors.white,
    marginTop: 4,
  },
  tabDivider: {
    width: 1,
    height: 14,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.5,
  },
  emptyText: {
    color: Colors.textDim,
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
  },
});
