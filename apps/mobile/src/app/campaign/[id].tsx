import React, { useEffect, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, ShieldCheck } from 'lucide-react-native';
import { Button, Card, Screen, Txt } from '../../components/primitives';
import { demoCampaigns, money, type Campaign } from '../../lib/campaigns';
import { useAppearance } from '../../lib/theme';
import { supabase } from '../../lib/supabase';

export default function CampaignDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppearance();
  const [campaign, setCampaign] = useState<Campaign | undefined>(demoCampaigns.find((c) => c.id === id));
  const [loading, setLoading] = useState(!id?.startsWith('sample-'));
  useEffect(() => {
    if (!id || id.startsWith('sample-')) return;
    supabase.from('campaigns').select('id,title,category,location,story,goal_etb,raised_etb')
      .eq('id', id).eq('status', 'approved').single().then(({ data }) => {
        if (data) setCampaign({
          ...data, location: data.location || 'Ethiopia',
          goal_etb: Number(data.goal_etb), raised_etb: Number(data.raised_etb || 0),
        } as Campaign);
        setLoading(false);
      });
  }, [id]);
  return <Screen>
    <Pressable onPress={() => router.back()}><Txt muted>‹ Back to campaigns</Txt></Pressable>
    {loading ? <Txt muted>Loading campaign…</Txt> : !campaign ? <Txt muted>This campaign is unavailable or not approved.</Txt> : <>
      <Txt muted size={12} weight="700">{campaign.demo ? 'FICTIONAL SAMPLE' : 'APPROVED PROTOTYPE CAMPAIGN'}</Txt>
      <Txt size={28} weight="700">{campaign.title}</Txt>
      <Txt muted>{campaign.category.toUpperCase()}  ·  {campaign.location}</Txt>
      <Card>
        <Txt size={24} weight="700">{money(campaign.raised_etb)}</Txt>
        <Txt muted size={13}>of {money(campaign.goal_etb)} fundraising goal {campaign.demo ? '(demo numbers)' : ''}</Txt>
        <View style={{ height: 6, borderRadius: 6, backgroundColor: colors.line, overflow: 'hidden' }}>
          <View style={{ height: 6, width: String(Math.min(100, (campaign.raised_etb / campaign.goal_etb) * 100)) + '%', backgroundColor: colors.progress }} />
        </View>
      </Card>
      <Txt size={20} weight="700">The story</Txt>
      <Txt>{campaign.story}</Txt>
      <Card>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <ShieldCheck size={22} color={colors.navy} />
          <Txt weight="700">About verification</Txt>
        </View>
        <Txt muted size={13}>{campaign.demo
          ? 'This fictional story has not been verified. It exists only to demonstrate TESFA.'
          : 'Reviewed by an administrator in the TESFA prototype. This does not represent government ID or document authentication.'}</Txt>
      </Card>
      <Button label="Preview donation" onPress={() => router.push({ pathname: '/donate', params: { title: campaign.title } })} />
      <Txt muted size={12}>Payments are disabled. No money can be transferred through this prototype.</Txt>
    </>}
  </Screen>;
}

