import { useCallback, useEffect, useRef, useState } from 'react';
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
  const requestId = useRef(0);
  const userId = session?.user.id;
  const refresh = useCallback(async () => {
    const current = ++requestId.current;
    if (!userId) {
      setItems([]);
      setError('');
      setLoading(false);
      return;
    }
    setLoading(true);
    const result = await supabase.from('organizations')
      .select('id,name,registration_reference,note,status,created_at')
      .eq('owner_id', userId)
      .order('created_at', { ascending: false });
    if (current !== requestId.current) return;
    setItems((result.data || []) as OrganizationRecord[]);
    setError(result.error?.message || '');
    setLoading(false);
  }, [userId]);
  useEffect(() => { void Promise.resolve().then(refresh); }, [refresh]);
  const approved = items.find((item) => item.status === 'approved') || null;
  const pending = items.find((item) => item.status === 'pending') || null;
  return { items, approved, pending, loading, error, refresh };
}

export const organizationStatusLabel = (status: OrganizationRecord['status']) =>
  ({ pending: 'Awaiting review', needs_info: 'More information needed', approved: 'Approved', rejected: 'Not approved' })[status];
