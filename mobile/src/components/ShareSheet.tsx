/**
 * ShareSheet — Bảng chia sẻ video phong cách TikTok/VibeTok Web.
 * Hỗ trợ:
 * 1. Gửi video trực tiếp cho bạn bè / người theo dõi qua tin nhắn nội bộ VibeTok.
 * 2. Đăng lại (Repost) với hiệu ứng kích hoạt.
 * 3. Sao chép liên kết video vào clipboard.
 * 4. Chia sẻ ra các ứng dụng khác qua Native Share dialog.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Share,
  Dimensions,
  ActivityIndicator,
  TouchableWithoutFeedback,
  Alert,
} from 'react-native';
import * as Clipboard from 'expo-clipboard';
import {
  Repeat,
  Link,
  Share2,
  X,
  Check,
  Send,
} from 'lucide-react-native';

import Avatar from './common/Avatar';
import api from '../api/api';
import { repostVideo, shareVideo } from '../services/videoService';
import { useAuthContext } from '../contexts/AuthContext';
import { useToast } from './common/Toast';
import { Colors } from '../theme/colors';
import type { VideoItem } from '../hooks/useVideoFeed';

interface ShareSheetProps {
  visible: boolean;
  video: VideoItem;
  onClose: () => void;
  onRepostChange?: (reposted: boolean) => void;
}

export default function ShareSheet({
  visible,
  video,
  onClose,
  onRepostChange,
}: ShareSheetProps) {
  const { user: currentUser } = useAuthContext();
  const { showSuccess, showError, showInfo } = useToast();

  const [friends, setFriends] = useState<any[]>([]);
  const [loadingFriends, setLoadingFriends] = useState(false);
  const [sentUserIds, setSentUserIds] = useState<Set<string>>(new Set());
  const [sendingUserIds, setSendingUserIds] = useState<Set<string>>(new Set());

  const [isReposted, setIsReposted] = useState(Boolean((video as any)?.isReposted));
  const [reposting, setReposting] = useState(false);

  useEffect(() => {
    setIsReposted(Boolean((video as any)?.isReposted));
  }, [video]);

  // Tải danh sách bạn bè / người theo dõi khi mở sheet
  useEffect(() => {
    if (!visible || !currentUser?.username) return;

    let cancelled = false;
    const fetchFriends = async () => {
      setLoadingFriends(true);
      try {
        const res = await api.get(`/users/${currentUser.username}/friends`, {
          params: { limit: 30 },
        });
        let list = res.data.users || [];
        if (list.length === 0) {
          const followRes = await api.get(`/users/${currentUser.username}/following`, {
            params: { limit: 30 },
          });
          list = followRes.data.users || [];
        }
        if (!cancelled) {
          setFriends(list);
        }
      } catch {
        // Fallback im lặng nếu không có danh sách
      } finally {
        if (!cancelled) setLoadingFriends(false);
      }
    };

    fetchFriends();
    return () => {
      cancelled = true;
    };
  }, [visible, currentUser?.username]);

  // Gửi video tới 1 người bạn
  const handleSendToFriend = async (friend: any) => {
    const friendId = String(friend.id);
    if (sentUserIds.has(friendId) || sendingUserIds.has(friendId)) return;

    setSendingUserIds((prev) => new Set(prev).add(friendId));
    try {
      const shareUrl = `https://vibe-tok.vercel.app/video/${video.id}`;
      await api.post('/messages', {
        receiverId: friendId,
        content: `Đã chia sẻ video: ${video.caption || 'Xem video này trên VibeTok!'} ${shareUrl}`,
      });
      setSentUserIds((prev) => new Set(prev).add(friendId));
      showSuccess('Đã gửi video', `Tới @${friend.username || friend.ten_dang_nhap}`);
    } catch {
      showError('Lỗi', 'Không thể gửi tin nhắn.');
    } finally {
      setSendingUserIds((prev) => {
        const next = new Set(prev);
        next.delete(friendId);
        return next;
      });
    }
  };

  // Đăng lại video (Repost)
  const handleRepost = async () => {
    if (reposting) return;
    setReposting(true);
    const nextState = !isReposted;
    setIsReposted(nextState);

    try {
      const res = await repostVideo(video.id);
      const actualState = res.data?.reposted ?? nextState;
      setIsReposted(actualState);
      onRepostChange?.(actualState);
      if (actualState) {
        showSuccess('Đã đăng lại!', `Video của @${video.user?.username}`);
      } else {
        showInfo('Đã gỡ đăng lại', 'Video đã được xóa khỏi mục đăng lại.');
      }
    } catch {
      setIsReposted(!nextState); // Rollback
      showError('Lỗi', 'Không thể đăng lại video này.');
    } finally {
      setReposting(false);
    }
  };

  // Sao chép liên kết (Copy Link)
  const handleCopyLink = async () => {
    const shareUrl = `https://vibe-tok.vercel.app/video/${video.id}`;
    await Clipboard.setStringAsync(shareUrl);
    showSuccess('Đã sao chép liên kết!', shareUrl);
    shareVideo(video.id).catch(() => {});
    onClose();
  };

  // Chia sẻ qua hệ thống (Native Share)
  const handleNativeShare = async () => {
    try {
      await shareVideo(video.id);
      await Share.share({
        message: `${video.caption || 'Xem video hay trên VibeTok!'}\nhttps://vibe-tok.vercel.app/video/${video.id}`,
      });
      onClose();
    } catch {
      // User cancelled
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View style={styles.sheet}>
              {/* Handle Bar */}
              <View style={styles.handleBar} />

              {/* Header */}
              <View style={styles.header}>
                <Text style={styles.title}>Chia sẻ video</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
                  <X size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {/* Gửi trực tiếp cho bạn bè */}
              {friends.length > 0 && (
                <View style={styles.friendsSection}>
                  <Text style={styles.sectionSubtitle}>Gửi tới bạn bè</Text>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.friendsRow}
                  >
                    {friends.map((friend) => {
                      const friendId = String(friend.id);
                      const isSent = sentUserIds.has(friendId);
                      const isSending = sendingUserIds.has(friendId);
                      const username = friend.username || friend.ten_dang_nhap || 'user';

                      return (
                        <TouchableOpacity
                          key={friendId}
                          style={styles.friendItem}
                          onPress={() => handleSendToFriend(friend)}
                          disabled={isSent || isSending}
                          activeOpacity={0.7}
                        >
                          <View style={styles.friendAvatarWrap}>
                            <Avatar
                              uri={friend.anh_dai_dien}
                              initials={friend.initials || username.slice(0, 2).toUpperCase()}
                              size={52}
                            />
                            {isSent && (
                              <View style={styles.sentBadge}>
                                <Check size={12} color={Colors.white} strokeWidth={3} />
                              </View>
                            )}
                          </View>
                          <Text style={styles.friendName} numberOfLines={1}>
                            {username}
                          </Text>
                          <View
                            style={[
                              styles.sendPill,
                              isSent && styles.sendPillDone,
                            ]}
                          >
                            {isSending ? (
                              <ActivityIndicator size="small" color={Colors.white} />
                            ) : (
                              <Text style={[styles.sendPillText, isSent && styles.sendPillTextDone]}>
                                {isSent ? 'Đã gửi' : 'Gửi'}
                              </Text>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </ScrollView>
                </View>
              )}

              {/* Hàng hành động (Đăng lại, Sao chép link, Chia sẻ ngoài) */}
              <View style={styles.actionsRow}>
                {/* Đăng lại (Repost) */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleRepost}
                  disabled={reposting}
                  activeOpacity={0.75}
                >
                  <View
                    style={[
                      styles.actionIconCircle,
                      isReposted && styles.actionIconCircleActive,
                    ]}
                  >
                    {reposting ? (
                      <ActivityIndicator size="small" color={Colors.white} />
                    ) : (
                      <Repeat
                        size={24}
                        color={isReposted ? '#10B981' : Colors.white}
                        strokeWidth={2.2}
                      />
                    )}
                  </View>
                  <Text
                    style={[
                      styles.actionLabel,
                      isReposted && { color: '#10B981', fontWeight: '700' },
                    ]}
                  >
                    {isReposted ? 'Đã đăng lại' : 'Đăng lại'}
                  </Text>
                </TouchableOpacity>

                {/* Sao chép liên kết */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleCopyLink}
                  activeOpacity={0.75}
                >
                  <View style={styles.actionIconCircle}>
                    <Link size={24} color={Colors.white} strokeWidth={2.2} />
                  </View>
                  <Text style={styles.actionLabel}>Sao chép link</Text>
                </TouchableOpacity>

                {/* Chia sẻ ngoài */}
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={handleNativeShare}
                  activeOpacity={0.75}
                >
                  <View style={styles.actionIconCircle}>
                    <Share2 size={24} color={Colors.white} strokeWidth={2.2} />
                  </View>
                  <Text style={styles.actionLabel}>Chia sẻ khác</Text>
                </TouchableOpacity>
              </View>

              {/* Nút Đóng */}
              <TouchableOpacity
                style={styles.cancelBtn}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={styles.cancelBtnText}>Hủy</Text>
              </TouchableOpacity>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#18181B',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 10,
    paddingBottom: 28,
    paddingHorizontal: 16,
    maxHeight: Dimensions.get('window').height * 0.75,
  },
  handleBar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.25)',
    alignSelf: 'center',
    marginBottom: 12,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingHorizontal: 4,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
  closeBtn: {
    padding: 4,
  },
  friendsSection: {
    marginBottom: 20,
  },
  sectionSubtitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textSecondary,
    marginBottom: 12,
  },
  friendsRow: {
    gap: 16,
    paddingHorizontal: 4,
  },
  friendItem: {
    alignItems: 'center',
    width: 64,
  },
  friendAvatarWrap: {
    position: 'relative',
    marginBottom: 6,
  },
  sentBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#18181B',
  },
  friendName: {
    fontSize: 11,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 6,
  },
  sendPill: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 3,
    borderRadius: 12,
    minWidth: 46,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendPillDone: {
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  sendPillText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.white,
  },
  sendPillTextDone: {
    color: Colors.textDim,
  },
  actionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    borderTopWidth: 0.5,
    borderTopColor: 'rgba(255,255,255,0.1)',
    marginBottom: 16,
  },
  actionBtn: {
    alignItems: 'center',
    gap: 8,
    width: 84,
  },
  actionIconCircle: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIconCircleActive: {
    backgroundColor: 'rgba(16,185,129,0.15)',
    borderWidth: 1.5,
    borderColor: '#10B981',
  },
  actionLabel: {
    fontSize: 12,
    color: Colors.white,
    textAlign: 'center',
    fontWeight: '500',
  },
  cancelBtn: {
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
});
