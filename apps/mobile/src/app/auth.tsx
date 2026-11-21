import React, { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Screen, Txt } from '../components/primitives';
import { supabase } from '../lib/supabase';
import { useAppearance } from '../lib/theme';

export default function Auth() {
  const [register, setRegister] = useState(false);
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { colors } = useAppearance();

  async function submit() {
    if (!email.includes('@') || password.length < 8) return Alert.alert('Check your details', 'Use a valid email and a password of at least 8 characters.');
    setBusy(true);
    const result = register
      ? await supabase.auth.signUp({ email: email.trim(), password })
      : await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setBusy(false);
    if (result.error) return Alert.alert('Could not continue', result.error.message);
    if (register && !result.data.session) Alert.alert('Check your email', 'Confirm your email address, then sign in to TESFA.');
    else router.replace('/profile');
  }
  return <Screen>
    <Pressable onPress={() => router.back()}><Txt muted>‹ Back</Txt></Pressable>
    <Txt size={28} weight="800" style={{ color: colors.navy, letterSpacing: 1 }}>TESFA</Txt>
    <Txt size={23} weight="700">{register ? 'Create an account' : 'Sign in'}</Txt>
    <Txt muted>Use your own email. Do not enter anyone else's private identification details while testing.</Txt>
    <Field label="Email address" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" />
    <Field label="Password" secureTextEntry value={password} onChangeText={setPassword} placeholder="At least 8 characters" />
    <Button label={busy ? 'Please wait…' : register ? 'Create account' : 'Sign in'} disabled={busy} onPress={submit} />
    <Button outline label={register ? 'Already registered? Sign in' : 'New here? Create account'} onPress={() => setRegister(!register)} />
  </Screen>;
}

