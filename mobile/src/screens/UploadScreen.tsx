/**
 * UploadScreen — Đăng video hoặc Album ảnh (Slideshow) lên VibeTok.
 */

import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  StyleSheet,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Video as VideoIcon, Image as ImageIcon, Plus, X } from 'lucide-react-native';

import Button from '../components/common/Button';
import { useToast } from '../components/common/Toast';
import { uploadVideo } from '../services/videoService';
import { Colors } from '../theme/colors';
import {
  MAX_CAPTION_LENGTH,
  VIDEO_PRIVACY,
  VIDEO_PRIVACY_LABELS,
} from '../constants';

type UploadMode = 'video' | 'images';
type Privacy = 'public' | 'friends' | 'private';

export default function UploadScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { showSuccess, showError } = useToast();

  const [mode, setMode] = useState<UploadMode>('video');
  const [videoUri, setVideoUri] = useState<string | null>(null);
  const [imageUris, setImageUris] = useState<string[]>([]);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [caption, setCaption] = useState('');
  const [privacy, setPrivacy] = useState<Privacy>('public');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const previewPlayer = useVideoPlayer(videoUri || '', (player) => {
    player.muted = true;
    player.loop = true;
    if (videoUri) {
      player.play();
    }
  });

  useEffect(() => {
    if (videoUri && previewPlayer) {
      previewPlayer.play();
    }
  }, [videoUri, previewPlayer]);

  // Pick video from gallery
  const pickVideo = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Cần quyền truy cập',
        'Vui lòng cho phép truy cập thư viện ảnh/video trong cài đặt.',
      );
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['videos'],
      quality: 1,
      videoMaxDuration: 180,
    });

    if (!result.canceled && result.assets[0]) {
      setVideoUri(result.assets[0].uri);
    }
  }, []);

  // Pick images from gallery (up to 10)
  const pickImages = useCallback(async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert(
        'Cần quyền truy cập',
        'Vui lòng cho phép truy cập thư viện ảnh trong cài đặt.',
      );
      return;
    }

    const maxCanPick = Math.max(1, 10 - imageUris.length);
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: maxCanPick,
      quality: 0.85,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const newUris = result.assets.map((a) => a.uri);
      setImageUris((prev) => [...prev, ...newUris].slice(0, 10));
    }
  }, [imageUris.length]);

  // Remove single image
  const removeImage = useCallback((index: number) => {
    setImageUris((prev) => {
      const next = prev.filter((_, idx) => idx !== index);
      if (activeImageIndex >= next.length) {
        setActiveImageIndex(Math.max(0, next.length - 1));
      }
      return next;
    });
  }, [activeImageIndex]);

  // Upload
  const handleUpload = useCallback(async () => {
    if (mode === 'video' && !videoUri) {
      showError('Lỗi', 'Vui lòng chọn video trước');
      return;
    }
    if (mode === 'images' && imageUris.length === 0) {
      showError('Lỗi', 'Vui lòng chọn ít nhất 1 ảnh');
      return;
    }

    setUploading(true);
    setProgress(0);

    try {
      const formData = new FormData();

      if (mode === 'video' && videoUri) {
        formData.append('video', {
          uri: videoUri,
          type: 'video/mp4',
          name: 'upload.mp4',
        } as any);
      } else if (mode === 'images' && imageUris.length > 0) {
        imageUris.forEach((uri, idx) => {
          formData.append('images', {
            uri,
            type: 'image/jpeg',
            name: `photo_${idx}.jpg`,
          } as any);
        });
      }

      formData.append('caption', caption);
      formData.append('privacy', privacy);

      await uploadVideo(formData, (pct) => setProgress(pct));

      showSuccess(
        'Upload thành công!',
        mode === 'video' ? 'Video của bạn đang được xử lý' : 'Album ảnh của bạn đang được xử lý',
      );

      // Reset form
      setVideoUri(null);
      setImageUris([]);
      setActiveImageIndex(0);
      setCaption('');
      setPrivacy('public');
      setProgress(0);

      // Chuyển về Home feed
      setTimeout(() => {
        (navigation as any).navigate('Home');
      }, 600);
    } catch (error: any) {
      showError(
        'Upload thất bại',
        error.response?.data?.message || error.message,
      );
    } finally {
      setUploading(false);
    }
  }, [mode, videoUri, imageUris, caption, privacy, showSuccess, showError, navigation]);

  const hasMedia = mode === 'video' ? Boolean(videoUri) : imageUris.length > 0;

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <Text style={styles.heading}>Đăng nội dung mới</Text>

      {/* Mode switcher: Video vs Slideshow */}
      <View style={styles.modeSwitchWrap}>
        <TouchableOpacity
          style={[styles.modeTab, mode === 'video' && styles.modeTabActive]}
          onPress={() => setMode('video')}
          activeOpacity={0.8}
        >
          <VideoIcon
            size={18}
            color={mode === 'video' ? Colors.white : Colors.textMuted}
          />
          <Text
            style={[styles.modeTabText, mode === 'video' && styles.modeTabTextActive]}
          >
            Video
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.modeTab, mode === 'images' && styles.modeTabActive]}
          onPress={() => setMode('images')}
          activeOpacity={0.8}
        >
          <ImageIcon
            size={18}
            color={mode === 'images' ? Colors.white : Colors.textMuted}
          />
          <Text
            style={[styles.modeTabText, mode === 'images' && styles.modeTabTextActive]}
          >
            Ảnh (Slideshow)
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {/* ── Mode 1: Video ── */}
        {mode === 'video' && (
          <>
            {videoUri ? (
              <View style={styles.previewContainer}>
                <VideoView
                  player={previewPlayer}
                  style={styles.preview}
                  contentFit="cover"
                  nativeControls={false}
                />
                <View style={styles.changeOverlay}>
                  <TouchableOpacity
                    style={styles.overlayBtn}
                    onPress={pickVideo}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.overlayBtnText}>Đổi video</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.overlayBtn, styles.overlayBtnDanger]}
                    onPress={() => setVideoUri(null)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.overlayBtnDangerText}>✕ Xóa</Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.picker}
                onPress={pickVideo}
                activeOpacity={0.8}
              >
                <View style={styles.pickerPlaceholder}>
                  <VideoIcon size={48} color={Colors.textMuted} strokeWidth={1.5} />
                  <Text style={styles.pickerText}>Chọn video từ thư viện</Text>
                  <Text style={styles.pickerHint}>Tối đa 3 phút (MP4, MOV)</Text>
                </View>
              </TouchableOpacity>
            )}
          </>
        )}

        {/* ── Mode 2: Slideshow Ảnh ── */}
        {mode === 'images' && (
          <View style={styles.imagesSection}>
            {imageUris.length > 0 ? (
              <View>
                {/* Main image preview */}
                <View style={styles.previewContainer}>
                  <Image
                    source={{ uri: imageUris[activeImageIndex] || imageUris[0] }}
                    style={styles.preview}
                    resizeMode="cover"
                  />
                  <View style={styles.badgeTop}>
                    <Text style={styles.badgeText}>
                      Ảnh {activeImageIndex + 1}/{imageUris.length}
                    </Text>
                  </View>
                </View>

                {/* Thumbnails strip */}
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  contentContainerStyle={styles.thumbsStrip}
                >
                  {imageUris.map((uri, idx) => {
                    const isActive = idx === activeImageIndex;
                    return (
                      <View key={uri + idx} style={styles.thumbWrapper}>
                        <TouchableOpacity
                          onPress={() => setActiveImageIndex(idx)}
                          style={[
                            styles.thumbItem,
                            isActive && styles.thumbItemActive,
                          ]}
                          activeOpacity={0.8}
                        >
                          <Image source={{ uri }} style={styles.thumbImage} />
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={styles.removeThumbBadge}
                          onPress={() => removeImage(idx)}
                          activeOpacity={0.7}
                        >
                          <X size={12} color={Colors.white} />
                        </TouchableOpacity>
                      </View>
                    );
                  })}

                  {/* Add more button */}
                  {imageUris.length < 10 && (
                    <TouchableOpacity
                      style={styles.addThumbBtn}
                      onPress={pickImages}
                      activeOpacity={0.7}
                    >
                      <Plus size={20} color={Colors.textMuted} />
                      <Text style={styles.addThumbText}>Thêm</Text>
                    </TouchableOpacity>
                  )}
                </ScrollView>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.picker}
                onPress={pickImages}
                activeOpacity={0.8}
              >
                <View style={styles.pickerPlaceholder}>
                  <ImageIcon size={48} color={Colors.textMuted} strokeWidth={1.5} />
                  <Text style={styles.pickerText}>Chọn ảnh từ thư viện</Text>
                  <Text style={styles.pickerHint}>Tối đa 10 ảnh để tạo Album vuốt ngang</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Caption */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Mô tả</Text>
          <TextInput
            style={styles.captionInput}
            value={caption}
            onChangeText={setCaption}
            placeholder="Viết mô tả cho bài đăng... #hashtag @mention"
            placeholderTextColor={Colors.textGhost}
            multiline
            maxLength={MAX_CAPTION_LENGTH}
            textAlignVertical="top"
          />
          <Text style={styles.charCount}>
            {caption.length}/{MAX_CAPTION_LENGTH}
          </Text>
        </View>

        {/* Privacy */}
        <View style={styles.inputGroup}>
          <Text style={styles.label}>Ai có thể xem</Text>
          <View style={styles.privacyRow}>
            {Object.entries(VIDEO_PRIVACY_LABELS).map(([key, label]) => (
              <TouchableOpacity
                key={key}
                style={[
                  styles.privacyOption,
                  privacy === key && styles.privacyOptionActive,
                ]}
                onPress={() => setPrivacy(key as Privacy)}
              >
                <Text
                  style={[
                    styles.privacyText,
                    privacy === key && styles.privacyTextActive,
                  ]}
                >
                  {label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Progress bar */}
        {uploading && (
          <View style={styles.progressContainer}>
            <View style={styles.progressTrack}>
              <View
                style={[styles.progressBar, { width: `${progress}%` }]}
              />
            </View>
            <Text style={styles.progressText}>{progress}%</Text>
          </View>
        )}

        {/* Upload button */}
        <Button
          title={
            uploading
              ? 'Đang tải lên...'
              : mode === 'video'
                ? 'Đăng video'
                : `Đăng album ảnh (${imageUris.length} ảnh)`
          }
          onPress={handleUpload}
          loading={uploading}
          disabled={!hasMedia}
          size="lg"
          fullWidth
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  heading: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    textAlign: 'center',
    paddingVertical: 12,
  },
  modeSwitchWrap: {
    flexDirection: 'row',
    marginHorizontal: 20,
    marginBottom: 16,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    padding: 3,
  },
  modeTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    borderRadius: 8,
  },
  modeTabActive: {
    backgroundColor: Colors.primary,
  },
  modeTabText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  modeTabTextActive: {
    color: Colors.white,
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    gap: 18,
  },
  imagesSection: {
    gap: 12,
  },
  picker: {
    width: '100%',
    height: 240,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pickerPlaceholder: {
    alignItems: 'center',
    gap: 8,
  },
  pickerText: {
    color: Colors.textPrimary,
    fontSize: 15,
    fontWeight: '600',
  },
  pickerHint: {
    color: Colors.textMuted,
    fontSize: 12,
  },
  previewContainer: {
    width: '100%',
    height: 320,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: Colors.black,
    position: 'relative',
  },
  preview: {
    width: '100%',
    height: '100%',
  },
  badgeTop: {
    position: 'absolute',
    top: 12,
    right: 12,
    backgroundColor: 'rgba(0,0,0,0.65)',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    color: Colors.white,
    fontSize: 12,
    fontWeight: '600',
  },
  changeOverlay: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 12,
  },
  overlayBtn: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  overlayBtnText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  overlayBtnDanger: {
    backgroundColor: 'rgba(239, 68, 68, 0.75)',
    borderColor: Colors.error,
  },
  overlayBtnDangerText: {
    color: Colors.white,
    fontSize: 13,
    fontWeight: '600',
  },
  thumbsStrip: {
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 8,
  },
  thumbWrapper: {
    position: 'relative',
  },
  thumbItem: {
    width: 64,
    height: 64,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbItemActive: {
    borderColor: Colors.primary,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  removeThumbBadge: {
    position: 'absolute',
    top: -5,
    right: -5,
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addThumbBtn: {
    width: 64,
    height: 64,
    borderRadius: 8,
    borderWidth: 1.5,
    borderColor: Colors.border,
    borderStyle: 'dashed',
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  addThumbText: {
    color: Colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
  },
  inputGroup: {
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  captionInput: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 14,
    color: Colors.textPrimary,
    fontSize: 14,
    minHeight: 90,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  charCount: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'right',
  },
  privacyRow: {
    flexDirection: 'row',
    gap: 8,
  },
  privacyOption: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  privacyOptionActive: {
    borderColor: Colors.primary,
    backgroundColor: 'rgba(255, 43, 83, 0.1)',
  },
  privacyText: {
    color: Colors.textMuted,
    fontSize: 13,
    fontWeight: '500',
  },
  privacyTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  progressContainer: {
    gap: 6,
  },
  progressTrack: {
    height: 6,
    backgroundColor: Colors.surface,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 3,
  },
  progressText: {
    color: Colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
  },
});
