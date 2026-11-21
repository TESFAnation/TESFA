import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, ShieldCheck } from 'lucide-react-native';
import { CampaignCard } from '../../components/campaign-card';
import { Button, Card, Screen, Txt } from '../../components/primitives';
import { demoCampaigns, useCampaigns } from '../../lib/campaigns';
import { useAppearance } from '../../lib/theme';

export default function Home() {
  const { colors } = useAppearance();
  const { live, loading, error } = useCampaigns();
  return <Screen>
    <Txt size={30} weight="800" style={{ letterSpacing: 1.7, color: colors.navy }}>TESFA</Txt>
    <View style={{ gap: 5, paddingTop: 12 }}>
      <Txt size={27} weight="700">Help where it matters.</Txt>
      <Txt muted>Discover fundraising causes across Ethiopia.</Txt>
    </View>
    <Card style={{ backgroundColor: colors.soft, borderWidth: 0 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <ShieldCheck size={22} color={colors.navy} />
        <Txt weight="700">A careful review process</Txt>
      </View>
      <Txt muted size={13}>Campaigns are checked before they can appear publicly. This prototype uses sample evidence only.</Txt>
    </Card>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <Txt size={20} weight="700">Featured causes</Txt>
      <Pressable accessibilityLabel="View all campaigns" onPress={() => router.push('/explore')}><ArrowRight color={colors.navy} size={20} /></Pressable>
    </View>
    {live.slice(0, 2).map((item) => <CampaignCard key={item.id} campaign={item} />)}
    {demoCampaigns.slice(0, 2).map((item) => <CampaignCard key={item.id} campaign={item} />)}
    {loading && <Txt muted size={12}>Checking for new approved campaigns…</Txt>}
    {!!error && <Txt muted size={12}>{error}</Txt>}
    <Button label="Explore all campaigns" onPress={() => router.push('/explore')} outline />
    <Txt muted size={12}>This is a test application. Sample fundraising figures are fictional and no donations are accepted.</Txt>
  </Screen>;
}

