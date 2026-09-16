/**
 * ProfileScreen — Trang hồ sơ cá nhân / xem profile người khác.
 * Tabs: Videos | Liked | Bookmarks (bookmarks chỉ hiện trên profile mình).
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Film, Heart, Bookmark, ArrowLeft, Repeat } from 'lucide-react-native';

import Avatar from '../components/common/Avatar';
import Button from '../components/common/Button';
import VideoGrid from '../components/VideoGrid';
import EditProfileModal from '../components/EditProfileModal';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { useAuthContext } from '../contexts/AuthContext';
import { useProfile } from '../hooks/useProfile';
import { getMyBookmarks } from '../services/bookmarkService';
import { formatCount } from '../utils/formatters';
import { Colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

type ProfileRoute = RouteProp<RootStackParamList, 'UserProfile'>;

const TABS_OWN = ['Videos', 'Reposts', 'Liked', 'Bookmarks'] as const;
const TABS_OTHER = ['Videos', 'Reposts', 'Liked'] as const;

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<ProfileRoute>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user, logout } = useAuthContext();

  const targetUsername = route.params?.username || user?.username || '';
  const isMyProfile = !route.params?.username || route.params.username === user?.username;

  const {
    profile,
    videos,
    likedVideos,
    repostedVideos,
    loading,
    likedLoading,
    repostedLoading,
    following,
    toggleFollow,
    fetchLikedVideos,
    fetchRepostedVideos,
    refetch,
  } = useProfile(targetUsername);

  const tabs = isMyProfile ? TABS_OWN : TABS_OTHER;
  const [activeTab, setActiveTab] = useState<string>('Videos');
  const [editModalVisible, setEditModalVisible] = useState(false);
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [bookmarksLoading, setBookmarksLoading] = useState(false);
  const [likedFetched, setLikedFetched] = useState(false);
  const [repostedFetched, setRepostedFetched] = useState(false);
  const [bookmarksFetched, setBookmarksFetched] = useState(false);

  // Fetch liked videos on tab change
  useEffect(() => {
    if (activeTab === 'Liked' && !likedFetched) {
      fetchLikedVideos();
      setLikedFetched(true);
    }
  }, [activeTab, likedFetched, fetchLikedVideos]);

  // Fetch reposted videos on tab change
  useEffect(() => {
    if (activeTab === 'Reposts' && !repostedFetched) {
      fetchRepostedVideos();
      setRepostedFetched(true);
    }
  }, [activeTab, repostedFetched, fetchRepostedVideos]);

  // Fetch bookmarks
  useEffect(() => {
    if (activeTab === 'Bookmarks' && !bookmarksFetched && isMyProfile) {
      const loadBookmarks = async () => {
        setBookmarksLoading(true);
        try {
          const data = await getMyBookmarks({ page: 1, limit: 50 });
          setBookmarks(data.rows || []);
        } catch (err) {
          console.error('[ProfileScreen] bookmarks error:', err);
        } finally {
          setBookmarksLoading(false);
          setBookmarksFetched(true);
        }
      };
      loadBookmarks();
    }
  }, [activeTab, bookmarksFetched, isMyProfile]);

  // Reset tab caches when navigating to different profile
  useEffect(() => {
    setLikedFetched(false);
    setRepostedFetched(false);
    setBookmarksFetched(false);
  }, [targetUsername]);

  // Logout handler
  const handleLogout = useCallback(() => {
    Alert.alert('Đăng xuất', 'Bạn có chắc muốn đăng xuất?', [
      { text: 'Hủy', style: 'cancel' },
      { text: 'Đăng xuất', style: 'destructive', onPress: logout },
    ]);
  }, [logout]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  if (!profile) {
    return (
      <View style={[styles.container, styles.center, { paddingTop: insets.top }]}>
        <Text style={styles.emptyText}>Không tìm thấy người dùng</Text>
      </View>
    );
  }

  const currentVideos =
    activeTab === 'Videos'
      ? videos
      : activeTab === 'Reposts'
        ? repostedVideos
        : activeTab === 'Liked'
          ? likedVideos
          : bookmarks;

  const currentLoading =
    activeTab === 'Liked'
      ? likedLoading
      : activeTab === 'Reposts'
        ? repostedLoading
        : activeTab === 'Bookmarks'
          ? bookmarksLoading
          : false;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <VideoGrid
        videos={currentVideos}
        onPress={(index) => {
          const v = currentVideos[index];
          if (v) {
            navigation.navigate('VideoDetail', { videoId: v.id });
          }
        }}
        loading={currentLoading}
        emptyText={
          activeTab === 'Videos'
            ? 'Chưa đăng video nào'
            : activeTab === 'Reposts'
              ? 'Chưa đăng lại video nào'
              : activeTab === 'Liked'
                ? 'Chưa thích video nào'
                : 'Chưa lưu video nào'
        }
        ListHeaderComponent={
          <View>
            {/* Top back bar when viewing other user profile */}
            {!isMyProfile && (
              <View style={styles.topBar}>
                <TouchableOpacity
                  onPress={() => navigation.goBack()}
                  style={styles.backBtn}
                  activeOpacity={0.7}
                >
                  <ArrowLeft size={22} color={Colors.textPrimary} />
                </TouchableOpacity>
                <Text style={styles.topBarTitle}>@{profile.username}</Text>
                <View style={{ width: 40 }} />
              </View>
            )}

            {/* ── Profile header ── */}
            <View style={styles.profileHeader}>
              <Avatar
                uri={profile.anh_dai_dien}
                initials={profile.initials}
                size={80}
              />

              <Text style={styles.username}>@{profile.username}</Text>
              {profile.fullName && (
                <Text style={styles.fullName}>{profile.fullName}</Text>
              )}

              {/* Stats */}
              <View style={styles.statsRow}>
                <StatItem value={profile.followingCount} label="Đang theo dõi" />
                <StatItem value={profile.followersCount} label="Người theo dõi" />
                <StatItem value={profile.likesCount} label="Lượt thích" />
              </View>

              {/* Action buttons */}
              <View style={styles.actionsRow}>
                {isMyProfile ? (
                  <>
                    <Button
                      title="Chỉnh sửa hồ sơ"
                      onPress={() => setEditModalVisible(true)}
                      variant="outline"
                      size="sm"
                    />
                    <Button
                      title="Đăng xuất"
                      onPress={handleLogout}
                      variant="ghost"
                      size="sm"
                      textStyle={{ color: Colors.error }}
                    />
                  </>
                ) : (
                  <Button
                    title={following ? 'Đang theo dõi' : 'Theo dõi'}
                    onPress={toggleFollow}
                    variant={following ? 'outline' : 'primary'}
                    size="sm"
                  />
                )}
              </View>

              {/* Bio */}
              {profile.tieu_su ? (
                <Text style={styles.bio}>{profile.tieu_su}</Text>
              ) : null}
            </View>

            {/* ── Tabs ── */}
            <View style={styles.tabsContainer}>
              {tabs.map((tab) => {
                const isActive = activeTab === tab;
                const iconColor = isActive ? Colors.textPrimary : Colors.textDim;
                return (
                  <TouchableOpacity
                    key={tab}
                    style={[styles.tab, isActive && styles.tabActive]}
                    onPress={() => setActiveTab(tab)}
                  >
                    <View style={styles.tabContent}>
                      {tab === 'Videos' && (
                        <Film size={15} color={iconColor} strokeWidth={isActive ? 2.2 : 1.8} />
                      )}
                      {tab === 'Reposts' && (
                        <Repeat size={15} color={iconColor} strokeWidth={isActive ? 2.2 : 1.8} />
                      )}
                      {tab === 'Liked' && (
                        <Heart
                          size={15}
                          color={iconColor}
                          fill={isActive ? Colors.primary : 'none'}
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />
                      )}
                      {tab === 'Bookmarks' && (
                        <Bookmark
                          size={15}
                          color={iconColor}
                          fill={isActive ? Colors.primary : 'none'}
                          strokeWidth={isActive ? 2.2 : 1.8}
                        />
                      )}
                      <Text
                        style={[
                          styles.tabText,
                          isActive && styles.tabTextActive,
                        ]}
                      >
                        {tab === 'Videos'
                          ? 'Video'
                          : tab === 'Reposts'
                            ? 'Đã đăng lại'
                            : tab === 'Liked'
                              ? 'Đã thích'
                              : 'Đã lưu'}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        }
      />

      {/* Edit Profile Modal */}
      {isMyProfile && (
        <EditProfileModal
          visible={editModalVisible}
          onClose={() => setEditModalVisible(false)}
          profile={profile}
          onProfileUpdated={refetch}
        />
      )}
    </View>
  );
}

// ── Stat item ──
function StatItem({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{formatCount(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  center: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  topBarTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    gap: 8,
  },
  username: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 8,
  },
  fullName: {
    fontSize: 14,
    color: Colors.textMuted,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 28,
    marginTop: 12,
    marginBottom: 4,
  },
  statItem: {
    alignItems: 'center',
    gap: 2,
  },
  statValue: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  statLabel: {
    fontSize: 11,
    color: Colors.textDim,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  bio: {
    color: Colors.textSecondary,
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    paddingHorizontal: 20,
    marginTop: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: Colors.transparent,
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabActive: {
    borderBottomColor: Colors.textPrimary,
  },
  tabText: {
    fontSize: 13,
    color: Colors.textDim,
    fontWeight: '500',
  },
  tabTextActive: {
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  emptyText: {
    color: Colors.textDim,
    fontSize: 15,
  },
});
