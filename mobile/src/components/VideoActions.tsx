/**
 * VideoActions — cột nút tương tác bên phải video (like, comment, bookmark, share).
 * Tách riêng khỏi VideoFeedItem để dễ bảo trì.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Share } from 'react-native';
import { Heart, MessageCircle, Bookmark, Share2 } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { formatCount } from '../utils/formatters';
import Avatar from './common/Avatar';
import type { VideoItem } from '../hooks/useVideoFeed';

interface VideoActionsProps {
  video: VideoItem;
  isLiked: boolean;
  isBookmarked: boolean;
  onLike: () => void;
  onComment: () => void;
  onBookmark: () => void;
  onShare: () => void;
  onAvatarPress: () => void;
}

export default function VideoActions({
  video,
  isLiked,
  isBookmarked,
  onLike,
  onComment,
  onBookmark,
  onShare,
  onAvatarPress,
}: VideoActionsProps) {
  return (
    <View style={styles.container}>
      {/* Avatar */}
      <TouchableOpacity style={styles.avatarButton} onPress={onAvatarPress}>
        <Avatar
          uri={video.user?.anh_dai_dien}
          initials={video.user?.initials || 'VT'}
          size={44}
          borderColor={Colors.primary}
        />
      </TouchableOpacity>

      {/* Like */}
      <ActionButton
        icon={
          <Heart
            size={28}
            color={isLiked ? Colors.primary : Colors.white}
            fill={isLiked ? Colors.primary : 'none'}
          />
        }
        label={formatCount(video.likes)}
        onPress={onLike}
        isActive={isLiked}
      />

      {/* Comment */}
      <ActionButton
        icon={<MessageCircle size={28} color={Colors.white} />}
        label={formatCount(video.comments)}
        onPress={onComment}
      />

      {/* Bookmark */}
      <ActionButton
        icon={
          <Bookmark
            size={28}
            color={isBookmarked ? '#F59E0B' : Colors.white}
            fill={isBookmarked ? '#F59E0B' : 'none'}
          />
        }
        label="Lưu"
        onPress={onBookmark}
        isActive={isBookmarked}
      />

      {/* Share */}
      <ActionButton
        icon={<Share2 size={26} color={Colors.white} />}
        label="Chia sẻ"
        onPress={onShare}
      />
    </View>
  );
}

// ── Nút đơn lẻ ──
function ActionButton({
  icon,
  label,
  onPress,
  isActive = false,
}: {
  icon: React.ReactNode;
  label: string;
  onPress: () => void;
  isActive?: boolean;
}) {
  return (
    <TouchableOpacity style={styles.actionButton} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.actionIcon}>{icon}</View>
      <Text style={[styles.actionLabel, isActive && styles.actionLabelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    gap: 16,
    paddingVertical: 8,
  },
  avatarButton: {
    marginBottom: 8,
  },
  actionButton: {
    alignItems: 'center',
    gap: 2,
  },
  actionIcon: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionLabel: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
  },
  actionLabelActive: {
    color: Colors.primary,
  },
});
