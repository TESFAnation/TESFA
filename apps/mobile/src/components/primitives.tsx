import React from 'react';
import { Pressable, ScrollView, Text, TextInput, View, type KeyboardTypeOptions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAppearance } from '../lib/theme';

export function Screen({ children }: { children: React.ReactNode }) {
  const { colors } = useAppearance();
  return <SafeAreaView style={{ flex: 1, backgroundColor: colors.page }} edges={['top']}>
    <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 22, paddingTop: 21, paddingBottom: 48, gap: 17 }}>
      {children}
    </ScrollView>
  </SafeAreaView>;
}
export function Txt({ children, size = 15, weight = '400', muted = false, style }: {
  children: React.ReactNode; size?: number; weight?: '400' | '500' | '600' | '700' | '800';
  muted?: boolean; style?: object;
}) {
  const { colors } = useAppearance();
  return <Text style={[{ color: muted ? colors.subtle : colors.text, fontSize: size, fontWeight: weight, lineHeight: size * 1.42 }, style]}>{children}</Text>;
}
export function Card({ children, style }: { children: React.ReactNode; style?: object }) {
  const { colors } = useAppearance();
  return <View style={[{ backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 16, padding: 18, gap: 9 }, style]}>{children}</View>;
}
export function Button({ label, onPress, disabled, outline = false }: {
  label: string; onPress: () => void; disabled?: boolean; outline?: boolean;
}) {
  const { colors } = useAppearance();
  return <Pressable accessibilityRole="button" disabled={disabled} onPress={onPress} style={{
    backgroundColor: outline ? colors.surface : '#173B63', borderColor: colors.line,
    borderWidth: outline ? 1 : 0, paddingVertical: 15, paddingHorizontal: 17,
    borderRadius: 11, opacity: disabled ? 0.55 : 1, alignItems: 'center',
  }}>
    <Text style={{ fontSize: 15, color: outline ? colors.text : '#FFFFFF', fontWeight: '700' }}>{label}</Text>
  </Pressable>;
}
export function Field({ label, value, onChangeText, placeholder, multiline, keyboardType, secureTextEntry }: {
  label: string; value: string; onChangeText: (next: string) => void; placeholder?: string;
  multiline?: boolean; keyboardType?: KeyboardTypeOptions; secureTextEntry?: boolean;
}) {
  const { colors } = useAppearance();
  return <View style={{ gap: 7 }}>
    <Txt size={13} weight="700">{label}</Txt>
    <TextInput
      accessibilityLabel={label} value={value} onChangeText={onChangeText}
      placeholder={placeholder} placeholderTextColor={colors.subtle}
      multiline={multiline} textAlignVertical={multiline ? 'top' : 'center'}
      keyboardType={keyboardType} secureTextEntry={secureTextEntry}
      autoCapitalize={keyboardType === 'email-address' ? 'none' : 'sentences'}
      style={{
        borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface,
        color: colors.text, borderRadius: 10, paddingHorizontal: 13, paddingVertical: 12,
        minHeight: multiline ? 120 : 47, fontSize: 15,
      }}
    />
  </View>;
}

