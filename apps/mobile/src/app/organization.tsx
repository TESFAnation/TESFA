import React, { useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { router } from 'expo-router';
import { Button, Field, Screen, Txt } from '../components/primitives';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

export default function Organization() {
  const { session } = useAuth();
  const [name, setName] = useState('');
  const [registration, setRegistration] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!session) return router.push('/auth');
    if (name.trim().length < 3 || !registration.trim() || note.trim().length < 25) return Alert.alert('Incomplete form', 'Provide a name, sample registration reference and a note of at least 25 characters.');
    setBusy(true);
    const result = await supabase.from('organizations').insert({
      owner_id: session.user.id, name: name.trim(), registration_reference: registration.trim(), note: note.trim(), status: 'pending',
    });
    setBusy(false);
    if (result.error) return Alert.alert('Could not submit', result.error.message);
    Alert.alert('Submitted', 'Your fictional organization application was sent for demo review.');
    router.back();
  }
  return <Screen>
    <Pressable onPress={() => router.back()}><Txt muted>‹ Back</Txt></Pressable>
    <Txt size={26} weight="700">Organization registration</Txt>
    <Txt muted>Registered organizations have a separate application. This prototype does not authenticate any government registration record.</Txt>
    <Field label="Organization name (fictional)" value={name} onChangeText={setName} />
    <Field label="Sample registration reference" value={registration} onChangeText={setRegistration} />
    <Field label="About the organization" multiline value={note} onChangeText={setNote} />
    <Button label={busy ? 'Submitting…' : 'Submit for review'} onPress={submit} disabled={!session || busy} />
    {!session && <Button label="Sign in first" onPress={() => router.push('/auth')} outline />}
  </Screen>;
}

