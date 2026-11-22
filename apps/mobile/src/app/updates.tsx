import React, { useCallback, useRef, useState } from 'react';
import { Pressable } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Screen, Txt } from '../components/primitives';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';
import { Alert } from '../lib/notify';

type Update = { id: string; body: string; status: string; created_at: string };
export default function Updates() {
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const { session } = useAuth();
  const userId = session?.user.id;
  const [text, setText] = useState('');
  const [updates, setUpdates] = useState<Update[]>([]);
  const [busy, setBusy] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const requestId = useRef(0);
  const refresh = useCallback(async () => {
    const current = ++requestId.current;
    if (!campaignId || !userId) {
      setAllowed(false); setUpdates([]); setError(''); setLoading(false);
      return;
    }
    setLoading(true);
    const [campaign, result] = await Promise.all([
      supabase.from('campaigns').select('id')
        .eq('id', campaignId).eq('owner_id', userId).eq('status', 'approved').maybeSingle(),
      supabase.from('campaign_updates').select('id,body,status,created_at')
        .eq('campaign_id', campaignId).eq('author_id', userId)
        .order('created_at', { ascending: false }),
    ]);
    if (current !== requestId.current) return;
    setAllowed(!!campaign.data && !campaign.error);
    setUpdates((result.data || []) as Update[]);
    setError(campaign.error?.message || result.error?.message || '');
    setLoading(false);
  }, [campaignId, userId]);
  useFocusEffect(useCallback(() => { void refresh(); return () => { requestId.current += 1; }; }, [refresh]));
  async function submit() {
    if (!session || !campaignId || !allowed) return;
    if (text.trim().length < 30) return Alert.alert('More detail needed', 'Write at least 30 characters.');
    setBusy(true);
    const { error } = await supabase.from('campaign_updates').insert({
      campaign_id: campaignId, author_id: session.user.id, body: text.trim(), status: 'pending',
    });
    setBusy(false);
    if (error) return Alert.alert('Could not post update', error.message);
    setText('');
    Alert.alert('Update sent', 'Your update will appear publicly after staff approval.');
    await refresh();
  }
  return <Screen>
    <Pressable onPress={() => router.back()}><Txt muted>‹ My campaigns</Txt></Pressable>
    <Txt size={27} weight="700">Campaign updates</Txt>
    {loading && <Txt muted>Checking your campaign…</Txt>}
    {!!error && <Card><Txt size={13}>{error}</Txt><Button label="Try again" outline onPress={() => { void refresh(); }} /></Card>}
    {!loading && !error && allowed ? <>
      <Txt muted>Let supporters know how things are going. Updates are reviewed before publication.</Txt>
      <Field label="Write an update" value={text} onChangeText={setText} multiline placeholder="Share progress, news, or changes to your campaign." />
      <Button label={busy ? 'Submitting…' : 'Submit update'} disabled={busy} onPress={submit} />
      <Txt size={19} weight="700">Previous updates</Txt>
      {updates.map((item) => <Card key={item.id}>
        <Txt muted size={12}>{new Date(item.created_at).toLocaleDateString('en-GB')} · {item.status}</Txt>
        <Txt>{item.body}</Txt>
      </Card>)}
      {!updates.length && <Txt muted>No updates yet.</Txt>}
    </> : !loading && !error && <Txt muted>Updates are available to organizers of approved campaigns.</Txt>}
  </Screen>;
}
