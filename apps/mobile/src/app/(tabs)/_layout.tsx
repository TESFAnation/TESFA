import React from 'react';
import { Tabs } from 'expo-router';
import { Platform } from 'react-native';
import { House, Search, PlusCircle, UserRound } from 'lucide-react-native';
import { useAppearance } from '../../lib/theme';

export default function TabLayout() {
  const { colors } = useAppearance();
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.navy,
    tabBarInactiveTintColor: colors.subtle,
    tabBarStyle: {
      backgroundColor: colors.surface, borderTopColor: colors.line, height: 64, paddingTop: 4,
      ...(Platform.OS === 'web' ? { maxWidth: 800, width: '100%', alignSelf: 'center' as const } : {}),
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 5 },
  }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: ({ color }) => <House color={color} size={21} strokeWidth={1.8} /> }} />
    <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarIcon: ({ color }) => <Search color={color} size={21} strokeWidth={1.8} /> }} />
    <Tabs.Screen name="create" options={{ title: 'Create', tabBarIcon: ({ color }) => <PlusCircle color={color} size={21} strokeWidth={1.8} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarIcon: ({ color }) => <UserRound color={color} size={21} strokeWidth={1.8} /> }} />
  </Tabs>;
}

