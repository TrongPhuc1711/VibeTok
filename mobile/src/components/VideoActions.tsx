/**
 * VideoActions — cột nút tương tác bên phải video (Avatar + Follow, Like, Comment, Bookmark, Share, MusicDisc).
 * Thiết kế chuẩn VibeTok Web và TikTok.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart, MessageCircle, Bookmark, Share2, Plus, Check } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { formatCount } from '../utils/formatters';
import Avatar from './common/Avatar';
import MusicDisc from './MusicDisc';
import { useAuthContext } from '../contexts/AuthContext';
import type { VideoItem } from '../hooks/useVideoFeed';

interface VideoActionsProps {
  video: VideoItem;
  isLiked: boolean;
  isBookmarked: boolean;
  isFollowing?: boolean;
  isPlaying?: boolean;
  onLike: () => void;
  onComment: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onAvatarPress: () => void;
  onFollow?: () => void;
}

export default function VideoActions({
  video,
  isLiked,
  isBookmarked,
  isFollowing = false,
  isPlaying = true,
  onLike,
  onComment,
  onBookmark,
  onShare,
  onAvatarPress,
  onFollow,
}: VideoActionsProps) {
  const { user: currentUser } = useAuthContext();
  const isOwnVideo =
    currentUser &&
    (String(currentUser.id) === String(video.user?.id) ||
      currentUser.username === video.user?.username);

  return (
    <View style={styles.container}>
      {/* ── Avatar + Follow '+' badge ── */}
      <View style={styles.avatarWrapper}>
        <TouchableOpacity
          style={styles.avatarButton}
          onPress={onAvatarPress}
          activeOpacity={0.8}
        >
          <Avatar
            uri={video.user?.anh_dai_dien}
            initials={video.user?.initials || 'VT'}
            size={48}
            borderColor={Colors.white}
          />
        </TouchableOpacity>

        {!isOwnVideo && !isFollowing && onFollow && (
          <TouchableOpacity
            style={styles.followBadge}
            onPress={onFollow}
            activeOpacity={0.7}
          >
            <Plus size={12} color={Colors.white} strokeWidth={3} />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Like ── */}
      <ActionButton
        icon={
          <Heart
            size={28}
            color={isLiked ? Colors.primary : Colors.white}
            fill={isLiked ? Colors.primary : 'none'}
          />
        }
        label={formatCount(video.likes ?? 0)}
        onPress={onLike}
        isActive={isLiked}
        activeColor={Colors.primary}
      />

      {/* ── Comment ── */}
      <ActionButton
        icon={<MessageCircle size={28} color={Colors.white} />}
        label={formatCount(video.comments ?? 0)}
        onPress={onComment}
      />

      {/* ── Bookmark ── */}
      <ActionButton
        icon={
          <Bookmark
            size={28}
            color={isBookmarked ? '#F59E0B' : Colors.white}
            fill={isBookmarked ? '#F59E0B' : 'none'}
          />
        }
        label={formatCount(video.bookmarks ?? 0) || 'Lưu'}
        onPress={onBookmark}
        isActive={isBookmarked}
        activeColor="#F59E0B"
      />

      {/* ── Share ── */}
      <ActionButton
        icon={<Share2 size={26} color={Colors.white} />}
        label={video.shares ? formatCount(video.shares) : 'Chia sẻ'}
        onPress={onShare}
      />

      {/* ── Music Disc Rotating ── */}
      <MusicDisc track={video.music} isPlaying={isPlaying} />
    </View>
  );
}

// ── ActionButton đơn lẻ ──
function ActionButton({
  icon,
  label,
  onPress,
  isActive = false,
  activeColor,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  isActive?: boolean;
  activeColor?: string;
}) {
  return (
    <TouchableOpacity
      style={styles.actionButton}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={styles.actionIcon}>{icon}</View>
      <Text
        style={[
          styles.actionLabel,
          isActive && { color: activeColor || Colors.primary },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 14,
    paddingVertical: 8,
  },
  avatarWrapper: {
    position: 'relative',
    marginBottom: 4,
  },
  avatarButton: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  followBadge: {
    position: 'absolute',
    bottom: -6,
    left: '50%',
    marginLeft: -10,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: Colors.background,
  },
  actionButton: {
    alignItems: 'center',
    gap: 3,
  },
  actionIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.6)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
});
