/**
 * ExploreScreen — Khám phá: tìm kiếm + trending + grid video.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { Flame, Sparkles, Compass } from 'lucide-react-native';

import SearchBar from '../components/SearchBar';
import VideoGrid from '../components/VideoGrid';
import Avatar from '../components/common/Avatar';
import LoadingSpinner from '../components/common/LoadingSpinner';
import {
  globalSearch,
  getTrendingHashtags,
  getFeaturedCreators,
} from '../services/exploreService';
import { getFeed } from '../services/videoService';
import { Colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

export default function ExploreScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [searching, setSearching] = useState(false);

  const [trendingTags, setTrendingTags] = useState<any[]>([]);
  const [creators, setCreators] = useState<any[]>([]);
  const [discoverVideos, setDiscoverVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load initial data
  useEffect(() => {
    const load = async () => {
      try {
        const [tagsRes, creatorsRes, videosRes] = await Promise.allSettled([
          getTrendingHashtags({ limit: 10 }),
          getFeaturedCreators({ limit: 8 }),
          getFeed({ type: 'forYou', page: 1, limit: 30 }),
        ]);

        if (tagsRes.status === 'fulfilled') {
          setTrendingTags(tagsRes.value.data.hashtags || []);
        }
        if (creatorsRes.status === 'fulfilled') {
          setCreators(creatorsRes.value.data.creators || []);
        }
        if (videosRes.status === 'fulfilled') {
          setDiscoverVideos(videosRes.value.data.videos || []);
        }
      } catch (err) {
        console.error('[ExploreScreen] load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  // Search
  const handleSearch = useCallback(async () => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }
    setSearching(true);
    try {
      const { data } = await globalSearch({ q: searchQuery.trim() });
      setSearchResults(data);
    } catch (err) {
      console.error('[ExploreScreen] search error:', err);
    } finally {
      setSearching(false);
    }
  }, [searchQuery]);

  const handleClearSearch = useCallback(() => {
    setSearchResults(null);
  }, []);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Search bar */}
      <View style={styles.searchContainer}>
        <SearchBar
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmit={handleSearch}
          onClear={handleClearSearch}
          placeholder="Tìm kiếm video, người dùng, hashtag..."
        />
      </View>

      {searchResults ? (
        /* ── Search results ── */
        searchResults.videos?.length > 0 ? (
          <VideoGrid
            videos={searchResults.videos}
            onPress={(index) => {
              const v = searchResults.videos[index];
              if (v) navigation.navigate('VideoDetail', { videoId: v.id });
            }}
            ListHeaderComponent={
              searchResults.users?.length > 0 ? (
                <View style={styles.section}>
                  <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginBottom: 12 }]}>Tài khoản</Text>
                  {searchResults.users.map((u: any) => (
                    <TouchableOpacity
                      key={u.id}
                      style={styles.userRow}
                      onPress={() => navigation.navigate('UserProfile', { username: u.username })}
                      activeOpacity={0.7}
                    >
                      <Avatar uri={u.anh_dai_dien} initials={u.initials} size={40} />
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{u.username}</Text>
                        <Text style={styles.userFullName}>{u.fullName}</Text>
                      </View>
                    </TouchableOpacity>
                  ))}
                  <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginTop: 16, marginBottom: 12 }]}>Video</Text>
                </View>
              ) : undefined
            }
          />
        ) : searchResults.users?.length > 0 ? (
          <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { paddingHorizontal: 16, marginBottom: 12 }]}>Tài khoản</Text>
              {searchResults.users.map((u: any) => (
                <TouchableOpacity
                  key={u.id}
                  style={styles.userRow}
                  onPress={() => navigation.navigate('UserProfile', { username: u.username })}
                  activeOpacity={0.7}
                >
                  <Avatar uri={u.anh_dai_dien} initials={u.initials} size={40} />
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{u.username}</Text>
                    <Text style={styles.userFullName}>{u.fullName}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        ) : (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              Không tìm thấy kết quả cho "{searchQuery}"
            </Text>
          </View>
        )
      ) : (
        /* ── Default explore ── */
        <VideoGrid
          videos={discoverVideos}
          onPress={(index) => {
            const v = discoverVideos[index];
            if (v) navigation.navigate('VideoDetail', { videoId: v.id });
          }}
          emptyText="Đang tải video..."
          ListHeaderComponent={
            <View style={{ paddingTop: 6 }}>
              {/* Trending hashtags */}
              {trendingTags.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Flame size={18} color="#FF5722" />
                    <Text style={styles.sectionTitle}>Xu hướng</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.tagsRow}
                  >
                    {trendingTags.map((tag: any, i: number) => (
                      <TouchableOpacity key={i} style={styles.tagChip}>
                        <Text style={styles.tagText}>#{tag.name || tag.tag}</Text>
                        {tag.count && (
                          <Text style={styles.tagCount}>{tag.count} video</Text>
                        )}
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Featured creators */}
              {creators.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeaderRow}>
                    <Sparkles size={18} color="#F59E0B" />
                    <Text style={styles.sectionTitle}>Creator nổi bật</Text>
                  </View>
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.creatorsRow}
                  >
                    {creators.map((c: any) => (
                      <TouchableOpacity
                        key={c.id}
                        style={styles.creatorCard}
                        onPress={() => navigation.navigate('UserProfile', { username: c.username })}
                        activeOpacity={0.8}
                      >
                        <Avatar
                          uri={c.anh_dai_dien}
                          initials={c.initials}
                          size={56}
                        />
                        <Text style={styles.creatorName} numberOfLines={1}>
                          {c.username}
                        </Text>
                        <Text style={styles.creatorMeta} numberOfLines={1}>
                          {c.fullName}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              )}

              {/* Discover videos grid header */}
              <View style={[styles.sectionHeaderRow, { marginBottom: 10 }]}>
                <Compass size={18} color={Colors.primary} />
                <Text style={styles.sectionTitle}>Khám phá</Text>
              </View>
            </View>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scroll: {
    flex: 1,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  sectionTitle: {
    color: Colors.textPrimary,
    fontSize: 17,
    fontWeight: '700',
  },
  tagsRow: {
    paddingHorizontal: 16,
    gap: 8,
  },
  tagChip: {
    backgroundColor: Colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  tagText: {
    color: Colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  tagCount: {
    color: Colors.textDim,
    fontSize: 10,
    marginTop: 2,
  },
  creatorsRow: {
    paddingHorizontal: 16,
    gap: 14,
  },
  creatorCard: {
    alignItems: 'center',
    width: 80,
    gap: 4,
  },
  creatorName: {
    color: Colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  creatorMeta: {
    color: Colors.textDim,
    fontSize: 10,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 12,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    color: Colors.textPrimary,
    fontSize: 14,
    fontWeight: '600',
  },
  userFullName: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  empty: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  emptyText: {
    color: Colors.textDim,
    fontSize: 14,
  },
});
