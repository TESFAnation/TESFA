import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { ArrowRight, BadgeCheck, ClipboardCheck, HeartHandshake, ShieldCheck } from 'lucide-react-native';
import { CampaignCard } from '../../components/campaign-card';
import { Button, Card, Screen, Txt } from '../../components/primitives';
import { useCampaigns } from '../../lib/campaigns';
import { useAppearance } from '../../lib/theme';

export default function Home() {
  const { colors } = useAppearance();
  const { live, loading, error, refresh } = useCampaigns();
  return <Screen>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Txt size={31} weight="800" style={{ letterSpacing: 2, color: colors.navy }}>TESFA</Txt>
      <Pressable onPress={() => router.push('/profile')} accessibilityLabel="Your profile" style={{ width: 39, height: 39, borderRadius: 20, backgroundColor: colors.soft, justifyContent: 'center', alignItems: 'center' }}>
        <HeartHandshake size={20} color={colors.navy} />
      </Pressable>
    </View>
    <Card style={{ backgroundColor: colors.navy === '#173B63' ? '#173B63' : '#203A53', borderWidth: 0, padding: 23, gap: 14, borderRadius: 20 }}>
      <Txt size={12} weight="700" style={{ color: '#C7DCEC', letterSpacing: 1.6 }}>HOPE IN ACTION</Txt>
      <Txt size={29} weight="700" style={{ color: '#FFFFFF', lineHeight: 36 }}>A little help can change everything.</Txt>
      <Txt size={14} style={{ color: '#E0EBF3' }}>Discover causes across Ethiopia, or start a campaign that matters to your community.</Txt>
      <Pressable onPress={() => router.push('/explore')} style={{ backgroundColor: '#FFFFFF', borderRadius: 10, paddingVertical: 13, paddingHorizontal: 15, alignSelf: 'flex-start', flexDirection: 'row', gap: 12, alignItems: 'center' }}>
        <Txt size={14} weight="700" style={{ color: '#173B63' }}>Explore campaigns</Txt><ArrowRight color="#173B63" size={17} />
      </Pressable>
    </Card>
    <View style={{ flexDirection: 'row', gap: 10 }}>
      <Card style={{ flex: 1, padding: 14, gap: 6 }}><BadgeCheck size={21} color={colors.navy} /><Txt size={13} weight="700">Reviewed before listing</Txt></Card>
      <Card style={{ flex: 1, padding: 14, gap: 6 }}><ClipboardCheck size={21} color={colors.navy} /><Txt size={13} weight="700">Evidence required</Txt></Card>
    </View>
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 9 }}>
      <View style={{ gap: 3 }}><Txt size={21} weight="700">Latest campaigns</Txt><Txt size={12} muted>Approved causes you can explore</Txt></View>
      <Pressable accessibilityLabel="View all campaigns" onPress={() => router.push('/explore')}><ArrowRight color={colors.navy} size={22} /></Pressable>
    </View>
    {live.slice(0, 3).map((item) => <CampaignCard key={item.id} campaign={item} />)}
    {!loading && !error && !live.length && <Card style={{ alignItems: 'center', paddingVertical: 28, gap: 10 }}>
      <ShieldCheck size={33} color={colors.navy} />
      <Txt size={17} weight="700" style={{ textAlign: 'center' }}>The first campaigns are on their way</Txt>
      <Txt muted size={13} style={{ textAlign: 'center' }}>Only campaigns approved by a TESFA reviewer appear here. There are none published yet.</Txt>
      <Button label="Start a campaign" onPress={() => router.push('/create')} />
    </Card>}
    {loading && <Txt muted size={13}>Loading approved campaigns…</Txt>}
    {!!error && <Pressable onPress={refresh}><Txt muted size={13}>{error} Tap to retry.</Txt></Pressable>}
    {live.length > 0 && <Button label="See all campaigns" onPress={() => router.push('/explore')} outline />}
    <Card style={{ backgroundColor: colors.soft, borderWidth: 0, gap: 11, marginTop: 10 }}>
      <Txt size={19} weight="700">Have a cause in mind?</Txt>
      <Txt muted size={13}>Create your application, add photos and supporting evidence, then send it for review.</Txt>
      <Button label="Create a campaign" onPress={() => router.push('/create')} />
    </Card>
    <Txt size={12} muted>TESFA is in testing. Donations are previews only and no payments are collected.</Txt>
  </Screen>;
}
