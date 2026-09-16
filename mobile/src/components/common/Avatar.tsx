/**
 * Avatar tái sử dụng — hiển thị ảnh đại diện tròn,
 * fallback chữ viết tắt (initials) khi không có ảnh.
 */

import React, { useState } from 'react';
import { View, Text, Image, StyleSheet } from 'react-native';
import { Colors } from '../../theme/colors';

interface AvatarProps {
  uri?: string | null;
  initials?: string;
  size?: number;
  borderColor?: string;
}

export default function Avatar({
  uri,
  initials = 'U',
  size = 40,
  borderColor,
}: AvatarProps) {
  const [failed, setFailed] = useState(false);
  const showImage = !!uri && !failed;

  const containerStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
    ...(borderColor && { borderWidth: 2, borderColor }),
  };

  if (showImage) {
    return (
      <Image
        source={{ uri }}
        style={[styles.image, containerStyle]}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <View style={[styles.fallback, containerStyle]}>
      <Text style={[styles.initials, { fontSize: size * 0.38 }]}>
        {initials}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  image: {
    backgroundColor: Colors.surface,
  },
  fallback: {
    backgroundColor: Colors.elevated,
    alignItems: 'center',
    justifyContent: 'center',
  },
  initials: {
    color: Colors.textMuted,
    fontWeight: '700',
  },
});
