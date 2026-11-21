import React, { useState } from 'react';
import { Pressable, View } from 'react-native';
import { CampaignCard } from '../../components/campaign-card';
import { Field, Screen, Txt } from '../../components/primitives';
import { demoCampaigns, useCampaigns } from '../../lib/campaigns';
import { useAppearance } from '../../lib/theme';

const filters = ['all', 'medical', 'education', 'emergency'] as const;
export default function Explore() {
  const { colors } = useAppearance();
  const { live, loading, error, refresh } = useCampaigns();
  const [category, setCategory] = useState<(typeof filters)[number]>('all');
  const [search, setSearch] = useState('');
  const matching = [...live, ...demoCampaigns].filter((item) =>
    (category === 'all' || item.category === category) &&
    [item.title, item.location, item.story].join(' ').toLowerCase().includes(search.trim().toLowerCase())
  );
  return <Screen>
    <Txt size={26} weight="700">Explore</Txt>
    <Field label="Search" value={search} onChangeText={setSearch} placeholder="Cause, place, or keyword" />
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 7 }}>
      {filters.map((option) => <Pressable key={option} accessibilityRole="button" onPress={() => setCategory(option)}
        style={{ paddingHorizontal: 14, paddingVertical: 9, backgroundColor: option === category ? '#173B63' : colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 20 }}>
        <Txt size={12} weight="600" style={{ color: option === category ? '#FFFFFF' : colors.text }}>{option === 'all' ? 'All' : option.charAt(0).toUpperCase() + option.slice(1)}</Txt>
      </Pressable>)}
    </View>
    <View style={{ gap: 5 }}>
      <Txt size={19} weight="700">Campaigns</Txt>
      <Txt size={12} muted>Approved campaigns and clearly marked fictional samples.</Txt>
    </View>
    {matching.map((campaign) => <CampaignCard key={campaign.id} campaign={campaign} />)}
    {!matching.length && <Txt muted>No matching campaigns found.</Txt>}
    {loading && <Txt muted size={12}>Loading…</Txt>}
    {!!error && <Pressable onPress={refresh}><Txt muted size={12}>{error} Tap to retry.</Txt></Pressable>}
  </Screen>;
}

