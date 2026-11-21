import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ChevronRight, LogOut } from 'lucide-react-native';
import { Button, Card, Screen, Txt } from '../../components/primitives';
import { useAppearance, type ThemeChoice } from '../../lib/theme';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export default function Profile() {
  const { choice, setChoice, colors } = useAppearance();
  const { session } = useAuth();
  return <Screen>
    <Txt size={26} weight="700">Profile</Txt>
    <Card>
      {session ? <>
        <Txt size={17} weight="700">Your account</Txt>
        <Txt muted>{session.user.email}</Txt>
        <Button label="My campaigns" onPress={() => router.push('/drafts')} outline />
        <Button label="Organization registration" onPress={() => router.push('/organization')} outline />
        <Pressable style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingTop: 8 }} onPress={() => supabase.auth.signOut()}>
          <LogOut color={colors.navy} size={18} /><Txt size={14}>Sign out</Txt>
        </Pressable>
      </> : <>
        <Txt size={18} weight="700">Welcome to TESFA</Txt>
        <Txt muted>Anyone can explore. Sign in to start a campaign or track your applications.</Txt>
        <Button label="Sign in or create account" onPress={() => router.push('/auth')} />
      </>}
    </Card>
    <Card>
      <Txt size={17} weight="700">Appearance</Txt>
      <Txt muted size={12}>Your choice will be saved on this phone.</Txt>
      <View style={{ flexDirection: 'row', gap: 7 }}>
        {(['system', 'light', 'dark'] as ThemeChoice[]).map((option) =>
          <Pressable key={option} accessibilityRole="button" onPress={() => setChoice(option)}
            style={{ flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 9, borderWidth: 1, borderColor: colors.line, backgroundColor: choice === option ? '#173B63' : colors.surface }}>
            <Txt size={13} weight="600" style={{ color: choice === option ? '#FFFFFF' : colors.text }}>{option.charAt(0).toUpperCase() + option.slice(1)}</Txt>
          </Pressable>)}
      </View>
    </Card>
    <Card>
      <Pressable style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }} onPress={() => router.push('/create')}>
        <Txt weight="600">How campaign review works</Txt><ChevronRight color={colors.navy} size={20} />
      </Pressable>
      <Txt muted size={12}>TESFA is in prototype testing. No real payments or ID checks are active.</Txt>
    </Card>
  </Screen>;
}

