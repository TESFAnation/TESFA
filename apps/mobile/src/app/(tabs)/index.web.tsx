import React from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { BookOpen, ClipboardCheck, HeartPulse, HousePlus, ShieldCheck } from 'lucide-react-native';
import { Txt } from '../../components/primitives';
import { CampaignGrid, SectionHeading, WebAction, WebPage } from '../../components/web-layout';
import { useCampaigns } from '../../lib/campaigns';
import { useAppearance } from '../../lib/theme';

const causeTypes = [
  { label: 'Medical', category: 'medical', Icon: HeartPulse },
  { label: 'Education', category: 'education', Icon: BookOpen },
  { label: 'Emergency relief', category: 'emergency', Icon: HousePlus },
] as const;

export default function WebHome() {
  const { colors } = useAppearance();
  const { width } = useWindowDimensions();
  const { live, loading, error, refresh } = useCampaigns();
  const desktop = width >= 840;
  const large = width >= 1100;
  return <WebPage>
    <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 0, marginTop: 32, backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.line, borderRadius: 10, overflow: 'hidden' }}>
      <View style={{ flex: desktop ? 1.25 : undefined, paddingVertical: large ? 72 : 47,
        paddingHorizontal: large ? 60 : width < 600 ? 25 : 40, gap: 22, justifyContent: 'center' }}>
        <Txt size={12} weight="800" style={{ letterSpacing: 1.5, color: colors.navy }}>CROWDFUNDING IN ETHIOPIA</Txt>
        <Txt size={large ? 53 : width < 600 ? 37 : 44} weight="700"
          style={{ lineHeight: large ? 62 : width < 600 ? 46 : 54, letterSpacing: -1.6, maxWidth: 670 }}>
          Support a cause. Make a difference where it matters.
        </Txt>
        <Txt size={17} muted style={{ lineHeight: 28, maxWidth: 540 }}>
          Discover fundraising campaigns from organizations across Ethiopia. Each campaign is reviewed before it appears on TESFA.
        </Txt>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
          <WebAction label="Explore campaigns" onPress={() => router.push('/explore')} />
          <WebAction label="Start a campaign" secondary onPress={() => router.push('/create')} />
        </View>
      </View>
      <View style={{ flex: desktop ? 0.84 : undefined, backgroundColor: '#173B63', paddingHorizontal: large ? 47 : 30,
        paddingVertical: large ? 61 : 40, justifyContent: 'center', gap: 26 }}>
        <Txt size={12} weight="800" style={{ color: '#C4DBED', letterSpacing: 1.5 }}>THE TESFA PROCESS</Txt>
        <Txt size={30} weight="700" style={{ color: '#FFFFFF', lineHeight: 39 }}>Every published cause has a review behind it.</Txt>
        {[
          { Icon: ClipboardCheck, title: 'Organizers submit evidence', body: 'Organizations include supporting documents and a clear funding plan.' },
          { Icon: ShieldCheck, title: 'TESFA staff review applications', body: 'Only campaigns that pass staff review can be published.' },
          { Icon: HeartPulse, title: 'Supporters follow the story', body: 'Published updates help people stay informed.' },
        ].map(({ Icon, title, body }) => <View key={title} style={{ flexDirection: 'row', gap: 15, borderTopWidth: 1,
          borderTopColor: '#47627E', paddingTop: 18 }}>
          <Icon color="#B6D4E9" size={23} />
          <View style={{ flex: 1, gap: 5 }}><Txt size={15} weight="700" style={{ color: '#FFFFFF' }}>{title}</Txt>
            <Txt size={13} style={{ color: '#D5E4EF', lineHeight: 21 }}>{body}</Txt></View>
        </View>)}
      </View>
    </View>

    <View style={{ marginTop: 75, gap: 24 }}>
      <SectionHeading eyebrow="Find a cause" title="Explore by category" description="Choose the kind of support you want to learn about." />
      <View style={{ flexDirection: width >= 710 ? 'row' : 'column', gap: 16 }}>
        {causeTypes.map(({ category, label, Icon }) => <Pressable key={category} accessibilityRole="link" onPress={() => router.push({ pathname: '/explore', params: { category } })}
          style={{ flex: 1, backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line,
            borderRadius: 8, paddingHorizontal: 24, paddingVertical: 25, gap: 20 }}>
          <Icon size={30} color={colors.navy} strokeWidth={1.6} />
          <View style={{ gap: 4 }}><Txt size={18} weight="700">{label}</Txt>
            <Txt size={13} muted>{live.filter((item) => item.category === category).length} approved campaigns</Txt></View>
        </Pressable>)}
      </View>
    </View>

    <View style={{ marginTop: 83, gap: 25 }}>
      <SectionHeading eyebrow="Campaigns" title="Recently approved" description="Real campaigns appear here after the review process."
        action="View all campaigns" onAction={() => router.push('/explore')} />
      {loading && <Txt muted>Loading approved campaigns...</Txt>}
      {!!error && <Pressable accessibilityRole="button" onPress={refresh}><Txt muted>{error} Select to retry.</Txt></Pressable>}
      {!loading && !error && (live.length
        ? <CampaignGrid campaigns={live.slice(0, 6)} />
        : <View style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 9,
          padding: width < 600 ? 28 : 45, flexDirection: width >= 720 ? 'row' : 'column', gap: 26,
          alignItems: width >= 720 ? 'center' : 'flex-start', justifyContent: 'space-between' }}>
          <View style={{ gap: 8, maxWidth: 600 }}>
            <Txt size={23} weight="700">No published campaigns yet</Txt>
            <Txt size={15} muted style={{ lineHeight: 24 }}>
              Campaigns will appear here once a TESFA reviewer has approved them. Organizations can submit applications now.
            </Txt>
          </View>
          <WebAction label="Submit a campaign" onPress={() => router.push('/create')} />
        </View>)}
    </View>

    <View style={{ marginTop: 84, paddingHorizontal: width < 600 ? 25 : 46, paddingVertical: 43,
      backgroundColor: colors.soft, borderRadius: 9, flexDirection: desktop ? 'row' : 'column',
      alignItems: desktop ? 'center' : 'flex-start', justifyContent: 'space-between', gap: 26 }}>
      <View style={{ gap: 10, flex: 1 }}>
        <Txt size={12} weight="800" style={{ color: colors.navy, letterSpacing: 1.2 }}>FOR ORGANIZATIONS</Txt>
        <Txt size={width < 600 ? 24 : 31} weight="700">Have a cause that needs support?</Txt>
        <Txt size={15} muted style={{ maxWidth: 700, lineHeight: 24 }}>Create an account, tell your story, upload photos and evidence, and submit your campaign for review.</Txt>
      </View>
      <WebAction label="Create your campaign" onPress={() => router.push('/create')} />
    </View>
  </WebPage>;
}
