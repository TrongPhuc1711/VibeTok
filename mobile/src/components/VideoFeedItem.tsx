import React, { useRef, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  TouchableWithoutFeedback,
  Dimensions,
  StyleSheet,
  Animated,
} from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { LinearGradient } from 'expo-linear-gradient';
import { Play, Heart, Music } from 'lucide-react-native';

import VideoActions from './VideoActions';
import { Colors } from '../theme/colors';
import type { VideoItem } from '../hooks/useVideoFeed';

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
}: VideoFeedItemProps) {
  const [paused, setPaused] = useState(false);
  const [showPauseIcon, setShowPauseIcon] = useState(false);

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
    return [rawUrl || video.thumbnail];
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

  // Single tap → toggle play/pause
  // Double tap → like
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

  return (
    <View style={styles.container}>
      <TouchableWithoutFeedback onPress={handlePress}>
        <View style={styles.videoWrapper}>
          {/* Video player */}
          {isSlideshowOrImage && imageUrls.length > 0 ? (
            <Image
              source={{ uri: imageUrls[0] }}
              style={styles.video}
              resizeMode="cover"
            />
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
              <Play size={64} color="rgba(255,255,255,0.8)" fill="rgba(255,255,255,0.8)" />
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

          {/* Bottom gradient + info */}
          <LinearGradient
            colors={['transparent', 'rgba(0,0,0,0.7)']}
            style={styles.gradient}
          >
            <View style={styles.infoContainer}>
              <Text style={styles.username} numberOfLines={1}>
                @{video.user.username}
              </Text>
              <Text style={styles.caption} numberOfLines={2}>
                {video.caption}
              </Text>
              {video.music && (
                <View style={styles.musicRow}>
                  <Music size={12} color={Colors.textMuted} />
                  <Text style={styles.musicText} numberOfLines={1}>
                    {video.music.title} — {video.music.artist}
                  </Text>
                </View>
              )}
            </View>
          </LinearGradient>

          {/* Right action buttons */}
          <View style={styles.actionsContainer}>
            <VideoActions
              video={video}
              isLiked={isLiked}
              isBookmarked={isBookmarked}
              onLike={onLike}
              onComment={onComment}
              onBookmark={onBookmark}
              onShare={onShare}
              onAvatarPress={onAvatarPress}
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
  pauseOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pauseIcon: {
    fontSize: 56,
    opacity: 0.7,
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
  heartIcon: {
    fontSize: 100,
  },
  gradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingBottom: 16,
    paddingHorizontal: 16,
    paddingTop: 60,
  },
  infoContainer: {
    maxWidth: SCREEN_W * 0.7,
    gap: 6,
  },
  username: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: '700',
  },
  caption: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 19,
  },
  musicRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  musicIcon: {
    fontSize: 12,
  },
  musicText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  actionsContainer: {
    position: 'absolute',
    right: 10,
    bottom: 80,
  },
});
