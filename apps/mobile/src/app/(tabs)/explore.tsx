import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Search, SlidersHorizontal } from 'lucide-react-native';
import { CampaignCard } from '../../components/campaign-card';
import { Card, Field, Screen, Txt } from '../../components/primitives';
import { useCampaigns } from '../../lib/campaigns';
import { useAppearance } from '../../lib/theme';

const filters = ['all', 'medical', 'education', 'emergency'] as const;
type Sort = 'newest' | 'goal';
export default function Explore() {
  const { colors } = useAppearance();
  const { live, loading, error, refresh } = useCampaigns();
  const [category, setCategory] = useState<(typeof filters)[number]>('all');
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const matching = live.filter((item) =>
    (category === 'all' || item.category === category) &&
    [item.title, item.location, item.story, item.organizer_name || ''].join(' ').toLowerCase().includes(search.trim().toLowerCase())
  ).sort((a, b) => sort === 'goal' ? a.goal_etb - b.goal_etb : (b.created_at || '').localeCompare(a.created_at || ''));
  return <Screen>
    <View style={{ gap: 3 }}><Txt size={27} weight="700">Explore causes</Txt><Txt muted>Find a story you care about.</Txt></View>
    <Field label="Search campaigns" value={search} onChangeText={setSearch} placeholder="Cause, city, organizer" />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {filters.map((option) => <Pressable key={option} accessibilityRole="button" onPress={() => setCategory(option)}
        style={{ paddingHorizontal: 15, paddingVertical: 10, backgroundColor: option === category ? '#173B63' : colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 10 }}>
        <Txt size={13} weight="600" style={{ color: option === category ? '#FFFFFF' : colors.text }}>{option === 'all' ? 'All causes' : option.charAt(0).toUpperCase() + option.slice(1)}</Txt>
      </Pressable>)}
    </View>
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Txt weight="700">{matching.length} approved {matching.length === 1 ? 'campaign' : 'campaigns'}</Txt>
      <Pressable accessibilityRole="button" onPress={() => setSort(sort === 'newest' ? 'goal' : 'newest')} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <SlidersHorizontal color={colors.navy} size={15} /><Txt size={12}>{sort === 'newest' ? 'Newest' : 'Lowest goal'}</Txt>
      </Pressable>
    </View>
    {matching.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}
    {!loading && !matching.length && <Card style={{ paddingVertical: 27, alignItems: 'center', gap: 10 }}>
      <Search size={28} color={colors.navy} />
      <Txt size={17} weight="700">{live.length ? 'No matching causes' : 'No published campaigns yet'}</Txt>
      <Txt muted size={13} style={{ textAlign: 'center' }}>{live.length ? 'Try another search or category.' : 'Campaigns appear here after staff review and approval.'}</Txt>
    </Card>}
    {loading && <Txt muted size={13}>Loading campaigns…</Txt>}
    {!!error && <Pressable onPress={refresh}><Txt muted>{error} Tap to retry.</Txt></Pressable>}
  </Screen>;
}
