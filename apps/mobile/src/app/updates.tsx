import React, { useCallback, useState } from 'react';
import { Alert, Pressable } from 'react-native';
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Screen, Txt } from '../components/primitives';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

type Update = { id: string; body: string; status: string; created_at: string };
export default function Updates() {
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const { session } = useAuth();
  const [text, setText] = useState('');
  const [updates, setUpdates] = useState<Update[]>([]);
  const [busy, setBusy] = useState(false);
  const [allowed, setAllowed] = useState(false);
  const refresh = useCallback(async () => {
    if (!campaignId || !session) return;
    const { data } = await supabase.from('campaigns').select('id')
      .eq('id', campaignId).eq('owner_id', session.user.id).eq('status', 'approved').maybeSingle();
    setAllowed(!!data);
    const result = await supabase.from('campaign_updates').select('id,body,status,created_at')
      .eq('campaign_id', campaignId).eq('author_id', session.user.id)
      .order('created_at', { ascending: false });
    setUpdates((result.data || []) as Update[]);
  }, [campaignId, session?.user.id]);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));
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
    {allowed ? <>
      <Txt muted>Let supporters know how things are going. Updates are reviewed before publication.</Txt>
      <Field label="Write an update" value={text} onChangeText={setText} multiline placeholder="Share progress, news, or changes to your campaign." />
      <Button label={busy ? 'Submitting…' : 'Submit update'} disabled={busy} onPress={submit} />
      <Txt size={19} weight="700">Previous updates</Txt>
      {updates.map((item) => <Card key={item.id}>
        <Txt muted size={12}>{new Date(item.created_at).toLocaleDateString('en-GB')} · {item.status}</Txt>
        <Txt>{item.body}</Txt>
      </Card>)}
      {!updates.length && <Txt muted>No updates yet.</Txt>}
    </> : <Txt muted>Updates are available to organizers of approved campaigns.</Txt>}
  </Screen>;
}
