import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Field, Screen, Txt } from '../components/primitives';
import { useAppearance } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

const reasons = [
  { key: 'misleading', label: 'Misleading information' },
  { key: 'privacy', label: 'Privacy or personal information' },
  { key: 'spam', label: 'Spam or duplicate campaign' },
  { key: 'other', label: 'Other concern' },
] as const;
export default function Report() {
  const { campaignId } = useLocalSearchParams<{ campaignId: string }>();
  const { session } = useAuth();
  const { colors } = useAppearance();
  const [reason, setReason] = useState<(typeof reasons)[number]['key']>('misleading');
  const [details, setDetails] = useState('');
  const [busy, setBusy] = useState(false);
  async function submit() {
    if (!session) return router.push('/auth');
    if (!campaignId) return;
    setBusy(true);
    const result = await supabase.from('campaign_reports').insert({
      campaign_id: campaignId, reporter_id: session.user.id, reason, details: details.trim(),
    });
    setBusy(false);
    if (result.error) {
      Alert.alert('Could not send report', result.error.code === '23505' ? 'You have already reported this campaign.' : result.error.message);
      return;
    }
    Alert.alert('Report received', 'TESFA reviewers can now review your concern.');
    router.back();
  }
  return <Screen>
    <Pressable onPress={() => router.back()}><Txt muted>‹ Back to campaign</Txt></Pressable>
    <Txt size={27} weight="700">Report a concern</Txt>
    <Txt muted>Help us keep campaign information reliable.</Txt>
    <Card style={{ backgroundColor: colors.soft, borderWidth: 0 }}><Txt size={13}>Your report is private. It will be visible to TESFA reviewers, not the campaign organizer.</Txt></Card>
    <Txt size={18} weight="700">What is the issue?</Txt>
    {reasons.map((item) => <Pressable key={item.key} onPress={() => setReason(item.key)} style={{ backgroundColor: colors.surface, borderColor: reason === item.key ? colors.navy : colors.line, borderWidth: 1, borderRadius: 10, padding: 14 }}>
      <Txt weight={reason === item.key ? '700' : '400'}>{reason === item.key ? '●  ' : '○  '}{item.label}</Txt>
    </Pressable>)}
    <Field label="Additional details (optional)" placeholder="Describe what you noticed." multiline value={details} onChangeText={(next) => setDetails(next.slice(0, 800))} />
    <Button label={busy ? 'Sending…' : 'Send report'} disabled={busy || !session} onPress={submit} />
  </Screen>;
}
