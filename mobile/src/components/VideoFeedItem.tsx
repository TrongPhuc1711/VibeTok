import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableWithoutFeedback,
  TouchableOpacity,
  Dimensions,
  StyleSheet,
  Animated,
  FlatList,
  type NativeSyntheticEvent,
  type NativeScrollEvent,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Heart, Music, Repeat2, Images } from 'lucide-react-native';

import VideoActions from './VideoActions';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Colors } from '../theme/colors';
import { parseHashtags, stripHashtags } from '../utils/formatters';
import type { VideoItem } from '../hooks/useVideoFeed';
import type { RootStackParamList } from '../navigation/types';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
const TAB_BAR_H = 60;
const VIDEO_H = SCREEN_H - TAB_BAR_H;

interface VideoFeedItemProps {
  video: VideoItem;
  isActive: boolean;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onComment: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onAvatarPress: () => void;
  onFollow?: () => void;
}

export default function VideoFeedItem({
  video,
  isActive,
  isLiked,
  isBookmarked,
  onLike,
  onComment,
  onBookmark,
  onShare,
  onAvatarPress,
  onFollow,
}: VideoFeedItemProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const [paused, setPaused] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);
  const [slideIndex, setSlideIndex] = useState(0);

  // Check if videoUrl is actually an image or slideshow JSON
  const rawUrl = React.useMemo(() => {
    if (typeof video.videoUrl !== 'string') return '';
    try {
      return decodeURIComponent(video.videoUrl).trim();
    } catch {
      return video.videoUrl.trim();
    }
  }, [video.videoUrl]);

  const isSlideshowOrImage =
    rawUrl.startsWith('[') ||
    rawUrl.includes('/slideshows/') ||
    /\.(png|jpe?g|webp|gif)($|\?)/i.test(rawUrl);

  const imageUrls: string[] = React.useMemo(() => {
    if (!isSlideshowOrImage) return [];
    if (rawUrl.startsWith('[')) {
      try {
        const parsed = JSON.parse(rawUrl);
        return Array.isArray(parsed) ? parsed : [rawUrl];
      } catch {
        return [rawUrl];
      }
    }
    return [rawUrl || video.thumbnail || ''];
  }, [rawUrl, isSlideshowOrImage, video.thumbnail]);

  const videoSource = !isSlideshowOrImage && video.videoUrl ? video.videoUrl : null;

  const player = useVideoPlayer(videoSource, (p) => {
    p.loop = true;
    p.muted = false;
    if (isActive && !paused && videoSource) {
      p.play();
    }
  });

  // Double-tap like
  const lastTapRef = useRef(0);
  const heartScale = useRef(new Animated.Value(0)).current;
  const heartOpacity = useRef(new Animated.Value(0)).current;

  // Auto play/pause theo visibility
  useEffect(() => {
    if (!videoSource) return;
    if (isActive && !paused) {
      player.play();
    } else {
      player.pause();
    }
  }, [isActive, paused, player, videoSource]);

  // Single tap → toggle play/pause, Double tap → like
  const handlePress = useCallback(() => {
    const now = Date.now();
    const DOUBLE_TAP_DELAY = 300;

    if (now - lastTapRef.current < DOUBLE_TAP_DELAY) {
      // Double tap → like
      if (!isLiked) onLike();
      // Heart animation
      heartScale.setValue(0);
      heartOpacity.setValue(1);
      Animated.sequence([
        Animated.spring(heartScale, {
          toValue: 1,
          useNativeDriver: true,
          tension: 100,
          friction: 5,
        }),
        Animated.timing(heartOpacity, {
          toValue: 0,
          duration: 600,
          delay: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Single tap → toggle play/pause
      setPaused((p) => !p);
      setShowPauseIcon(true);
      setTimeout(() => setShowPauseIcon(false), 800);
    }

    lastTapRef.current = now;
  }, [isLiked, onLike, heartScale, heartOpacity]);

  // Handle slideshow swipe
  const handleSlideScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const offsetX = e.nativeEvent.contentOffset.x;
    const index = Math.round(offsetX / SCREEN_W);
    setSlideIndex(index);
  };

  const hashtags = parseHashtags(video.caption || '');
  const captionText = stripHashtags(video.caption || '');
  const repostedBy = (video as any)?.repostedByFriend;

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handlePress}>
        <View style={styles.videoWrapper}>
          {/* ── Visual Media ── */}
          {isSlideshowOrImage && imageUrls.length > 0 ? (
            <View style={styles.slideshowContainer}>
              <FlatList
                data={imageUrls}
                keyExtractor={(uri, i) => uri + i}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onMomentumScrollEnd={handleSlideScroll}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={styles.slideImage}
                    resizeMode="cover"
                  />
                )}
              />

              {/* Slideshow pill counter */}
              {imageUrls.length > 1 && (
                <View style={styles.slideshowBadge}>
                  <Images size={12} color={Colors.white} />
                  <Text style={styles.slideshowBadgeText}>
                    {slideIndex + 1}/{imageUrls.length}
                  </Text>
                </View>
              )}
            </View>
          ) : (
            <VideoView
              player={player}
              style={styles.video}
              contentFit="cover"
              nativeControls={false}
            />
          )}

          {/* Pause icon overlay */}
          {showPauseIcon && paused && (
            <View style={styles.pauseOverlay}>
              <Play size={64} color="rgba(255,255,255,0.85)" fill="rgba(255,255,255,0.85)" />
            </View>
          )}

          {/* Double-tap heart animation */}
          <Animated.View
            style={[
              styles.heartOverlay,
              {
                transform: [{ scale: heartScale }],
                opacity: heartOpacity,
              },
            ]}
            pointerEvents="none"
          >
            <Heart size={100} color={Colors.primary} fill={Colors.primary} />
          </Animated.View>

          {/* ── Bottom Gradient & Video Info (giống Web VideoCardInfo) ── */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.3)', 'rgba(0,0,0,0.85)']}
            style={styles.gradient}
          >
            <View style={styles.infoContainer}>
              {/* Repost banner */}
              {repostedBy && (
                <View style={styles.repostRow}>
                  <Repeat2 size={13} color="rgba(255,255,255,0.8)" />
                  <Text style={styles.repostText}>
                    {repostedBy.fullName || repostedBy.username} đã đăng lại
                  </Text>
                </View>
              )}

              {/* Author name */}
              <TouchableOpacity
                onPress={onAvatarPress}
                activeOpacity={0.8}
                style={styles.authorRow}
              >
                <Text style={styles.displayName} numberOfLines={1}>
                  {video.user?.fullName || video.user?.username || 'Người dùng'}
                </Text>
                {video.user?.fullName && (
                  <Text style={styles.username}>@{video.user.username}</Text>
                )}
              </TouchableOpacity>

              {/* Caption + Hashtags */}
              <Text style={styles.caption} numberOfLines={3}>
                {captionText}
                {hashtags.map((h, i) => (
                  <Text
                    key={i}
                    style={styles.hashtagsText}
                    onPress={() => {
                      navigation.navigate('Hashtag', {
                        tag: h.replace(/^#/, ''),
                      });
                    }}
                  >
                    {' '}{h}
                  </Text>
                ))}
              </Text>

              {/* Music Banner */}
              {video.music && (
                <View style={styles.musicRow}>
                  <Music size={13} color={Colors.white} />
                  <Text style={styles.musicText} numberOfLines={1}>
                    {video.music.title} – {video.music.artist}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* ── Right Action Buttons ── */}
          <View style={styles.actionsContainer}>
            <VideoActions
              video={video}
              isLiked={isLiked}
              isBookmarked={isBookmarked}
              isFollowing={video.isFollowing ?? video.user?.isFollowing}
              isPlaying={isActive && !paused}
              onLike={onLike}
              onComment={onComment}
              onBookmark={onBookmark}
              onShare={onShare}
              onAvatarPress={onAvatarPress}
              onFollow={onFollow}
            />
          </View>
        </View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: SCREEN_W,
    height: VIDEO_H,
    backgroundColor: Colors.black,
  },
  videoWrapper: {
    flex: 1,
    position: 'relative',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  slideshowContainer: {
    width: '100%',
    height: '100%',
    position: 'relative',
  },
  slideImage: {
    width: SCREEN_W,
    height: '100%',
  },
  slideshowBadge: {
    position: 'absolute',
    top: 60,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 14,
  },
  slideshowBadgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  heartOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 20,
    paddingHorizontal: 16,
    paddingTop: 80,
  },
  infoContainer: {
    maxWidth: SCREEN_W * 0.76,
    gap: 6,
  },
  repostRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginBottom: 2,
  },
  repostText: {
    color: 'rgba(255, 255, 255, 0.85)',
    fontSize: 12,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 6,
    flexWrap: 'wrap',
  },
  displayName: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  username: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '500',
  },
  caption: {
    color: '#F1F1F2',
    fontSize: 14,
    lineHeight: 19,
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  hashtagsText: {
    color: Colors.white,
    fontWeight: '700',
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  musicText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '500',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  actionsContainer: {
    position: 'absolute',
    right: 12,
    bottom: 24,
  },
});
