/**
 * RegisterScreen — Đăng ký tài khoản mới.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { register } from '../../services/authService';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import { Colors } from '../../theme/colors';
import { MIN_PASSWORD_LENGTH } from '../../constants';
import type { AuthStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<AuthStackParamList, 'Register'>;

export default function RegisterScreen() {
  const navigation = useNavigation<Nav>();
  const { showSuccess, showError } = useToast();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const validate = (): boolean => {
    if (!fullName.trim()) {
      showError('Lỗi', 'Vui lòng nhập tên hiển thị');
      return false;
    }
    if (!email.trim() || !email.includes('@')) {
      showError('Lỗi', 'Email không hợp lệ');
      return false;
    }
    if (password.length < MIN_PASSWORD_LENGTH) {
      showError('Lỗi', `Mật khẩu phải có ít nhất ${MIN_PASSWORD_LENGTH} ký tự`);
      return false;
    }
    if (password !== confirmPassword) {
      showError('Lỗi', 'Mật khẩu xác nhận không khớp');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      await register({ fullName: fullName.trim(), email: email.trim(), password });
      showSuccess('Đăng ký thành công!', 'Vui lòng đăng nhập để tiếp tục');
      navigation.navigate('Login');
    } catch (error: any) {
      showError('Đăng ký thất bại', error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.logo}>VibeTok</Text>
          <Text style={styles.heading}>Tạo tài khoản mới</Text>
          <Text style={styles.subheading}>
            Tham gia cộng đồng sáng tạo video ngắn
          </Text>
        </View>

        {/* Form */}
        <View style={styles.form}>
          <InputField
            label="Tên hiển thị"
            value={fullName}
            onChangeText={setFullName}
            placeholder="Nguyễn Văn A"
          />
          <InputField
            label="Email"
            value={email}
            onChangeText={setEmail}
            placeholder="vibetok@email.com"
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <InputField
            label="Mật khẩu"
            value={password}
            onChangeText={setPassword}
            placeholder="Ít nhất 8 ký tự"
            secureTextEntry
          />
          <InputField
            label="Xác nhận mật khẩu"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Nhập lại mật khẩu"
            secureTextEntry
          />

          <Button
            title="Đăng ký"
            onPress={handleRegister}
            loading={loading}
            size="lg"
            fullWidth
          />

          <View style={styles.loginRow}>
            <Text style={styles.loginText}>Đã có tài khoản? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
              <Text style={styles.loginLink}>Đăng nhập</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

// ── Reusable input field (local) ──
function InputField({
  label,
  value,
  onChangeText,
  placeholder,
  secureTextEntry = false,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
}: {
  label: string;
  value: string;
  onChangeText: (t: string) => void;
  placeholder: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  autoCapitalize?: 'none' | 'sentences';
}) {
  return (
    <View style={styles.inputGroup}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={Colors.textGhost}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingVertical: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logo: {
    fontSize: 36,
    fontWeight: '900',
    color: Colors.primary,
    marginBottom: 16,
  },
  heading: {
    fontSize: 26,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  subheading: {
    fontSize: 14,
    color: Colors.textMuted,
    marginTop: 6,
  },
  form: {
    gap: 16,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  input: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 13,
    fontSize: 15,
    color: Colors.textPrimary,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 8,
  },
  loginText: {
    color: Colors.textMuted,
    fontSize: 14,
  },
  loginLink: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '600',
  },
});
