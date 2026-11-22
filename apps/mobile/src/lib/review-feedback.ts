import { supabase } from './supabase';

export type ReviewFeedback = {
  decision: string;
  notes: string | null;
  created_at: string;
};

export async function latestCampaignFeedback(campaignIds: string[]): Promise<Record<string, ReviewFeedback>> {
  if (!campaignIds.length) return {};
  const { data, error } = await supabase.from('review_events')
    .select('campaign_id,decision,notes,created_at')
    .in('campaign_id', campaignIds)
    .order('created_at', { ascending: false });
  if (error) return {};
  const latest: Record<string, ReviewFeedback> = {};
  for (const item of data || []) {
    if (!latest[item.campaign_id]) latest[item.campaign_id] = {
      decision: item.decision, notes: item.notes, created_at: item.created_at,
    };
  }
  return latest;
}

export async function latestOrganizationFeedback(organizationIds: string[]): Promise<Record<string, ReviewFeedback>> {
  if (!organizationIds.length) return {};
  const { data, error } = await supabase.from('organization_review_events')
    .select('organization_id,decision,notes,created_at')
    .in('organization_id', organizationIds)
    .order('created_at', { ascending: false });
  if (error) return {};
  const latest: Record<string, ReviewFeedback> = {};
  for (const item of data || []) {
    if (!latest[item.organization_id]) latest[item.organization_id] = {
      decision: item.decision, notes: item.notes, created_at: item.created_at,
    };
  }
  return latest;
}
