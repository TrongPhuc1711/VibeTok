/**
 * VideoGrid — grid thumbnail dạng 3 cột (dùng cho Explore + Profile).
 */

import React from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Image,
  Dimensions,
  StyleSheet,
} from 'react-native';
import { Film, Play } from 'lucide-react-native';
import { Colors } from '../theme/colors';
import { formatCount } from '../utils/formatters';

const { width: SCREEN_W } = Dimensions.get('window');
const GRID_GAP = 2;
const ITEM_W = (SCREEN_W - GRID_GAP * 2) / 3;
const ITEM_H = ITEM_W * 1.4;

interface VideoGridItem {
  id: string;
  thumbnail?: string;
  videoUrl?: string;
  views?: number;
  likes?: number;
  caption?: string;
}

interface VideoGridProps {
  videos: VideoGridItem[];
  onPress: (index: number) => void;
  loading?: boolean;
  emptyText?: string;
  ListHeaderComponent?: React.ReactElement;
  scrollEnabled?: boolean;
}

export default function VideoGrid({
  videos,
  onPress,
  loading = false,
  emptyText = 'Chưa có video nào',
  ListHeaderComponent,
  scrollEnabled = true,
}: VideoGridProps) {
  const renderItem = ({ item, index }: { item: VideoGridItem; index: number }) => {
    let thumbUri = item.thumbnail;
    if (typeof thumbUri === 'string' && thumbUri.trim().startsWith('[')) {
      try {
        const arr = JSON.parse(thumbUri);
        if (Array.isArray(arr) && arr.length > 0) thumbUri = arr[0];
      } catch {
        thumbUri = item.thumbnail;
      }
    } else if (!thumbUri && typeof item.videoUrl === 'string' && item.videoUrl.trim().startsWith('[')) {
      try {
        const arr = JSON.parse(item.videoUrl);
        if (Array.isArray(arr) && arr.length > 0) thumbUri = arr[0];
      } catch {
        thumbUri = undefined;
      }
    }

    return (
      <TouchableOpacity
        style={styles.item}
        activeOpacity={0.8}
        onPress={() => onPress(index)}
      >
        {thumbUri ? (
          <Image
            source={{ uri: thumbUri }}
            style={styles.thumbnail}
            resizeMode="cover"
          />
        ) : (
          <View style={[styles.thumbnail, styles.placeholderBg]}>
            <Film size={28} color={Colors.textDim} strokeWidth={1.5} />
          </View>
        )}

        {/* Views overlay */}
        <View style={styles.viewsOverlay}>
          <Play size={10} color={Colors.white} fill={Colors.white} />
          <Text style={styles.viewsText}>
            {formatCount(item.views ?? 0)}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <FlatList
      data={videos}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      numColumns={3}
      columnWrapperStyle={styles.row}
      ListHeaderComponent={ListHeaderComponent}
      ListEmptyComponent={
        !loading ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{emptyText}</Text>
          </View>
        ) : null
      }
      showsVerticalScrollIndicator={false}
      contentContainerStyle={styles.list}
      scrollEnabled={scrollEnabled}
    />
  );
}

const styles = StyleSheet.create({
  list: {
    flexGrow: 1,
  },
  row: {
    gap: GRID_GAP,
    marginBottom: GRID_GAP,
  },
  item: {
    width: ITEM_W,
    height: ITEM_H,
    position: 'relative',
    backgroundColor: Colors.surface,
  },
  thumbnail: {
    width: '100%',
    height: '100%',
  },
  placeholderBg: {
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 28,
    opacity: 0.3,
  },
  viewsOverlay: {
    position: 'absolute',
    left: 4,
    bottom: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  viewsText: {
    color: Colors.white,
    fontSize: 11,
    fontWeight: '600',
    textShadowColor: 'rgba(0,0,0,0.8)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
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
