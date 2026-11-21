import React, { useCallback, useEffect, useState } from 'react';
import { Image, Pressable, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Bookmark, CalendarDays, ChevronLeft, Flag, MapPin, Share2, ShieldCheck } from 'lucide-react-native';
import { Txt } from '../../components/primitives';
import { WebAction, WebPage } from '../../components/web-layout';
import { money, photoUrl, titleCase, type Campaign } from '../../lib/campaigns';
import { useAppearance } from '../../lib/theme';
import { useAuth } from '../../lib/auth';
import { supabase } from '../../lib/supabase';
import { Alert } from '../../lib/notify';

type PublicUpdate = { id: string; body: string; created_at: string };

export default function WebCampaignDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { colors } = useAppearance();
  const { session } = useAuth();
  const { width } = useWindowDimensions();
  const wide = width >= 920;
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [photos, setPhotos] = useState<string[]>([]);
  const [activePhoto, setActivePhoto] = useState(0);
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
    if (!result.data || result.error) {
      setCampaign(null);
      setLoading(false);
      return;
    }
    setCampaign({
      ...result.data,
      location: result.data.location || 'Ethiopia',
      goal_etb: Number(result.data.goal_etb),
      raised_etb: Number(result.data.raised_etb || 0),
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
    const url = window.location.href;
    try {
      if (navigator.share) await navigator.share({ title: campaign.title, url });
      else {
        await navigator.clipboard.writeText(url);
        Alert.alert('Link copied', 'Share this campaign link with someone.');
      }
    } catch { /* A cancelled share is not an error. */ }
  }

  const progress = campaign ? Math.max(0, Math.min(100, campaign.raised_etb / Math.max(campaign.goal_etb, 1) * 100)) : 0;
  return <View style={{ flex: 1, backgroundColor: colors.page }}>
    <WebPage>
      <Pressable accessibilityRole="link" onPress={() => router.push('/explore')}
        style={{ marginTop: 34, marginBottom: 24, flexDirection: 'row', alignItems: 'center', gap: 7 }}>
        <ChevronLeft size={18} color={colors.navy} /><Txt size={14} weight="600" style={{ color: colors.navy }}>All campaigns</Txt>
      </Pressable>
      {loading ? <Txt muted>Loading campaign...</Txt> : !campaign ?
        <View style={{ padding: 50, backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, gap: 12, borderRadius: 9 }}>
          <Txt size={26} weight="700">Campaign unavailable</Txt>
          <Txt muted>This campaign is not approved or is no longer published.</Txt>
          <WebAction label="Explore other causes" onPress={() => router.push('/explore')} />
        </View> :
        <>
          <View style={{ gap: 12, marginBottom: 32 }}>
            <Txt size={12} weight="800" style={{ color: colors.navy, letterSpacing: 1.2 }}>
              {titleCase(campaign.category).toUpperCase()} / REVIEWED CAMPAIGN
            </Txt>
            <Txt size={width >= 1100 ? 44 : width >= 600 ? 36 : 30} weight="700"
              style={{ lineHeight: width >= 1100 ? 54 : width >= 600 ? 45 : 39, letterSpacing: -1.1, maxWidth: 900 }}>
              {campaign.title}
            </Txt>
            <View style={{ flexDirection: 'row', gap: 7, alignItems: 'center' }}>
              <MapPin color={colors.subtle} size={16} /><Txt size={14} muted>{campaign.location}</Txt>
            </View>
          </View>

          <View style={{ flexDirection: wide ? 'row' : 'column', alignItems: 'flex-start', gap: 34 }}>
            <View style={{ flex: wide ? 1.75 : undefined, width: wide ? undefined : '100%', gap: 31, minWidth: 0 }}>
              <View style={{ gap: 12 }}>
                <View style={{ height: width < 600 ? 255 : 430, backgroundColor: colors.soft, borderRadius: 8, overflow: 'hidden',
                  justifyContent: 'center', alignItems: 'center' }}>
                  {photos.length
                    ? <Image source={{ uri: photos[activePhoto] }} resizeMode="cover" style={{ width: '100%', height: '100%' }} />
                    : <View style={{ gap: 9, alignItems: 'center' }}>
                      <ShieldCheck color={colors.navy} size={42} strokeWidth={1.4} />
                      <Txt size={14} muted>Campaign photographs have not been added.</Txt>
                    </View>}
                </View>
                {photos.length > 1 && <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
                  {photos.map((url, index) => <Pressable key={url} accessibilityRole="button" accessibilityLabel={'View photo ' + (index + 1)}
                    onPress={() => setActivePhoto(index)} style={{ borderWidth: activePhoto === index ? 2 : 1,
                      borderColor: activePhoto === index ? colors.navy : colors.line, borderRadius: 6, overflow: 'hidden' }}>
                    <Image source={{ uri: url }} style={{ width: 90, height: 68 }} resizeMode="cover" />
                  </Pressable>)}
                </View>}
              </View>
              <View style={{ gap: 15 }}>
                <Txt size={25} weight="700">About this campaign</Txt>
                <Txt size={16} style={{ lineHeight: 28 }}>{campaign.story}</Txt>
              </View>
              {!!campaign.spending_plan && <View style={{ gap: 14, borderTopWidth: 1, borderColor: colors.line, paddingTop: 25 }}>
                <Txt size={24} weight="700">How funds will be used</Txt>
                <Txt size={16} style={{ lineHeight: 28 }}>{campaign.spending_plan}</Txt>
              </View>}
              <View style={{ gap: 13, borderTopWidth: 1, borderColor: colors.line, paddingTop: 27 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                  <ShieldCheck size={24} color={colors.navy} />
                  <Txt size={19} weight="700">TESFA staff review</Txt>
                </View>
                <Txt size={14} muted style={{ lineHeight: 23 }}>
                  TESFA staff reviewed the application and supporting files before publication. This is not independent government, medical, or identity verification.
                </Txt>
              </View>
              <View style={{ gap: 17, borderTopWidth: 1, borderColor: colors.line, paddingTop: 28 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Txt size={24} weight="700">Organizer updates</Txt><Txt size={13} muted>{updates.length} published</Txt>
                </View>
                {updates.length ? updates.map((update) => <View key={update.id} style={{
                  borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 7, padding: 22, gap: 10 }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <CalendarDays color={colors.subtle} size={15} /><Txt muted size={12}>{new Date(update.created_at).toLocaleDateString('en-GB')}</Txt>
                  </View>
                  <Txt size={15} style={{ lineHeight: 24 }}>{update.body}</Txt>
                </View>) : <Txt size={14} muted>No updates have been published yet.</Txt>}
              </View>
              <Pressable accessibilityRole="button" onPress={() => session
                ? router.push({ pathname: '/report', params: { campaignId: id } })
                : router.push('/auth')} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 }}>
                <Flag color={colors.subtle} size={17} /><Txt size={13} muted>Report a concern about this campaign</Txt>
              </Pressable>
            </View>
            <View style={{ width: wide ? 356 : '100%', gap: 18 }}>
              <View style={{ borderColor: colors.line, borderWidth: 1, borderRadius: 9,
                padding: width < 600 ? 24 : 29, backgroundColor: colors.surface, gap: 19 }}>
                <View style={{ gap: 5 }}>
                  <Txt size={32} weight="800">{money(campaign.raised_etb)}</Txt>
                  <Txt size={14} muted>raised toward {money(campaign.goal_etb)}</Txt>
                </View>
                <View style={{ backgroundColor: colors.line, height: 7, borderRadius: 2, overflow: 'hidden' }}>
                  <View style={{ backgroundColor: colors.progress, height: 7, width: String(progress) + '%' }} />
                </View>
                <Txt size={13} weight="700">{Math.round(progress)}% of goal reached</Txt>
                <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/donate', params: { title: campaign.title } })}
                  style={{ padding: 16, alignItems: 'center', backgroundColor: '#173B63', borderRadius: 7 }}>
                  <Txt size={15} weight="700" style={{ color: '#FFFFFF' }}>Preview a donation</Txt>
                </Pressable>
                <Txt muted size={12} style={{ lineHeight: 19 }}>This is a preview. Payment processing is not active and no money is collected.</Txt>
                <View style={{ borderTopWidth: 1, borderColor: colors.line, paddingTop: 18,
                  flexDirection: 'row', justifyContent: 'space-evenly' }}>
                  <Pressable accessibilityRole="button" disabled={busy} onPress={toggleSaved}
                    style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 7 }}>
                    <Bookmark color={colors.navy} size={18} fill={saved ? colors.navy : 'transparent'} />
                    <Txt size={13} weight="600">{saved ? 'Saved' : 'Save'}</Txt>
                  </Pressable>
                  <View style={{ width: 1, backgroundColor: colors.line }} />
                  <Pressable accessibilityRole="button" onPress={shareCampaign}
                    style={{ flexDirection: 'row', gap: 8, alignItems: 'center', paddingVertical: 7 }}>
                    <Share2 color={colors.navy} size={18} /><Txt size={13} weight="600">Share</Txt>
                  </Pressable>
                </View>
              </View>
              {!!campaign.organizer_name && <View style={{ borderColor: colors.line, borderWidth: 1, borderRadius: 9,
                backgroundColor: colors.surface, padding: 25, gap: 10 }}>
                <Txt size={12} muted weight="700" style={{ letterSpacing: 1 }}>CAMPAIGN ORGANIZER</Txt>
                <Txt size={17} weight="700">{campaign.organizer_name}</Txt>
                <Txt size={13} muted>Campaign submitted through TESFA.</Txt>
              </View>}
            </View>
          </View>
        </>}
    </WebPage>
  </View>;
}
