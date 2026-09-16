/**
 * EditProfileModal — Modal chỉnh sửa thông tin cá nhân:
 * - Đổi ảnh đại diện (ImagePicker)
 * - Đổi tên hiển thị (Full Name)
 * - Đổi tiểu sử (Bio)
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Modal,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as ImagePicker from 'expo-image-picker';
import { Camera, X } from 'lucide-react-native';

import Avatar from './common/Avatar';
import Button from './common/Button';
import { useToast } from './common/Toast';
import { useAuthContext } from '../contexts/AuthContext';
import { updateProfile, updateAvatar } from '../services/userService';
import { Colors } from '../theme/colors';

interface EditProfileModalProps {
  visible: boolean;
  onClose: () => void;
  profile: {
    fullName?: string;
    tieu_su?: string;
    anh_dai_dien?: string;
    initials?: string;
    username: string;
  };
  onProfileUpdated: () => void;
}

export default function EditProfileModal({
  visible,
  onClose,
  profile,
  onProfileUpdated,
}: EditProfileModalProps) {
  const insets = useSafeAreaInsets();
  const { updateUser } = useAuthContext();
  const { showSuccess, showError } = useToast();

  const [fullName, setFullName] = useState(profile.fullName || '');
  const [bio, setBio] = useState(profile.tieu_su || '');
  const [avatarUri, setAvatarUri] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // Chọn ảnh từ thư viện
  const handlePickAvatar = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showError('Cần quyền truy cập', 'Vui lòng cấp quyền truy cập ảnh trong cài đặt');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      let newAvatarUrl: string | undefined;

      // 1. Upload avatar nếu có đổi
      if (avatarUri) {
        const formDataFile = {
          uri: avatarUri,
          name: 'avatar.jpg',
          type: 'image/jpeg',
        };
        const res = await updateAvatar(formDataFile);
        newAvatarUrl = res.data?.avatar || res.data?.user?.anh_dai_dien;
      }

      // 2. Update info
      await updateProfile({
        full_name: fullName.trim(),
        bio: bio.trim(),
      });

      // 3. Update local auth context
      updateUser({
        fullName: fullName.trim(),
        ...(newAvatarUrl && { anh_dai_dien: newAvatarUrl }),
      });

      showSuccess('Thành công', 'Đã cập nhật hồ sơ cá nhân');
      onProfileUpdated();
      onClose();
    } catch (err: any) {
      showError('Lỗi cập nhật', err.response?.data?.message || err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.closeButton} activeOpacity={0.7}>
            <X size={22} color={Colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Chỉnh sửa hồ sơ</Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={styles.saveButton}
            activeOpacity={0.7}
          >
            {saving ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : (
              <Text style={styles.saveText}>Lưu</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <TouchableOpacity
              style={styles.avatarWrapper}
              onPress={handlePickAvatar}
              activeOpacity={0.8}
            >
              {avatarUri ? (
                <Image source={{ uri: avatarUri }} style={styles.avatarPreview} />
              ) : (
                <Avatar
                  uri={profile.anh_dai_dien}
                  initials={profile.initials}
                  size={96}
                />
              )}
              <View style={styles.cameraBadge}>
                <Camera size={18} color={Colors.white} />
              </View>
            </TouchableOpacity>
            <TouchableOpacity onPress={handlePickAvatar} style={styles.changePhotoBtn}>
              <Text style={styles.changePhotoText}>Thay đổi ảnh đại diện</Text>
            </TouchableOpacity>
          </View>

          {/* Form inputs */}
          <View style={styles.form}>
            {/* Username (read only) */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên người dùng</Text>
              <TextInput
                style={[styles.input, styles.inputDisabled]}
                value={`@${profile.username}`}
                editable={false}
              />
              <Text style={styles.hint}>Tên người dùng là duy nhất và không thể thay đổi</Text>
            </View>

            {/* Full name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tên hiển thị</Text>
              <TextInput
                style={styles.input}
                value={fullName}
                onChangeText={setFullName}
                placeholder="Tên của bạn"
                placeholderTextColor={Colors.textGhost}
                maxLength={50}
              />
            </View>

            {/* Bio */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Tiểu sử</Text>
              <TextInput
                style={[styles.input, styles.bioInput]}
                value={bio}
                onChangeText={setBio}
                placeholder="Thêm tiểu sử giới thiệu bản thân..."
                placeholderTextColor={Colors.textGhost}
                multiline
                maxLength={200}
                textAlignVertical="top"
              />
              <Text style={styles.charCount}>{bio.length}/200</Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: Colors.border,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  saveButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
  },
  saveText: {
    color: Colors.primary,
    fontSize: 16,
    fontWeight: '700',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingVertical: 24,
    gap: 28,
  },
  avatarSection: {
    alignItems: 'center',
    gap: 12,
  },
  avatarWrapper: {
    position: 'relative',
  },
  avatarPreview: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 2,
    borderColor: Colors.border,
  },
  cameraBadge: {
    position: 'absolute',
    right: 0,
    bottom: 0,
    backgroundColor: Colors.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.background,
  },
  changePhotoBtn: {
    paddingVertical: 4,
  },
  changePhotoText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
  form: {
    gap: 18,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '600',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  inputDisabled: {
    opacity: 0.6,
    color: Colors.textDim,
  },
  bioInput: {
    height: 100,
    paddingTop: 12,
  },
  hint: {
    color: Colors.textDim,
    fontSize: 11,
  },
  charCount: {
    color: Colors.textDim,
    fontSize: 11,
    textAlign: 'right',
  },
});
