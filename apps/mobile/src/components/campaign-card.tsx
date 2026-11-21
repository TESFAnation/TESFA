import React from 'react';
import { Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { BookOpen, HeartPulse, HousePlus, ArrowUpRight } from 'lucide-react-native';
import { Card, Txt } from './primitives';
import type { Campaign } from '../lib/campaigns';
import { money, titleCase } from '../lib/campaigns';
import { useAppearance } from '../lib/theme';

const icons = { education: BookOpen, medical: HeartPulse, emergency: HousePlus };

export function CampaignCard({ campaign }: { campaign: Campaign }) {
  const { colors } = useAppearance();
  const Icon = icons[campaign.category];
  const progress = Math.min(100, (campaign.raised_etb / campaign.goal_etb) * 100);
  return <Pressable accessibilityRole="button" onPress={() => router.push({ pathname: '/campaign/[id]', params: { id: campaign.id } })}>
    <Card style={{ gap: 13, padding: 0, overflow: 'hidden' }}>
      <View style={{ height: 90, backgroundColor: colors.soft, justifyContent: 'space-between', flexDirection: 'row', padding: 16 }}>
        <Icon color={colors.navy} size={31} strokeWidth={1.4} />
        {campaign.demo && <View style={{ backgroundColor: colors.surface, borderRadius: 6, paddingHorizontal: 9, paddingVertical: 5, alignSelf: 'flex-start' }}><Txt size={10} weight="700">SAMPLE</Txt></View>}
      </View>
      <View style={{ paddingHorizontal: 17, paddingBottom: 17, gap: 9 }}>
        <Txt muted size={11} weight="700" style={{ letterSpacing: 1.1 }}>{titleCase(campaign.category)}  ·  {campaign.location}</Txt>
        <Txt size={18} weight="700">{campaign.title}</Txt>
        <View style={{ height: 5, backgroundColor: colors.line, borderRadius: 5, overflow: 'hidden' }}>
          <View style={{ height: 5, backgroundColor: colors.progress, width: String(progress) + '%' }} />
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt size={12} muted>{campaign.demo ? 'Demo raised' : 'Raised'} {money(campaign.raised_etb)} / {money(campaign.goal_etb)}</Txt>
          <ArrowUpRight color={colors.navy} size={17} />
        </View>
      </View>
    </Card>
  </Pressable>;
}

