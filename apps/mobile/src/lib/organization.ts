import { useCallback, useEffect, useState } from 'react';
import { useAuth } from './auth';
import { supabase } from './supabase';

export type OrganizationRecord = {
  id: string;
  name: string;
  registration_reference: string;
  note: string;
  status: 'pending' | 'needs_info' | 'approved' | 'rejected';
  created_at: string;
};

export function useOrganizations() {
  const { session } = useAuth();
  const [items, setItems] = useState<OrganizationRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const refresh = useCallback(async () => {
    if (!session) {
      setItems([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await supabase.from('organizations')
      .select('id,name,registration_reference,note,status,created_at')
      .eq('owner_id', session.user.id)
      .order('created_at', { ascending: false });
    setItems((result.data || []) as OrganizationRecord[]);
    setError(result.error?.message || '');
    setLoading(false);
  }, [session]);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  const approved = items.find((item) => item.status === 'approved') || null;
  const pending = items.find((item) => item.status === 'pending') || null;
  return { items, approved, pending, loading, error, refresh };
}

export const organizationStatusLabel = (status: OrganizationRecord['status']) =>
  ({ pending: 'Awaiting review', needs_info: 'More information needed', approved: 'Approved', rejected: 'Not approved' })[status];
