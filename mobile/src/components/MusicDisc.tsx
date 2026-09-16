/**
 * MusicDisc — Đĩa than xoay tròn phát nhạc góc dưới bên phải (chuẩn TikTok/VibeTok Web).
 */

import React, { useEffect, useRef } from 'react';
import {
  View,
  Image,
  Animated,
  Easing,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Disc3, Music } from 'lucide-react-native';
import { Colors } from '../theme/colors';

interface MusicDiscProps {
  track?: {
    title: string;
    artist: string;
    cover?: string;
  } | null;
  isPlaying?: boolean;
  onPress?: () => void;
}

export default function MusicDisc({
  track,
  isPlaying = true,
  onPress,
}: MusicDiscProps) {
  const spinValue = useRef(new Animated.Value(0)).current;
  const animationRef = useRef<Animated.CompositeAnimation | null>(null);

  useEffect(() => {
    if (isPlaying) {
      animationRef.current = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 5000,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      );
      animationRef.current.start();
    } else {
      animationRef.current?.stop();
    }

    return () => {
      animationRef.current?.stop();
    };
  }, [isPlaying, spinValue]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const coverUrl = track?.cover || null;

  return (
    <TouchableOpacity
      activeOpacity={0.8}
      onPress={onPress}
      style={styles.container}
    >
      <Animated.View
        style={[
          styles.disc,
          {
            transform: [{ rotate: spin }],
          },
        ]}
      >
        {/* Outer vinyl ring */}
        <View style={styles.vinylRing}>
          {coverUrl ? (
            <Image source={{ uri: coverUrl }} style={styles.coverImage} />
          ) : (
            <View style={styles.discPlaceholder}>
              <Disc3 size={24} color={Colors.white} />
            </View>
          )}

          {/* Inner center hole */}
          <View style={styles.centerHole} />
        </View>
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  disc: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#0A0A0E',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#262630',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
    elevation: 4,
  },
  vinylRing: {
    width: 38,
    height: 38,
    borderRadius: 19,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#16161D',
  },
  coverImage: {
    width: '100%',
    height: '100%',
    borderRadius: 19,
  },
  discPlaceholder: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#20162B',
  },
  centerHole: {
    position: 'absolute',
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: Colors.background,
    borderWidth: 1.5,
    borderColor: '#404050',
  },
});
