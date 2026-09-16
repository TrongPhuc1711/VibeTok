/**
 * HashtagScreen — Trang hiển thị chi tiết 1 hashtag và các video gắn thẻ.
 * Tương đương với HashtagPage.jsx trên phiên bản Web.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRoute, useNavigation, type RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { ArrowLeft, Hash, Eye, Film } from 'lucide-react-native';

import VideoGrid from '../components/VideoGrid';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { getHashtagInfo, getVideosByHashtag } from '../services/exploreService';
import { formatCount } from '../utils/formatters';
import { Colors } from '../theme/colors';
import type { RootStackParamList } from '../navigation/types';

type Route = RouteProp<RootStackParamList, 'Hashtag'>;
type Nav = NativeStackNavigationProp<RootStackParamList, 'Hashtag'>;

export default function HashtagScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<Route>();
  const navigation = useNavigation<Nav>();

  const rawTag = route.params?.tag || '';
  const tag = rawTag.replace(/^#/, '').trim();

  const [hashtagData, setHashtagData] = useState<any>(null);
  const [videos, setVideos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadData = useCallback(async () => {
    if (!tag) return;
    try {
      const [infoRes, videosRes] = await Promise.allSettled([
        getHashtagInfo(tag),
        getVideosByHashtag(tag, { page: 1, limit: 30 }),
      ]);

      if (infoRes.status === 'fulfilled') {
        setHashtagData(infoRes.value.data.hashtag || infoRes.value.data);
      }
      if (videosRes.status === 'fulfilled') {
        setVideos(videosRes.value.data.videos || []);
      }
    } catch (err) {
      console.error('[HashtagScreen] load error:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [tag]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadData();
  }, [loadData]);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const videoCount = hashtagData?.videoCount ?? hashtagData?.count ?? videos.length;
  const viewCount = hashtagData?.viewCount ?? hashtagData?.views ?? 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* ── Top Header ── */}
      <View style={styles.topHeader}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <ArrowLeft size={22} color={Colors.white} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          #{tag}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      {/* ── Video Grid with Header Banner ── */}
      <VideoGrid
        videos={videos}
        onPress={(index) => {
          const v = videos[index];
          if (v) {
            navigation.navigate('VideoDetail', { videoId: v.id });
          }
        }}
        emptyText={`Chưa có video nào với #${tag}`}
        ListHeaderComponent={
          <View style={styles.banner}>
            <View style={styles.iconCircle}>
              <Hash size={32} color={Colors.primary} strokeWidth={2.5} />
            </View>

            <View style={styles.bannerInfo}>
              <Text style={styles.tagName}>#{tag}</Text>
              <View style={styles.statsRow}>
                <View style={styles.statItem}>
                  <Film size={14} color={Colors.textDim} />
                  <Text style={styles.statText}>
                    {formatCount(videoCount)} video
                  </Text>
                </View>

                {viewCount > 0 && (
                  <View style={styles.statItem}>
                    <Eye size={14} color={Colors.textDim} />
                    <Text style={styles.statText}>
                      {formatCount(viewCount)} lượt xem
                    </Text>
                  </View>
                )}
              </View>
            </View>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  topHeader: {
    height: 50,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.white,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 20,
    gap: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
    marginBottom: 8,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: 'rgba(255, 45, 120, 0.12)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 45, 120, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerInfo: {
    flex: 1,
  },
  tagName: {
    fontSize: 20,
    fontWeight: '800',
    color: Colors.white,
    marginBottom: 6,
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statText: {
    fontSize: 13,
    color: Colors.textDim,
    fontWeight: '500',
  },
});
