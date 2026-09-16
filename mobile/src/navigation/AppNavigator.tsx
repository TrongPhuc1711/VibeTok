/**
 * AppNavigator — điều phối toàn bộ luồng màn hình.
 *
 * - Chưa đăng nhập: AuthStack (Login → Register → ForgotPassword)
 * - Đã đăng nhập: BottomTab (Home, Explore, Upload, Notifications, Profile)
 *                  + RootStack (UserProfile)
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { useAuthContext } from '../contexts/AuthContext';
import LoadingSpinner from '../components/common/LoadingSpinner';
import { Colors } from '../theme/colors';

// Auth screens
import LoginScreen from '../screens/auth/LoginScreen';
import RegisterScreen from '../screens/auth/RegisterScreen';
import ForgotPasswordScreen from '../screens/auth/ForgotPasswordScreen';

// Main screens
import HomeScreen from '../screens/HomeScreen';
import ExploreScreen from '../screens/ExploreScreen';
import UploadScreen from '../screens/UploadScreen';
import NotificationScreen from '../screens/NotificationScreen';
import ProfileScreen from '../screens/ProfileScreen';
import VideoDetailScreen from '../screens/VideoDetailScreen';
import HashtagScreen from '../screens/HashtagScreen';

import type {
  AuthStackParamList,
  MainTabParamList,
  RootStackParamList,
} from './types';

import { Home, Compass, Plus, Bell, User } from 'lucide-react-native';

// ── Stacks ──
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// ── Tab config ──
const TAB_CONFIG: Record<
  keyof MainTabParamList,
  {
    icon: (props: { color: string; focused: boolean; size: number }) => React.ReactNode;
    label: string;
  }
> = {
  Home: {
    icon: ({ color, focused, size }) => (
      <Home size={size} color={color} strokeWidth={focused ? 2.4 : 1.8} />
    ),
    label: 'Trang chủ',
  },
  Explore: {
    icon: ({ color, focused, size }) => (
      <Compass size={size} color={color} strokeWidth={focused ? 2.4 : 1.8} />
    ),
    label: 'Khám phá',
  },
  Upload: {
    icon: () => (
      <Plus size={22} color={Colors.white} strokeWidth={2.6} />
    ),
    label: '',
  },
  Notifications: {
    icon: ({ color, focused, size }) => (
      <Bell size={size} color={color} strokeWidth={focused ? 2.4 : 1.8} />
    ),
    label: 'Thông báo',
  },
  Profile: {
    icon: ({ color, focused, size }) => (
      <User size={size} color={color} strokeWidth={focused ? 2.4 : 1.8} />
    ),
    label: 'Hồ sơ',
  },
};

// ── Auth Navigator ──
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
        animation: 'slide_from_right',
      }}
    >
      <AuthStack.Screen name="Login" component={LoginScreen} />
      <AuthStack.Screen name="Register" component={RegisterScreen} />
      <AuthStack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
    </AuthStack.Navigator>
  );
}

// ── Main Tab Navigator ──
function MainTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => {
        const config = TAB_CONFIG[route.name];
        return {
          headerShown: false,
          tabBarStyle: styles.tabBar,
          tabBarActiveTintColor: Colors.textPrimary,
          tabBarInactiveTintColor: Colors.textDim,
          tabBarLabelStyle: styles.tabLabel,
          tabBarLabel: route.name === 'Upload' ? () => null : config.label,
          tabBarIcon: ({ focused, color }) => {
            const isUpload = route.name === 'Upload';
            return (
              <View style={isUpload ? styles.uploadIconWrap : undefined}>
                {config.icon({ color, focused, size: 22 })}
              </View>
            );
          },
        };
      }}
    >
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen name="Explore" component={ExploreScreen} />
      <Tab.Screen
        name="Upload"
        component={UploadScreen}
        options={{
          tabBarLabel: () => null,
        }}
      />
      <Tab.Screen name="Notifications" component={NotificationScreen} />
      <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
  );
}

// ── Root Navigator (tabs + modal screens) ──
function RootNavigator() {
  return (
    <RootStack.Navigator
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.background },
      }}
    >
      <RootStack.Screen name="MainTabs" component={MainTabNavigator} />
      <RootStack.Screen
        name="UserProfile"
        component={ProfileScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <RootStack.Screen
        name="VideoDetail"
        component={VideoDetailScreen}
        options={{ animation: 'slide_from_right' }}
      />
      <RootStack.Screen
        name="Hashtag"
        component={HashtagScreen}
        options={{ animation: 'slide_from_right' }}
      />
    </RootStack.Navigator>
  );
}

// ── Main Export ──
export default function AppNavigator() {
  const { isAuthenticated, loading } = useAuthContext();

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <NavigationContainer>
      {isAuthenticated ? <RootNavigator /> : <AuthNavigator />}
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.background,
    borderTopColor: Colors.border,
    borderTopWidth: 0.5,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  uploadIconWrap: {
    backgroundColor: Colors.primary,
    width: 40,
    height: 28,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
