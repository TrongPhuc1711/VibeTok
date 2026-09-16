/**
 * CommentSheet — Bottom sheet chứa danh sách bình luận.
 * Sử dụng Modal + FlatList + TextInput để gửi bình luận.
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  Modal,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { X } from 'lucide-react-native';
import {
  getComments,
  postComment,
  likeComment as likeCommentAPI,
  unlikeComment as unlikeCommentAPI,
} from '../services/videoService';
import CommentItem from './CommentItem';
import LoadingSpinner from './common/LoadingSpinner';
import { Colors } from '../theme/colors';
import { MAX_COMMENT_LENGTH } from '../constants';

const SCREEN_H = Dimensions.get('window').height;

interface CommentSheetProps {
  visible: boolean;
  videoId: string;
  totalComments: number;
  onClose: () => void;
}

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  likes: number;
  isLiked: boolean;
  replyCount?: number;
  user: {
    username: string;
    fullName: string;
    anh_dai_dien?: string;
    initials: string;
  };
}

export default function CommentSheet({
  visible,
  videoId,
  totalComments,
  onClose,
}: CommentSheetProps) {
  const insets = useSafeAreaInsets();
  const inputRef = useRef<TextInput>(null);

  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState('');
  const [sending, setSending] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);

  // Load comments
  useEffect(() => {
    if (!visible || !videoId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      try {
        const { data } = await getComments(videoId);
        if (!cancelled) setComments(data.comments || []);
      } catch (err) {
        console.error('[CommentSheet] load error:', err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => { cancelled = true; };
  }, [visible, videoId]);

  // Send comment
  const handleSend = useCallback(async () => {
    const content = text.trim();
    if (!content || sending) return;

    setSending(true);
    try {
      const { data } = await postComment(videoId, {
        content,
        parentId: replyTo,
      });
      setComments((prev) => [data.comment, ...prev]);
      setText('');
      setReplyTo(null);
    } catch (err) {
      console.error('[CommentSheet] send error:', err);
    } finally {
      setSending(false);
    }
  }, [text, sending, videoId, replyTo]);

  // Toggle like (Optimistic Update)
  const handleLike = useCallback(
    async (commentId: string) => {
      const comment = comments.find((c) => c.id === commentId);
      if (!comment) return;

      const wasLiked = comment.isLiked;
      // Optimistic update immediately
      setComments((prev) =>
        prev.map((c) =>
          c.id === commentId
            ? {
                ...c,
                isLiked: !wasLiked,
                likes: wasLiked ? Math.max(0, c.likes - 1) : c.likes + 1,
              }
            : c,
        ),
      );

      try {
        if (wasLiked) {
          await unlikeCommentAPI(videoId, commentId);
        } else {
          await likeCommentAPI(videoId, commentId);
        }
      } catch (err) {
        console.error('[CommentSheet] like error:', err);
        // Rollback on error
        setComments((prev) =>
          prev.map((c) =>
            c.id === commentId
              ? {
                  ...c,
                  isLiked: wasLiked,
                  likes: wasLiked ? c.likes : Math.max(0, c.likes - 1),
                }
              : c,
          ),
        );
      }
    },
    [comments, videoId],
  );

  // Reply
  const handleReply = useCallback(
    (commentId: string) => {
      setReplyTo(commentId);
      inputRef.current?.focus();
    },
    [],
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.backdrop} onPress={onClose} />

        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheet, { paddingBottom: insets.bottom }]}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.handle} />
            <Text style={styles.headerTitle}>
              {totalComments} bình luận
            </Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose} activeOpacity={0.7}>
              <X size={20} color={Colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Comment list */}
          {loading ? (
            <LoadingSpinner />
          ) : (
            <FlatList
              data={comments}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <CommentItem
                  comment={item}
                  onLike={handleLike}
                  onReply={handleReply}
                />
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Text style={styles.emptyText}>
                    Chưa có bình luận nào. Hãy là người đầu tiên!
                  </Text>
                </View>
              }
              contentContainerStyle={styles.list}
              showsVerticalScrollIndicator={false}
              initialNumToRender={15}
              maxToRenderPerBatch={10}
            />
          )}

          {/* Input */}
          <View style={styles.inputContainer}>
            {replyTo && (
              <View style={styles.replyBanner}>
                <Text style={styles.replyText}>Đang trả lời...</Text>
                <TouchableOpacity onPress={() => setReplyTo(null)}>
                  <Text style={styles.cancelReply}>Hủy</Text>
                </TouchableOpacity>
              </View>
            )}
            <View style={styles.inputRow}>
              <TextInput
                ref={inputRef}
                style={styles.input}
                value={text}
                onChangeText={setText}
                placeholder="Thêm bình luận..."
                placeholderTextColor={Colors.textGhost}
                maxLength={MAX_COMMENT_LENGTH}
                multiline
              />
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  !text.trim() && styles.sendButtonDisabled,
                ]}
                onPress={handleSend}
                disabled={!text.trim() || sending}
              >
                <Text style={styles.sendText}>Gửi</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  sheet: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: SCREEN_H * 0.7,
  },
  header: {
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.textGhost,
    marginBottom: 8,
  },
  headerTitle: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  closeButton: {
    position: 'absolute',
    right: 16,
    top: 16,
  },
  closeText: {
    color: Colors.textMuted,
    fontSize: 18,
  },
  list: {
    flexGrow: 1,
    paddingVertical: 8,
  },
  empty: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textDim,
    fontSize: 14,
  },
  inputContainer: {
    borderTopWidth: 0.5,
    borderTopColor: Colors.border,
  },
  replyBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 6,
    backgroundColor: Colors.elevated,
  },
  replyText: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  cancelReply: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: Colors.elevated,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    color: Colors.textPrimary,
    maxHeight: 80,
  },
  sendButton: {
    backgroundColor: Colors.primary,
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendText: {
    color: Colors.white,
    fontSize: 14,
    fontWeight: '600',
  },
});
