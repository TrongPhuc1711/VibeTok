/**
 * VibeTok Mobile — Entry point.
 *
 * Bọc toàn app trong:
 * 1. SafeAreaProvider (xử lý notch/dynamic island)
 * 2. GestureHandlerRootView (gesture support)
 * 3. AuthProvider (quản lý đăng nhập)
 * 4. ToastProvider (thông báo nhanh)
 * 5. AppNavigator (điều hướng)
 */

import React from 'react';
import { StyleSheet } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { AuthProvider } from './src/contexts/AuthContext';
import { ToastProvider } from './src/components/common/Toast';
import AppNavigator from './src/navigation/AppNavigator';

export default function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AuthProvider>
          <ToastProvider>
            <StatusBar style="light" />
            <AppNavigator />
          </ToastProvider>
        </AuthProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
});
