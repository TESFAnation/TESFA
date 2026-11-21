import React, { useCallback, useEffect, useState } from 'react';
import { Image, Platform, Pressable, ScrollView, Share, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Bookmark, CalendarDays, Flag, MapPin, Share2, ShieldCheck } from 'lucide-react-native';
import { Button, Card, Screen, Txt } from '../../components/primitives';
import { money, photoUrl, type Campaign } from '../../lib/campaigns';
import { useAppearance } from '../../lib/theme';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Alert } from '../../lib/notify';

type PublicUpdate = { id: string; body: string; created_at: string };
export default function CampaignDetails() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppearance();
  const { session } = useAuth();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [updates, setUpdates] = useState<PublicUpdate[]>([]);
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const refresh = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    const result = await supabase.from('campaigns')
      .select('id,title,category,location,story,goal_etb,raised_etb,organizer_name,spending_plan,created_at')
      .eq('id', id).eq('status', 'approved').maybeSingle();
    if (!result.data || result.error) { setCampaign(null); setLoading(false); return; }
    setCampaign({
      ...result.data, location: result.data.location || 'Ethiopia',
      goal_etb: Number(result.data.goal_etb), raised_etb: Number(result.data.raised_etb || 0),
    } as Campaign);
    const [media, publicUpdates] = await Promise.all([
      supabase.from('campaign_media').select('storage_path').eq('campaign_id', id).order('display_order'),
      supabase.from('campaign_updates').select('id,body,created_at').eq('campaign_id', id)
        .eq('status', 'approved').order('created_at', { ascending: false }),
    ]);
    setPhotos((media.data || []).map((item) => photoUrl(item.storage_path)));
    setUpdates((publicUpdates.data || []) as PublicUpdate[]);
    setLoading(false);
  }, [id]);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  useEffect(() => {
    if (!id || !session) { void Promise.resolve().then(() => setSaved(false)); return; }
    supabase.from('saved_campaigns').select('campaign_id').eq('campaign_id', id)
      .eq('user_id', session.user.id).maybeSingle().then(({ data }) => setSaved(!!data));
  }, [id, session]);

  async function toggleSaved() {
    if (!session) return router.push('/auth');
    if (!id || busy) return;
    setBusy(true);
    const result = saved
      ? await supabase.from('saved_campaigns').delete().eq('user_id', session.user.id).eq('campaign_id', id)
      : await supabase.from('saved_campaigns').insert({ user_id: session.user.id, campaign_id: id });
    if (result.error) Alert.alert('Could not save', result.error.message);
    else setSaved(!saved);
    setBusy(false);
  }
  async function shareCampaign() {
    if (!campaign) return;
    const message = campaign.title + '\n' + campaign.location + '\nFind this campaign in TESFA.';
    if (Platform.OS === 'web') {
      try {
        if (navigator.share) await navigator.share({ title: campaign.title, text: message });
        else {
          await navigator.clipboard.writeText(message);
          Alert.alert('Copied', 'Campaign details copied to your clipboard.');
        }
      } catch { /* The browser share dialog can be cancelled. */ }
    } else await Share.share({ message });
  }

  if (loading) return <Screen><Pressable onPress={() => router.back()}><Txt muted>‹ Back</Txt></Pressable><Txt muted>Loading campaign…</Txt></Screen>;
  if (!campaign) return <Screen><Pressable onPress={() => router.back()}><Txt muted>‹ Back</Txt></Pressable><Txt size={21} weight="700">Campaign unavailable</Txt><Txt muted>This cause is not published or is no longer available.</Txt></Screen>;
  const progress = Math.min(100, (campaign.raised_etb / Math.max(campaign.goal_etb, 1)) * 100);
  return <Screen>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Pressable onPress={() => router.back()}><Txt muted>‹ Explore</Txt></Pressable>
      <View style={{ flexDirection: 'row', gap: 17, alignItems: 'center' }}>
        <Pressable accessibilityLabel={saved ? 'Remove saved campaign' : 'Save campaign'} onPress={toggleSaved}>
          <Bookmark size={23} color={colors.navy} fill={saved ? colors.navy : 'transparent'} />
        </Pressable>
        <Pressable accessibilityLabel="Share campaign" onPress={shareCampaign}><Share2 color={colors.navy} size={23} /></Pressable>
      </View>
    </View>
    {!!photos.length && <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginHorizontal: -22 }} contentContainerStyle={{ paddingHorizontal: 22, gap: 10 }}>
      {photos.map((url) => <Image key={url} source={{ uri: url }} style={{ width: 286, height: 215, borderRadius: 14, backgroundColor: colors.soft }} resizeMode="cover" />)}
    </ScrollView>}
    <Txt muted size={12} weight="700" style={{ letterSpacing: 1 }}>{campaign.category.toUpperCase()} · APPROVED CAMPAIGN</Txt>
    <Txt size={27} weight="700">{campaign.title}</Txt>
    <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><MapPin color={colors.subtle} size={16} /><Txt muted size={13}>{campaign.location}</Txt></View>
    <Card style={{ gap: 13 }}>
      <Txt muted size={12}>FUNDRAISING PROGRESS</Txt>
      <Txt size={28} weight="800">{money(campaign.raised_etb)}</Txt>
      <Txt muted size={13}>raised of {money(campaign.goal_etb)} goal</Txt>
      <View style={{ height: 7, borderRadius: 7, backgroundColor: colors.line, overflow: 'hidden' }}>
        <View style={{ height: 7, width: String(progress) + '%', backgroundColor: colors.progress }} />
      </View>
      <Txt muted size={12}>{Math.round(progress)}% funded</Txt>
      <Button label="Preview a donation" onPress={() => router.push({ pathname: '/donate', params: { title: campaign.title } })} />
      <Txt muted size={11}>Payment processing is not enabled. No money is collected.</Txt>
    </Card>
    {!!campaign.organizer_name && <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <View style={{ height: 43, width: 43, backgroundColor: colors.soft, borderRadius: 22, justifyContent: 'center', alignItems: 'center' }}><Txt weight="800">{campaign.organizer_name.slice(0, 1).toUpperCase()}</Txt></View>
      <View style={{ gap: 3, flex: 1 }}><Txt muted size={11}>ORGANIZED BY</Txt><Txt weight="700">{campaign.organizer_name}</Txt></View>
    </Card>}
    <Txt size={20} weight="700">The story</Txt>
    <Txt size={15} style={{ lineHeight: 24 }}>{campaign.story}</Txt>
    {!!campaign.spending_plan && <><Txt size={20} weight="700">How funds will be used</Txt><Card><Txt style={{ lineHeight: 23 }}>{campaign.spending_plan}</Txt></Card></>}
    <Card style={{ gap: 9, backgroundColor: colors.soft, borderWidth: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><ShieldCheck color={colors.navy} size={22} /><Txt weight="700">Staff-reviewed application</Txt></View>
      <Txt muted size={13}>TESFA staff reviewed the application and supporting files before publication. This is not independent government, medical, or identity verification.</Txt>
    </Card>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Txt size={20} weight="700">Organizer updates</Txt>
      <Txt muted size={12}>{updates.length} published</Txt>
    </View>
    {updates.length ? updates.map((update) => <Card key={update.id} style={{ gap: 7 }}>
      <View style={{ flexDirection: 'row', gap: 6, alignItems: 'center' }}><CalendarDays size={14} color={colors.subtle} /><Txt muted size={12}>{new Date(update.created_at).toLocaleDateString('en-GB')}</Txt></View>
      <Txt size={14}>{update.body}</Txt>
    </Card>) : <Txt muted size={13}>No updates have been published yet.</Txt>}
    <Pressable onPress={() => session ? router.push({ pathname: '/report', params: { campaignId: id } }) : router.push('/auth')}
      style={{ flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 8 }}>
      <Flag color={colors.subtle} size={16} /><Txt muted size={13}>Report a concern with this campaign</Txt>
    </Pressable>
  </Screen>;
}
