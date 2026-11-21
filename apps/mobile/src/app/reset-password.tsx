import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Screen, Txt } from '../components/primitives';
import { supabase } from '../lib/supabase';
import { useAppearance } from '../lib/theme';
import { useAuth } from '../lib/auth';

export default function ResetPassword() {
  const { session } = useAuth();
  const { colors } = useAppearance();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [recovery, setRecovery] = useState(false);

  useEffect(() => {
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'PASSWORD_RECOVERY') setRecovery(true);
    });
    return () => data.subscription.unsubscribe();
  }, []);

  async function savePassword() {
    if (!session && !recovery) { setMessage('Open the password reset link in your email.'); return; }
    if (password.length < 10) { setMessage('Choose at least 10 characters.'); return; }
    if (password !== confirm) { setMessage('The passwords do not match.'); return; }
    setBusy(true); setMessage('');
    const { error } = await supabase.auth.updateUser({ password });
    setBusy(false);
    if (error) { setMessage(error.message); return; }
    setPassword(''); setConfirm('');
    setMessage('Password changed. You can continue to your account.');
  }

  return <Screen webWidth={525}>
    <Pressable onPress={() => router.push('/auth')}><Txt muted size={13}>Back to sign in</Txt></Pressable>
    <Txt size={12} weight="800" style={{ color: colors.navy, letterSpacing: 1.3 }}>ACCOUNT SECURITY</Txt>
    <Txt size={29} weight="700">Set a new password</Txt>
    <Txt muted>Choose a password you have not used before.</Txt>
    <Field label="New password" secureTextEntry value={password} onChangeText={setPassword} placeholder="At least 10 characters" />
    <Field label="Confirm new password" secureTextEntry value={confirm} onChangeText={setConfirm} placeholder="Repeat new password" />
    {!!message && <View accessibilityRole="alert" style={{ backgroundColor: colors.soft, padding: 15, borderRadius: 7 }}>
      <Txt size={14}>{message}</Txt>
    </View>}
    <Button label={busy ? 'Updating…' : 'Update password'} onPress={savePassword} disabled={busy || (!session && !recovery)} />
    {!!session && <Button label="Go to my account" outline onPress={() => router.replace('/profile')} />}
    {!session && !recovery && <Txt muted size={13}>If your reset link has expired, request another one from the sign-in page.</Txt>}
  </Screen>;
}
