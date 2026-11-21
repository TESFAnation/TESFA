import React from 'react';
import { Slot } from 'expo-router';
import { View } from 'react-native';
import { useAppearance } from '../../lib/theme';

export default function WebTabLayout() {
  const { colors } = useAppearance();
  return <View style={{ flex: 1, backgroundColor: colors.page }}>
    <Slot />
  </View>;
}
