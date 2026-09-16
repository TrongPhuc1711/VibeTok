/**
 * Navigation type definitions.
 * Tách riêng để các screen import type mà không circular dependency.
 */

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
};

export type MainTabParamList = {
  Home: undefined;
  Explore: undefined;
  Upload: undefined;
  Notifications: undefined;
  Profile: { username?: string } | undefined;
};

export type RootStackParamList = {
  MainTabs: undefined;
  UserProfile: { username: string };
  VideoDetail: { videoId: string };
};
