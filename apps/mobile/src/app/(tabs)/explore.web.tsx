import React, { useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Search, SlidersHorizontal, ShieldCheck } from 'lucide-react-native';
import { Txt } from '../../components/primitives';
import { CampaignGrid, SectionHeading, WebAction, WebPage, WebSearch } from '../../components/web-layout';
import { useCampaigns, titleCase } from '../../lib/campaigns';
import { useAppearance } from '../../lib/theme';

const filters = ['all', 'medical', 'education', 'emergency'] as const;
type Filter = (typeof filters)[number];
type Sort = 'newest' | 'goal';

export default function WebExplore() {
  const { colors } = useAppearance();
  const { width } = useWindowDimensions();
  const params = useLocalSearchParams<{ category?: string }>();
  const { live, loading, error, refresh } = useCampaigns();
  const [selected, setSelected] = useState<Filter | null>(null);
  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<Sort>('newest');
  const category: Filter = selected || (filters.includes(params.category as Filter) ? params.category as Filter : 'all');
  const desktop = width >= 940;
  const contentWidth = Math.min(width, 1240) - (width < 600 ? 40 : 64);
  const resultsWidth = desktop ? contentWidth - 268 - 30 : contentWidth;
  const matching = live.filter((item) =>
    (category === 'all' || item.category === category) &&
    [item.title, item.location, item.story, item.organizer_name || ''].join(' ').toLowerCase().includes(search.trim().toLowerCase()))
    .sort((a, b) => sort === 'goal' ? a.goal_etb - b.goal_etb : (b.created_at || '').localeCompare(a.created_at || ''));

  const filterList = <View style={{ gap: 5 }}>
    {filters.map((filter) => <Pressable key={filter} accessibilityRole="button" onPress={() => setSelected(filter)}
      style={{ backgroundColor: category === filter ? colors.soft : 'transparent', borderRadius: 6, paddingVertical: 11,
        paddingHorizontal: 13, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
      <Txt size={14} weight={category === filter ? '700' : '500'} style={{ color: category === filter ? colors.navy : colors.text }}>
        {filter === 'all' ? 'All categories' : titleCase(filter)}
      </Txt>
      <Txt size={12} muted>{filter === 'all' ? live.length : live.filter((item) => item.category === filter).length}</Txt>
    </Pressable>)}
  </View>;

  return <WebPage>
    <View style={{ marginTop: 54, marginBottom: 36, gap: 17 }}>
      <SectionHeading eyebrow="Discover" title="Explore campaigns" description="Search approved fundraising campaigns across Ethiopia." />
    </View>
    <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 30, alignItems: 'flex-start' }}>
      {desktop && <View style={{ width: 268, padding: 22, backgroundColor: colors.surface, borderColor: colors.line,
        borderWidth: 1, borderRadius: 9, gap: 25 }}>
        <View style={{ gap: 11 }}>
          <Txt size={17} weight="700">Filter campaigns</Txt>
          <Txt size={12} muted>Choose a category</Txt>
        </View>
        {filterList}
        <View style={{ borderTopColor: colors.line, borderTopWidth: 1, paddingTop: 22, flexDirection: 'row', gap: 11 }}>
          <ShieldCheck color={colors.navy} size={22} />
          <View style={{ gap: 5, flex: 1 }}>
            <Txt size={13} weight="700">Reviewed listings</Txt>
            <Txt size={12} muted style={{ lineHeight: 19 }}>Campaigns appear after TESFA staff approval.</Txt>
          </View>
        </View>
      </View>}
      <View style={{ flex: 1, width: desktop ? undefined : '100%', gap: 24, minWidth: 0 }}>
        <View style={{ flexDirection: width >= 700 ? 'row' : 'column', gap: 12 }}>
          <WebSearch value={search} onChangeText={setSearch} placeholder="Search by cause, city, or organizer" />
          <Pressable accessibilityRole="button" onPress={() => setSort(sort === 'newest' ? 'goal' : 'newest')}
            style={{ backgroundColor: colors.surface, borderWidth: 1, borderColor: colors.line, borderRadius: 7,
              paddingHorizontal: 18, paddingVertical: 15, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <SlidersHorizontal size={17} color={colors.navy} />
            <Txt size={13} weight="600">{sort === 'newest' ? 'Newest first' : 'Lowest goal first'}</Txt>
          </Pressable>
        </View>
        {!desktop && <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          {filters.map((filter) => <Pressable key={filter} onPress={() => setSelected(filter)}
            style={{ paddingHorizontal: 14, paddingVertical: 10, backgroundColor: category === filter ? colors.navy : colors.surface,
              borderWidth: 1, borderColor: colors.line, borderRadius: 6 }}>
            <Txt size={13} weight="600" style={{ color: category === filter ? (colors.navy === '#173B63' ? '#FFFFFF' : '#101821') : colors.text }}>
              {filter === 'all' ? 'All causes' : titleCase(filter)}
            </Txt>
          </Pressable>)}
        </View>}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt size={15} weight="700">{matching.length} approved {matching.length === 1 ? 'campaign' : 'campaigns'}</Txt>
          <Txt size={12} muted>{category === 'all' ? 'All categories' : titleCase(category)}</Txt>
        </View>
        {loading && <Txt muted>Loading campaigns...</Txt>}
        {!!error && <Pressable accessibilityRole="button" onPress={refresh}><Txt muted>{error} Select to retry.</Txt></Pressable>}
        {!loading && !error && (matching.length
          ? <CampaignGrid campaigns={matching} availableWidth={resultsWidth} />
          : <View style={{ paddingHorizontal: 34, paddingVertical: 75, gap: 14, alignItems: 'center',
            backgroundColor: colors.surface, borderColor: colors.line, borderWidth: 1, borderRadius: 9 }}>
            <Search size={33} color={colors.navy} />
            <Txt size={23} weight="700" style={{ textAlign: 'center' }}>{live.length ? 'No matching campaigns' : 'No published campaigns yet'}</Txt>
            <Txt size={15} muted style={{ textAlign: 'center', maxWidth: 490, lineHeight: 24 }}>
              {live.length ? 'Try another category or search term.' : 'Approved campaigns will appear here as organizations complete the review process.'}
            </Txt>
            {!live.length && <WebAction label="Start a campaign" onPress={() => router.push('/create')} />}
          </View>)}
      </View>
    </View>
  </WebPage>;
}
