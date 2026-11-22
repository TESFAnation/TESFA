import React, { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Bookmark } from 'lucide-react-native';
import { Button, Card, Screen, Txt } from '../components/primitives';
import { CampaignCard } from '../components/campaign-card';
import { attachCampaignPhotos, type Campaign } from '../lib/campaigns';
import { useAuth } from '../lib/auth';
import { useAppearance } from '../lib/theme';
import { supabase } from '../lib/supabase';

export default function Saved() {
  const { session } = useAuth();
  const { colors } = useAppearance();
  const [items, setItems] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);
  useFocusEffect(useCallback(() => {
    // Changing the retry counter should restart the request even if the route stays open.
    void reload;
    if (!session) { setItems([]); setError(''); setLoading(false); return; }
    let active = true;
    setLoading(true);
    setError('');
    setItems([]);
    (async () => {
      const { data, error: savedError } = await supabase.from('saved_campaigns').select('campaign_id').eq('user_id', session.user.id);
      if (savedError) { if (active) { setError(savedError.message); setLoading(false); } return; }
      const ids = (data || []).map((row) => row.campaign_id);
      if (!ids.length) { if (active) { setItems([]); setLoading(false); } return; }
      const result = await supabase.from('campaigns')
        .select('id,title,category,location,story,goal_etb,raised_etb,organizer_name,spending_plan,created_at')
        .in('id', ids).eq('status', 'approved').order('created_at', { ascending: false });
      if (result.error) { if (active) { setError(result.error.message); setLoading(false); } return; }
      const rows = (result.data || []).map((item) => ({
        ...item, location: item.location || 'Ethiopia', goal_etb: Number(item.goal_etb),
        raised_etb: Number(item.raised_etb || 0),
      } as Campaign));
      try {
        const withPhotos = await attachCampaignPhotos(rows);
        if (active) { setItems(withPhotos); setLoading(false); }
      } catch {
        if (active) { setError('Could not load the saved campaign photos.'); setItems(rows); setLoading(false); }
      }
    })();
    return () => { active = false; };
  }, [session, reload]));
  return <Screen>
    <Pressable onPress={() => router.back()}><Txt muted>‹ Back</Txt></Pressable>
    <Txt size={27} weight="700">Saved campaigns</Txt>
    <Txt muted>Keep track of causes you care about.</Txt>
    {!session && <Button label="Sign in to save campaigns" onPress={() => router.push('/auth')} />}
    {items.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}
    {!!error && <Card><Txt size={13}>{error}</Txt><Button label="Try again" onPress={() => setReload((value) => value + 1)} outline /></Card>}
    {!loading && session && !items.length && <Card style={{ alignItems: 'center', paddingVertical: 26 }}>
      <Bookmark size={28} color={colors.navy} /><Txt weight="700">Nothing saved yet</Txt>
      <Txt muted size={13}>Open an approved campaign and tap the bookmark icon.</Txt>
      <Button label="Explore campaigns" onPress={() => router.push('/explore')} />
    </Card>}
    {loading && <Txt muted>Loading saved campaigns…</Txt>}
  </Screen>;
}
