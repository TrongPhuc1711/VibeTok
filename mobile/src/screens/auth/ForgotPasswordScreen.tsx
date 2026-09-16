/**
 * ForgotPasswordScreen — Gửi yêu cầu đặt lại mật khẩu qua email.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

import { forgotPassword } from '../../services/authService';
import { useToast } from '../../components/common/Toast';
import Button from '../../components/common/Button';
import { MailCheck, ArrowLeft } from 'lucide-react-native';
import { Colors } from '../../theme/colors';

export default function ForgotPasswordScreen() {
  const navigation = useNavigation();
  const { showSuccess, showError } = useToast();

  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async () => {
    if (!email.trim() || !email.includes('@')) {
      showError('Lỗi', 'Vui lòng nhập email hợp lệ');
      return;
    }

    setLoading(true);
    try {
      await forgotPassword(email.trim());
      setSent(true);
      showSuccess('Đã gửi!', 'Vui lòng kiểm tra hộp thư email của bạn');
    } catch (error: any) {
      showError('Thất bại', error.response?.data?.message || error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <View style={styles.content}>
        <Text style={styles.heading}>Quên mật khẩu?</Text>
        <Text style={styles.description}>
          Nhập email đã đăng ký, chúng tôi sẽ gửi mã OTP để đặt lại mật khẩu.
        </Text>

        {sent ? (
          <View style={styles.sentBox}>
            <MailCheck size={44} color={Colors.primary} strokeWidth={1.5} />
            <Text style={styles.sentText}>
              Đã gửi mã OTP đến {email}. Hãy kiểm tra hộp thư (và thư mục spam).
            </Text>
          </View>
        ) : (
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Email</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="vibetok@email.com"
              placeholderTextColor={Colors.textGhost}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        )}

        {!sent && (
          <Button
            title="Gửi mã xác nhận"
            onPress={handleSubmit}
            loading={loading}
            size="lg"
            fullWidth
          />
        )}

        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
          activeOpacity={0.7}
        >
          <ArrowLeft size={16} color={Colors.primary} />
          <Text style={styles.backText}>Quay lại đăng nhập</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 28,
    gap: 20,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  description: {
    fontSize: 14,
    color: Colors.textMuted,
    lineHeight: 20,
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
  sentBox: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 20,
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  sentIcon: {
    fontSize: 40,
  },
  sentText: {
    color: Colors.textSecondary,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  backButton: {
    alignSelf: 'center',
    marginTop: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  backText: {
    color: Colors.primary,
    fontSize: 14,
    fontWeight: '500',
  },
});
