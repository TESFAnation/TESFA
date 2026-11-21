import React, { useEffect, useState } from 'react';
import { Platform, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Eye, EyeOff, MailCheck } from 'lucide-react-native';
import { Button, Field, Screen, Txt } from './primitives';
import { supabase } from '../lib/supabase';
import { useAppearance } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { authRedirect } from '../lib/site';

type Mode = 'sign-in' | 'register' | 'forgot' | 'check-email';

export default function AuthScreen() {
  const [mode, setMode] = useState<Mode>('sign-in');
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState('');
  const { colors } = useAppearance();
  const { session } = useAuth();

  useEffect(() => {
    if (Platform.OS === 'web' && session) router.replace('/profile');
  }, [session]);

  async function submit() {
    const address = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
      setMessage('Enter a valid email address.');
      return;
    }
    if (mode !== 'forgot' && password.length < 10) {
      setMessage('Use a password with at least 10 characters.');
      return;
    }
    if (mode === 'register' && password !== confirm) {
      setMessage('The passwords do not match.');
      return;
    }
    setBusy(true);
    setMessage('');
    try {
      if (mode === 'forgot') {
        const { error } = await supabase.auth.resetPasswordForEmail(address, {
          redirectTo: authRedirect('/reset-password'),
        });
        if (error) throw error;
        setMode('check-email');
        setMessage('If an account exists for this address, a password reset link is on its way.');
        return;
      }
      if (mode === 'register') {
        const { data, error } = await supabase.auth.signUp({
          email: address, password,
          options: { emailRedirectTo: authRedirect('/auth') },
        });
        if (error) throw error;
        if (!data.session) {
          setMode('check-email');
          setMessage('Open the confirmation link in your email, then return to TESFA.');
        } else router.replace('/profile');
        return;
      }
      const { error } = await supabase.auth.signInWithPassword({ email: address, password });
      if (error) throw error;
      router.replace('/profile');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  }

  async function resendConfirmation() {
    if (!email.trim() || busy) return;
    setBusy(true);
    const { error } = await supabase.auth.resend({
      type: 'signup', email: email.trim(),
      options: { emailRedirectTo: authRedirect('/auth') },
    });
    setBusy(false);
    setMessage(error ? error.message : 'A new confirmation link has been requested. Check your inbox.');
  }

  return <Screen webWidth={525}>
    <Pressable accessibilityRole="link" onPress={() => router.push('/')}><Txt muted size={13}>Back to TESFA</Txt></Pressable>
    <View style={{ gap: 8, marginTop: Platform.OS === 'web' ? 26 : 0, marginBottom: 12 }}>
      <Txt size={12} weight="800" style={{ color: colors.navy, letterSpacing: 1.4 }}>TESFA ACCOUNT</Txt>
      <Txt size={30} weight="700">{mode === 'register' ? 'Create your account' : mode === 'forgot' ? 'Reset your password' : mode === 'check-email' ? 'Check your email' : 'Sign in to TESFA'}</Txt>
      <Txt muted size={14}>
        {mode === 'register' ? 'Start a campaign, follow your applications, and save causes.'
          : mode === 'forgot' ? 'We will send a link to reset your password.'
          : mode === 'check-email' ? 'Follow the instructions in the message we sent you.'
          : 'Continue to your campaigns and account.'}
      </Txt>
    </View>
    {mode === 'check-email' ? <>
      <MailCheck size={38} color={colors.navy} />
      {!!message && <View style={{ padding: 17, backgroundColor: colors.soft, borderRadius: 8 }}><Txt size={14}>{message}</Txt></View>}
      <Button label="Back to sign in" outline onPress={() => { setMode('sign-in'); setMessage(''); }} />
      <Button label={busy ? 'Requesting link…' : 'Resend confirmation email'} disabled={busy} onPress={resendConfirmation} outline />
    </> : <>
      <Field label="Email address" keyboardType="email-address" value={email} onChangeText={setEmail} placeholder="you@example.com" />
      {mode !== 'forgot' && <>
        <Field label="Password" secureTextEntry={!showPassword} value={password} onChangeText={setPassword}
          placeholder={mode === 'register' ? 'At least 10 characters' : 'Your password'} />
        <Pressable accessibilityRole="button" onPress={() => setShowPassword(!showPassword)}
          style={{ flexDirection: 'row', alignSelf: 'flex-end', alignItems: 'center', gap: 7 }}>
          {showPassword ? <EyeOff size={16} color={colors.navy} /> : <Eye size={16} color={colors.navy} />}
          <Txt size={12} weight="600" style={{ color: colors.navy }}>{showPassword ? 'Hide password' : 'Show password'}</Txt>
        </Pressable>
      </>}
      {mode === 'register' && <Field label="Confirm password" secureTextEntry={!showPassword}
        value={confirm} onChangeText={setConfirm} placeholder="Repeat password" />}
      {!!message && <View accessibilityRole="alert" style={{ padding: 14, backgroundColor: colors.soft, borderRadius: 7 }}>
        <Txt size={13}>{message}</Txt>
      </View>}
      <Button label={busy ? 'Please wait…' : mode === 'register' ? 'Create account' : mode === 'forgot' ? 'Send reset link' : 'Sign in'}
        disabled={busy} onPress={submit} />
      {mode === 'sign-in' && <Pressable accessibilityRole="button" onPress={() => { setMode('forgot'); setMessage(''); }}
        style={{ alignItems: 'center', padding: 7 }}><Txt size={14} weight="600" style={{ color: colors.navy }}>Forgot password?</Txt></Pressable>}
      <Button outline label={mode === 'register' || mode === 'forgot' ? 'Back to sign in' : 'New to TESFA? Create an account'}
        onPress={() => { setMode(mode === 'sign-in' ? 'register' : 'sign-in'); setMessage(''); }} />
      <Txt muted size={12} style={{ lineHeight: 19 }}>
        TESFA is in testing. Do not upload real identity documents or confidential medical records while testing.
      </Txt>
    </>}
  </Screen>;
}
