import React from 'react';
import { Image, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { BookOpen, HeartPulse, HousePlus, ArrowUpRight, MapPin } from 'lucide-react-native';
import { Card, Txt } from './primitives';
import type { Campaign } from '../lib/campaigns';
import { money, titleCase } from '../lib/campaigns';
import { useAppearance } from '../lib/theme';

const icons = { education: BookOpen, medical: HeartPulse, emergency: HousePlus };

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { colors } = useAppearance();
  const Icon = icons[campaign.category];
  const progress = Math.min(100, (campaign.raised_etb / Math.max(campaign.goal_etb, 1)) * 100);
  return <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/campaign/[id]', params: { id: campaign.id } })}>
    <Card style={{ gap: 0, padding: 0, overflow: 'hidden', borderRadius: 18 }}>
      <View style={{ height: 172, backgroundColor: colors.soft }}>
        {campaign.photo_url
          ? <Image source={{ uri: campaign.photo_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
          : <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}><Icon color={colors.navy} size={46} strokeWidth={1.3} /></View>}
        <View style={{ position: 'absolute', top: 12, left: 12, backgroundColor: colors.surface, borderRadius: 7, paddingHorizontal: 11, paddingVertical: 6 }}>
          <Txt size={11} weight="700">{titleCase(campaign.category)}</Txt>
        </View>
      </View>
      <View style={{ padding: 17, gap: 11 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}><MapPin size={13} color={colors.subtle} /><Txt muted size={12}>{campaign.location}</Txt></View>
        <Txt size={19} weight="700">{campaign.title}</Txt>
        <View style={{ height: 6, backgroundColor: colors.line, borderRadius: 6, overflow: 'hidden' }}>
          <View style={{ height: 6, backgroundColor: colors.progress, width: String(progress) + '%' }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <View><Txt weight="700" size={15}>{money(campaign.raised_etb)}</Txt><Txt muted size={12}>raised of {money(campaign.goal_etb)}</Txt></View>
          <ArrowUpRight color={colors.navy} size={21} />
        </View>
      </View>
    </Card>
  </Pressable>;
}
