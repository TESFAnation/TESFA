import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { View } from 'react-native';
import { WebHeader } from '../components/web-layout';
import { AppearanceProvider, useAppearance } from '../lib/theme';
import { AuthProvider } from '../lib/auth';

function BrowserRoutes() {
  const { dark, colors } = useAppearance();
  return <View style={{ flex: 1, backgroundColor: colors.page }}>
    <StatusBar style={dark ? 'light' : 'dark'} />
    <WebHeader />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="campaign/[id]" />
      <Stack.Screen name="donate" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="reset-password" />
      <Stack.Screen name="drafts" />
      <Stack.Screen name="organization" />
      <Stack.Screen name="saved" />
      <Stack.Screen name="report" />
      <Stack.Screen name="updates" />
      <Stack.Screen name="how-it-works" />
    </Stack>
  </View>;
}

export default function BrowserRootLayout() {
  return <AppearanceProvider><AuthProvider><BrowserRoutes /></AuthProvider></AppearanceProvider>;
}
