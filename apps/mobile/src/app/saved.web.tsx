import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Bookmark } from 'lucide-react-native';
import { CampaignGrid, SectionHeading, WebAction, WebPage } from '../components/web-layout';
import { Txt } from '../components/primitives';
import { attachCampaignPhotos, type Campaign } from '../lib/campaigns';
import { useAuth } from '../lib/auth';
import { useAppearance } from '../lib/theme';
import { supabase } from '../lib/supabase';

export default function SavedWeb() {
  const { session } = useAuth();
  const { colors } = useAppearance();
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    if (!session) { setItems([]); setLoading(false); return; }
    setLoading(true);
    setError('');
    const result = await supabase.from('saved_campaigns').select('campaign_id').eq('user_id', session.user.id);
    if (result.error) { setError('Could not load saved campaigns.'); setLoading(false); return; }
    const ids = (result.data || []).map((row) => row.campaign_id);
    if (!ids.length) { setItems([]); setLoading(false); return; }
    const campaigns = await supabase.from('campaigns')
      .select('id,title,category,location,story,goal_etb,raised_etb,organizer_name,spending_plan,created_at')
      .in('id', ids).eq('status', 'approved').order('created_at', { ascending: false });
    if (campaigns.error) { setError('Could not load saved campaigns.'); setLoading(false); return; }
    const rows = (campaigns.data || []).map((item) => ({
      ...item, location: item.location || 'Ethiopia',
      goal_etb: Number(item.goal_etb), raised_etb: Number(item.raised_etb || 0),
    } as Campaign));
    setItems(await attachCampaignPhotos(rows));
    setLoading(false);
  }, [session]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  return <WebPage>
    <View style={{ marginTop: 54, gap: 16 }}>
      <SectionHeading eyebrow="Your account" title="Saved campaigns"
        description="Keep an eye on causes you want to follow." />
    </View>
    <View style={{ marginTop: 35 }}>
      {!session ? <View style={{ padding: 55, backgroundColor: colors.surface, borderWidth: 1,
        borderColor: colors.line, borderRadius: 9, gap: 15, alignItems: 'center' }}>
        <Bookmark size={35} color={colors.navy} />
        <Txt size={22} weight="700">Sign in to save campaigns</Txt>
        <Txt size={15} muted>Bookmark campaigns and find them here when you return.</Txt>
        <WebAction label="Sign in" onPress={() => router.push('/auth')} />
      </View> : <>
        {loading && <Txt muted>Loading saved campaigns...</Txt>}
        {!!error && <Pressable onPress={refresh}><Txt muted>{error} Select to retry.</Txt></Pressable>}
        {!loading && !error && (items.length
          ? <CampaignGrid campaigns={items} />
          : <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 9,
            backgroundColor: colors.surface, paddingVertical: 65, paddingHorizontal: 25,
            gap: 16, alignItems: 'center' }}>
            <Bookmark size={36} color={colors.navy} />
            <Txt size={23} weight="700">Nothing saved yet</Txt>
            <Txt size={15} muted style={{ textAlign: 'center' }}>Open an approved campaign and select Save.</Txt>
            <WebAction label="Explore causes" onPress={() => router.push('/explore')} />
          </View>)}
      </>}
    </View>
  </WebPage>;
}
