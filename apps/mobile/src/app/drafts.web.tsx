import React, { useCallback, useState } from 'react';
import { Pressable, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { FilePenLine, Plus, ShieldCheck } from 'lucide-react-native';
import { SectionHeading, WebAction, WebPage } from '../components/web-layout';
import { Txt } from '../components/primitives';
import { useAppearance } from '../lib/theme';
import { useAuth } from '../lib/auth';
import { money, titleCase } from '../lib/campaigns';
import { supabase } from '../lib/supabase';
import { latestCampaignFeedback, type ReviewFeedback } from '../lib/review-feedback';

type Mine = { id: string; title: string; category: string; goal_etb: number; status: string; created_at: string };
const labels: Record<string, string> = {
  draft: 'Draft', submitted: 'Awaiting review', needs_info: 'Needs information', approved: 'Approved',
  rejected: 'Rejected', suspended: 'Suspended', closed: 'Closed',
};

export default function MyCampaignsWeb() {
  const { session } = useAuth();
  const { colors } = useAppearance();
  const [items, setItems] = useState<Mine[]>([]);
  const [feedback, setFeedback] = useState<Record<string, ReviewFeedback>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    if (!session) { setItems([]); setLoading(false); return; }
    setLoading(true);
    const result = await supabase.from('campaigns')
      .select('id,title,category,goal_etb,status,created_at')
      .eq('owner_id', session.user.id).order('created_at', { ascending: false });
    const rows = (result.data || []) as Mine[];
    setError(result.error?.message || '');
    setItems(rows);
    setFeedback(await latestCampaignFeedback(rows.map((row) => row.id)));
    setLoading(false);
  }, [session]);
  useFocusEffect(useCallback(() => { void refresh(); }, [refresh]));

  const active = items.filter((item) => ['draft', 'needs_info'].includes(item.status)).length;
  const waiting = items.filter((item) => item.status === 'submitted').length;
  const approved = items.filter((item) => item.status === 'approved').length;

  return <WebPage>
    <View style={{ marginTop: 54, flexDirection: 'row', flexWrap: 'wrap', gap: 18, justifyContent: 'space-between', alignItems: 'flex-end' }}>
      <SectionHeading eyebrow="Organizer workspace" title="My campaigns"
        description="Drafts, applications awaiting review, and published campaigns." />
      <WebAction label="New campaign" onPress={() => router.push('/create')} />
    </View>
    {!session ? <View style={{ marginTop: 34, padding: 55, backgroundColor: colors.surface,
      borderWidth: 1, borderColor: colors.line, borderRadius: 9, gap: 15, alignItems: 'center' }}>
      <FilePenLine color={colors.navy} size={36} /><Txt size={21} weight="700">Sign in to manage applications</Txt>
      <WebAction label="Sign in" onPress={() => router.push('/auth')} />
    </View> : <>
      <View style={{ flexDirection: 'row', gap: 17, flexWrap: 'wrap', marginTop: 34 }}>
        {[
          { label: 'Drafts and changes', value: active },
          { label: 'Awaiting review', value: waiting },
          { label: 'Approved', value: approved },
        ].map((item) => <View key={item.label} style={{ flex: 1, minWidth: 190, padding: 25,
          borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, borderRadius: 9, gap: 8 }}>
          <Txt muted size={13}>{item.label}</Txt><Txt size={32} weight="800">{item.value}</Txt>
        </View>)}
      </View>
      <View style={{ marginTop: 26, borderWidth: 1, borderColor: colors.line, borderRadius: 9,
        backgroundColor: colors.surface, padding: 24, gap: 14 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Txt size={21} weight="700">Applications</Txt><Txt size={13} muted>{items.length} total</Txt>
        </View>
        {loading && <Txt muted>Loading applications...</Txt>}
        {!!error && <Pressable onPress={refresh}><Txt muted>{error} Select to retry.</Txt></Pressable>}
        {!loading && !error && items.map((item) => <View key={item.id}
          style={{ paddingVertical: 20, borderTopWidth: 1, borderColor: colors.line, flexDirection: 'row',
            flexWrap: 'wrap', alignItems: 'center', gap: 20, justifyContent: 'space-between' }}>
          <View style={{ flex: 1, minWidth: 220, gap: 6 }}>
            <Txt size={17} weight="700">{item.title}</Txt>
            <Txt muted size={13}>{titleCase(item.category)} · {money(Number(item.goal_etb))} · {new Date(item.created_at).toLocaleDateString('en-GB')}</Txt>
            {!!feedback[item.id]?.notes && <View style={{ backgroundColor: colors.soft, borderRadius: 6, padding: 12, gap: 5, marginTop: 8 }}>
              <Txt size={12} weight="700" style={{ color: colors.navy }}>Reviewer feedback</Txt>
              <Txt size={13}>{feedback[item.id].notes}</Txt>
            </View>}
          </View>
          <View style={{ backgroundColor: colors.soft, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 5 }}>
            <Txt size={12} weight="700" style={{ color: colors.navy }}>{labels[item.status] || item.status}</Txt>
          </View>
          {['draft', 'needs_info'].includes(item.status) && <WebAction label="Continue editing"
            onPress={() => router.push({ pathname: '/create', params: { edit: item.id } })} secondary />}
          {item.status === 'approved' && <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
            <WebAction label="View campaign" secondary onPress={() => router.push({ pathname: '/campaign/[id]', params: { id: item.id } })} />
            <WebAction label="Post update" onPress={() => router.push({ pathname: '/updates', params: { campaignId: item.id } })} />
          </View>}
        </View>)}
        {!loading && !error && !items.length && <View style={{ paddingVertical: 44, alignItems: 'center', gap: 12 }}>
          <Plus color={colors.navy} size={33} /><Txt size={20} weight="700">No campaigns yet</Txt>
          <Txt size={14} muted>Start a private draft when you are ready.</Txt>
          <WebAction label="Create a campaign" onPress={() => router.push('/create')} />
        </View>}
      </View>
      <View style={{ backgroundColor: colors.soft, borderRadius: 9, marginTop: 24, padding: 23, flexDirection: 'row', gap: 14 }}>
        <ShieldCheck color={colors.navy} size={23} />
        <View style={{ flex: 1, gap: 5 }}>
          <Txt weight="700">Private until staff approval</Txt>
          <Txt muted size={13}>Submitting a campaign does not make it public. Only approved applications appear on TESFA.</Txt>
        </View>
      </View>
    </>}
  </WebPage>;
}
