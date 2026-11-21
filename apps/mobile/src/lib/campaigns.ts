import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

export type Campaign = {
  id: string; title: string; category: 'medical' | 'education' | 'emergency';
  location: string; story: string; goal_etb: number; raised_etb: number;
  organizer_name?: string | null; spending_plan?: string | null; created_at?: string;
  photo_url?: string | null;
};

export function photoUrl(path: string) {
  return supabase.storage.from('tesfa-campaign-photos').getPublicUrl(path).data.publicUrl;
}

export async function attachCampaignPhotos(rows: Campaign[]): Promise<Campaign[]> {
  if (!rows.length) return [];
  const ids = rows.map((row) => row.id);
  const { data } = await supabase.from('campaign_media')
    .select('campaign_id,storage_path,display_order').in('campaign_id', ids)
    .order('display_order', { ascending: true });
  const first = new Map<string, string>();
  for (const media of data || []) if (!first.has(media.campaign_id)) first.set(media.campaign_id, photoUrl(media.storage_path));
  return rows.map((row) => ({ ...row, photo_url: first.get(row.id) || null }));
}

export function useCampaigns() {
  const [live, setLive] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await supabase.from('campaigns')
      .select('id,title,category,location,story,goal_etb,raised_etb,organizer_name,spending_plan,created_at')
      .eq('status', 'approved').order('created_at', { ascending: false });
    if (result.error) setError('Approved campaigns could not be loaded.');
    else {
      setError('');
      const rows = (result.data || []).map((row) => ({
        ...row, location: row.location || 'Ethiopia',
        goal_etb: Number(row.goal_etb), raised_etb: Number(row.raised_etb || 0),
      } as Campaign));
      setLive(await attachCampaignPhotos(rows));
    }
    setLoading(false);
  }, []);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  return { live, loading, error, refresh };
}

export const money = (amount: number) => 'ETB ' + Math.round(amount).toLocaleString('en-US');
export const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);
