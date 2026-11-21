import { useCallback, useEffect, useState } from 'react';
import { supabase } from './supabase';

export type Campaign = {
  id: string; title: string; category: 'medical' | 'education' | 'emergency';
  location: string; story: string; goal_etb: number; raised_etb: number;
  demo?: boolean;
};

export const demoCampaigns: Campaign[] = [
  {
    id: 'sample-school', title: 'Keep a student in school', category: 'education',
    location: 'Addis Ababa', goal_etb: 48000, raised_etb: 16500, demo: true,
    story: 'This is a fictional example. The campaign represents the cost of books, transport, and school fees for a student who wants to finish secondary school. No real student or school is involved.',
  },
  {
    id: 'sample-hospital', title: 'Help cover treatment costs', category: 'medical',
    location: 'Bahir Dar', goal_etb: 120000, raised_etb: 54000, demo: true,
    story: 'This sample story illustrates how a family could request assistance with medical expenses and travel. All names, costs, and fundraising totals are invented for the TESFA prototype.',
  },
  {
    id: 'sample-emergency', title: 'Emergency housing support', category: 'emergency',
    location: 'Hawassa', goal_etb: 76000, raised_etb: 21000, demo: true,
    story: 'This is a fictional emergency campaign to demonstrate the application. It does not represent a real family or an ongoing fundraiser.',
  },
];

export function useCampaigns() {
  const [live, setLive] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    setLoading(true);
    const result = await supabase.from('campaigns')
      .select('id,title,category,location,story,goal_etb,raised_etb')
      .eq('status', 'approved').order('created_at', { ascending: false });
    if (result.error) setError('Approved campaigns could not be loaded.');
    else {
      setError('');
      setLive((result.data || []).map((row) => ({
        ...row, location: row.location || 'Ethiopia',
        goal_etb: Number(row.goal_etb), raised_etb: Number(row.raised_etb || 0),
      } as Campaign)));
    }
    setLoading(false);
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  return { live, loading, error, refresh };
}

export const money = (amount: number) => 'ETB ' + Math.round(amount).toLocaleString('en-US');
export const titleCase = (value: string) => value.charAt(0).toUpperCase() + value.slice(1);

