/**
 * NotificationScreen — Danh sách thông báo.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Heart, MessageCircle, UserCheck, AtSign, Bell, BellOff } from 'lucide-react-native';

import Avatar from '../components/common/Avatar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  getNotifications,
  markAsRead,
  markAllAsRead,
} from '../services/notificationService';
import { Colors } from '../theme/colors';
import { timeAgo } from '../utils/formatters';
import type { RootStackParamList } from '../navigation/types';

interface Notification {
  id: string;
  type: string;
  message: string;
  isRead: boolean;
  createdAt: string;
  sender?: {
    username: string;
    fullName: string;
    anh_dai_dien?: string;
    initials: string;
  };
  meta?: {
    videoId?: string;
    commentId?: string;
    videoThumb?: string;
    rejectionReason?: string;
    videoCaption?: string;
  };
}

function NotificationIcon({ type }: { type: string }) {
  switch (type) {
    case 'like':
      return <Heart size={18} color="#EF4444" fill="#EF4444" />;
    case 'comment':
      return <MessageCircle size={18} color="#3B82F6" fill="#3B82F6" />;
    case 'follow':
      return <UserCheck size={18} color="#10B981" />;
    case 'mention':
      return <AtSign size={18} color="#8B5CF6" />;
    case 'system':
    default:
      return <Bell size={18} color="#F59E0B" />;
  }
}

export default function NotificationScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [unread, setUnread] = useState(0);

  const loadNotifications = useCallback(async () => {
    try {
      const { data } = await getNotifications({ page: 1, limit: 50 });
      const rawList = data.notifications || [];
      const normalized: Notification[] = rawList.map((item: any) => {
        const actor = item.actor || item.sender;
        const meta = item.meta || {};
        const isRead = Boolean(item.read ?? item.isRead);

        let msg = item.message;
        if (!msg) {
          switch (item.type) {
            case 'like':
              msg = 'đã thích video của bạn';
              break;
            case 'comment':
              msg = 'đã bình luận về video của bạn';
              break;
            case 'follow':
              msg = 'đã bắt đầu theo dõi bạn';
              break;
            case 'mention':
              msg = 'đã nhắc đến bạn trong một bình luận';
              break;
            case 'system':
            default:
              msg = meta.rejectionReason
                ? `Video bị từ chối: ${meta.rejectionReason}`
                : 'Thông báo mới từ hệ thống VibeTok';
              break;
          }
        }

        return {
          id: String(item.id),
          type: item.type,
          message: msg,
          isRead,
          createdAt: item.createdAt,
          sender: actor
            ? {
                username: actor.username || 'user',
                fullName: actor.fullName || actor.display_name || '',
                anh_dai_dien: actor.anh_dai_dien || actor.avatar_url,
                initials: actor.initials || 'U',
              }
            : undefined,
          meta,
        };
      });

      setNotifications(normalized);
      const unreadCount = data.unread ?? normalized.filter((n) => !n.isRead).length;
      setUnread(unreadCount);
    } catch (err) {
      console.error('[NotificationScreen]', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadNotifications();
  }, [loadNotifications]);

  const handlePress = useCallback(
    async (noti: Notification) => {
      if (!noti.isRead) {
        markAsRead(noti.id).catch(() => {});
        setNotifications((prev) =>
          prev.map((n) => (n.id === noti.id ? { ...n, isRead: true } : n)),
        );
        setUnread((u) => Math.max(0, u - 1));
      }

      // Navigate to video or profile
      if (noti.meta?.videoId) {
        navigation.navigate('VideoDetail', { videoId: String(noti.meta.videoId) });
      } else if (noti.sender?.username && noti.sender.username !== 'system') {
        navigation.navigate('UserProfile', { username: noti.sender.username });
      }
    },
    [navigation],
  );

  const handleMarkAllRead = useCallback(async () => {
    await markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnread(0);
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Thông báo</Text>
        {unread > 0 && (
          <TouchableOpacity onPress={handleMarkAllRead}>
            <Text style={styles.markAllText}>Đọc tất cả</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* List */}
      <FlatList
        data={notifications}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[
              styles.notiItem,
              !item.isRead && styles.notiItemUnread,
            ]}
            onPress={() => handlePress(item)}
            activeOpacity={0.7}
          >
            {item.sender ? (
              <Avatar
                uri={item.sender.anh_dai_dien}
                initials={item.sender.initials}
                size={40}
              />
            ) : (
              <View style={styles.iconCircle}>
                <NotificationIcon type={item.type} />
              </View>
            )}

            <View style={styles.notiBody}>
              <Text style={styles.notiMessage} numberOfLines={2}>
                {item.sender && (
                  <Text style={styles.notiSender}>
                    {item.sender.username}{' '}
                  </Text>
                )}
                {item.message}
              </Text>
              <Text style={styles.notiTime}>{timeAgo(item.createdAt)}</Text>
            </View>

            {!item.isRead && <View style={styles.unreadDot} />}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <BellOff size={48} color={Colors.textDim} strokeWidth={1.2} />
            <Text style={styles.emptyText}>Chưa có thông báo nào</Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.list}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  markAllText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: '600',
  },
  list: {
    flexGrow: 1,
  },
  notiItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.borderLight,
  },
  notiItemUnread: {
    backgroundColor: 'rgba(254, 44, 85, 0.04)',
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  notiIcon: {
    fontSize: 18,
  },
  notiBody: {
    flex: 1,
    gap: 3,
  },
  notiMessage: {
    color: Colors.textSecondary,
    fontSize: 14,
    lineHeight: 19,
  },
  notiSender: {
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  notiTime: {
    color: Colors.textDim,
    fontSize: 11,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  empty: {
    flex: 1,
    paddingVertical: 80,
    alignItems: 'center',
    gap: 12,
  },
  emptyIcon: {
    fontSize: 48,
    opacity: 0.4,
  },
  emptyText: {
    color: Colors.textDim,
    fontSize: 15,
  },
});
