/**
 * CommentItem — 1 dòng bình luận trong danh sách.
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Heart } from 'lucide-react-native';
import Avatar from './common/Avatar';
import { Colors } from '../theme/colors';
import { timeAgo } from '../utils/formatters';

interface CommentItemProps {
  comment: {
    id: string;
    content: string;
    createdAt: string;
    likes: number;
    isLiked: boolean;
    user: {
      username: string;
      fullName: string;
      anh_dai_dien?: string;
      initials: string;
    };
    replyCount?: number;
  };
  onLike: (commentId: string) => void;
  onReply: (commentId: string) => void;
}

export default function CommentItem({ comment, onLike, onReply }: CommentItemProps) {
  return (
    <View style={styles.container}>
      <Avatar
        uri={comment.user.anh_dai_dien}
        initials={comment.user.initials}
        size={34}
      />

      <View style={styles.body}>
        <Text style={styles.username}>{comment.user.username}</Text>
        <Text style={styles.content}>{comment.content}</Text>

        <View style={styles.meta}>
          <Text style={styles.time}>{timeAgo(comment.createdAt)}</Text>
          <TouchableOpacity onPress={() => onReply(comment.id)}>
            <Text style={styles.replyButton}>Trả lời</Text>
          </TouchableOpacity>
          {(comment.replyCount ?? 0) > 0 && (
            <Text style={styles.replyCount}>
              {comment.replyCount} trả lời
            </Text>
          )}
        </View>
      </View>

      <TouchableOpacity
        style={styles.likeButton}
        onPress={() => onLike(comment.id)}
        activeOpacity={0.7}
      >
        <Heart
          size={16}
          color={comment.isLiked ? Colors.primary : Colors.textDim}
          fill={comment.isLiked ? Colors.primary : 'none'}
        />
        {comment.likes > 0 && (
          <Text style={styles.likeCount}>{comment.likes}</Text>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 10,
  },
  body: {
    flex: 1,
    gap: 3,
  },
  username: {
    color: Colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  content: {
    color: Colors.textPrimary,
    fontSize: 14,
    lineHeight: 19,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 4,
  },
  time: {
    color: Colors.textDim,
    fontSize: 11,
  },
  replyButton: {
    color: Colors.textDim,
    fontSize: 11,
    fontWeight: '600',
  },
  replyCount: {
    color: Colors.textDim,
    fontSize: 11,
  },
  likeButton: {
    alignItems: 'center',
    paddingTop: 8,
    gap: 2,
  },
  likeIcon: {
    fontSize: 16,
  },
  likeCount: {
    color: Colors.textDim,
    fontSize: 10,
  },
});
