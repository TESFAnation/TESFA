import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AppearanceProvider, useAppearance } from '../lib/theme';
import { AuthProvider } from '../lib/auth';

function Routes() {
  const { dark, colors } = useAppearance();
  return <>
    <StatusBar style={dark ? 'light' : 'dark'} />
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.page } }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="campaign/[id]" />
      <Stack.Screen name="donate" />
      <Stack.Screen name="auth" />
      <Stack.Screen name="drafts" />
      <Stack.Screen name="organization" />
    </Stack>
  </>;
}

export default function RootLayout() {
  return <AppearanceProvider><AuthProvider><Routes /></AuthProvider></AppearanceProvider>;
}
