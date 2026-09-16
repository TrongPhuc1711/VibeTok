/**
 * Button tái sử dụng — primary / outline / ghost variants.
 * Hỗ trợ loading state.
 */

import React from 'react';
import {
  TouchableOpacity,
  Text,
  ActivityIndicator,
  StyleSheet,
  type ViewStyle,
  type TextStyle,
} from 'react-native';
import { Colors } from '../../theme/colors';

type Variant = 'primary' | 'outline' | 'ghost';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: Variant;
  size?: Size;
  loading?: boolean;
  disabled?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const HEIGHT: Record<Size, number> = { sm: 34, md: 44, lg: 52 };
const FONT: Record<Size, number> = { sm: 13, md: 14, lg: 16 };

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  fullWidth = false,
  style,
  textStyle,
}: ButtonProps) {
  const isDisabled = disabled || loading;

  const containerStyles = [
    styles.base,
    { height: HEIGHT[size], borderRadius: size === 'lg' ? 12 : 8 },
    variant === 'primary' ? styles.primary : undefined,
    variant === 'outline' ? styles.outline : undefined,
    variant === 'ghost' ? styles.ghost : undefined,
    fullWidth ? styles.fullWidth : undefined,
    isDisabled ? styles.disabled : undefined,
    style,
  ].filter(Boolean) as ViewStyle[];

  const labelStyles = [
    styles.label,
    { fontSize: FONT[size] },
    variant === 'primary' ? styles.labelPrimary : undefined,
    variant === 'outline' ? styles.labelOutline : undefined,
    variant === 'ghost' ? styles.labelGhost : undefined,
    textStyle,
  ].filter(Boolean) as TextStyle[];

  return (
    <TouchableOpacity
      style={containerStyles}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={variant === 'primary' ? Colors.white : Colors.primary}
        />
      ) : (
        <Text style={labelStyles}>{title}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  primary: {
    backgroundColor: Colors.primary,
  },
  outline: {
    backgroundColor: Colors.transparent,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  ghost: {
    backgroundColor: Colors.transparent,
  },
  fullWidth: {
    width: '100%',
  },
  disabled: {
    opacity: 0.5,
  },
  label: {
    fontWeight: '600',
  },
  labelPrimary: {
    color: Colors.white,
  },
  labelOutline: {
    color: Colors.textSecondary,
  },
  labelGhost: {
    color: Colors.textMuted,
  },
});
