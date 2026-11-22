import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button, Card, Field, Screen, Txt } from '../components/primitives';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Alert } from '../lib/notify';
import { organizationStatusLabel, useOrganizations } from '../lib/organization';
import { useAppearance } from '../lib/theme';
import { latestOrganizationFeedback, type ReviewFeedback } from '../lib/review-feedback';

export default function Organization() {
  const { session } = useAuth();
  const { colors } = useAppearance();
  const { items, approved, pending, loading, error, refresh } = useOrganizations();
  const [name, setName] = useState('');
  const [registration, setRegistration] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [feedback, setFeedback] = useState<Record<string, ReviewFeedback>>({});
  const correction = items.find((item) => item.status === 'needs_info') || null;
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));
  useEffect(() => {
    let active = true;
    void latestOrganizationFeedback(items.map((item) => item.id)).then((result) => {
      if (active) setFeedback(result);
    });
    return () => { active = false; };
  }, [items]);
  function loadCorrection() {
    if (!correction) return;
    setName(correction.name);
    setRegistration(correction.registration_reference);
    setNote(correction.note);
    setMessage('Edit the details below, then resubmit this application for review.');
  }
  async function submit() {
    if (!session) return router.push('/auth');
    if (approved || pending) return;
    if (name.trim().length < 3 || !registration.trim() || note.trim().length < 25) return Alert.alert('Incomplete form', 'Provide a name, registration reference and a note of at least 25 characters.');
    setBusy(true); setMessage('');
    const details = { name: name.trim(), registration_reference: registration.trim(), note: note.trim(), status: 'pending' };
    const result = correction
      ? await supabase.from('organizations').update(details)
        .eq('id', correction.id).eq('owner_id', session.user.id).eq('status', 'needs_info')
      : await supabase.from('organizations').insert({ ...details, owner_id: session.user.id });
    setBusy(false);
    if (result.error) { setMessage(result.error.message); return; }
    setMessage(correction ? 'Corrections received. Your existing application is back in the review queue.' : 'Registration received. TESFA staff will review your organization details.');
    setName(''); setRegistration(''); setNote('');
    await refresh();
  }
  return <Screen>
    <Pressable onPress={() => router.back()}><Txt muted>‹ Back</Txt></Pressable>
    <Txt size={27} weight="700">Organization registration</Txt>
    <Txt muted>Organizations must be reviewed before they can submit a public campaign. TESFA staff review the application, but government registration is not independently verified in this prototype.</Txt>
    {!session && <Button label="Sign in first" onPress={() => router.push('/auth')} outline />}
    {loading && <Txt muted>Checking registration status…</Txt>}
    {!!error && <Txt muted>{error}</Txt>}
    {!!items.length && <View style={{ gap: 12 }}>
      <Txt size={19} weight="700">Your applications</Txt>
      {items.map((item) => <Card key={item.id} style={{ gap: 8 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
          <Txt size={17} weight="700">{item.name}</Txt>
          <View style={{ backgroundColor: colors.soft, borderRadius: 6, paddingVertical: 5, paddingHorizontal: 9 }}>
            <Txt size={12} weight="700" style={{ color: colors.navy }}>{organizationStatusLabel(item.status)}</Txt>
          </View>
        </View>
        <Txt size={13} muted>Registration reference: {item.registration_reference}</Txt>
        <Txt size={12} muted>Submitted {new Date(item.created_at).toLocaleDateString('en-GB')}</Txt>
        {!!feedback[item.id]?.notes && <View style={{ padding: 12, borderRadius: 7, backgroundColor: colors.soft, gap: 5 }}>
          <Txt size={12} weight="700" style={{ color: colors.navy }}>Staff feedback</Txt>
          <Txt size={13}>{feedback[item.id].notes}</Txt>
        </View>}
        {item.status === 'pending' && <Txt muted size={13}>TESFA staff have not completed the review yet. Your campaign drafts remain private.</Txt>}
        {item.status === 'approved' && <Button label="Start a campaign" onPress={() => router.push('/create')} />}
        {item.status === 'needs_info' && <>
          <Txt muted size={13}>Staff requested changes. Correct this application using the original registration below.</Txt>
          <Button label="Edit this application" onPress={loadCorrection} outline />
        </>}
      </Card>)}
    </View>}
    {!loading && session && !approved && !pending && <>
      <Txt size={19} weight="700">{correction ? 'Correct your application' : 'Apply for organization review'}</Txt>
      <Field label="Organization name" value={name} onChangeText={setName} placeholder="Registered organization name" />
      <Field label="Registration reference" value={registration} onChangeText={setRegistration} placeholder="Registration number or reference" />
      <Field label="About the organization" multiline value={note} onChangeText={setNote} placeholder="Explain the organization and its work. At least 25 characters." />
      <Button label={busy ? 'Submitting…' : correction ? 'Resubmit application' : 'Submit for review'} onPress={submit} disabled={busy} />
      <Txt muted size={12}>Use fictional, non-sensitive details during testing. Do not enter real ID numbers or confidential records yet.</Txt>
    </>}
    {!!message && <Card style={{ backgroundColor: colors.soft }}><Txt size={13}>{message}</Txt></Card>}
  </Screen>;
}

