import React from 'react';
import { Tabs } from 'expo-router';
import { House, Search, PlusCircle, UserRound } from 'lucide-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppearance } from '../../lib/theme';

export default function TabLayout() {
  const { colors } = useAppearance();
  const insets = useSafeAreaInsets();
  return <Tabs screenOptions={{
    headerShown: false,
    tabBarActiveTintColor: colors.navy,
    tabBarInactiveTintColor: colors.subtle,
    tabBarStyle: {
      backgroundColor: colors.surface, borderTopColor: colors.line,
      height: 58 + insets.bottom, paddingTop: 5, paddingBottom: Math.max(insets.bottom, 7),
    },
    tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginBottom: 1 },
  }}>
    <Tabs.Screen name="index" options={{ title: 'Home', tabBarAccessibilityLabel: 'Home', tabBarIcon: ({ color, focused }) => <House color={color} size={22} strokeWidth={focused ? 2.2 : 1.7} /> }} />
    <Tabs.Screen name="explore" options={{ title: 'Explore', tabBarAccessibilityLabel: 'Explore campaigns', tabBarIcon: ({ color, focused }) => <Search color={color} size={22} strokeWidth={focused ? 2.2 : 1.7} /> }} />
    <Tabs.Screen name="create" options={{ title: 'Create', tabBarAccessibilityLabel: 'Create campaign', tabBarIcon: ({ color, focused }) => <PlusCircle color={color} size={22} strokeWidth={focused ? 2.2 : 1.7} /> }} />
    <Tabs.Screen name="profile" options={{ title: 'Profile', tabBarAccessibilityLabel: 'Your account', tabBarIcon: ({ color, focused }) => <UserRound color={color} size={22} strokeWidth={focused ? 2.2 : 1.7} /> }} />
  </Tabs>;
}

