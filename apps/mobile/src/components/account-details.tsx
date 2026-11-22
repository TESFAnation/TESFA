import React, { useEffect, useState } from 'react';
import { View } from 'react-native';
import { Button, Field, Txt } from './primitives';
import { useAuth } from '../lib/auth';
import { supabase } from '../lib/supabase';

export function AccountDetails() {
  const { session } = useAuth();
  const userId = session?.user.id;
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    let active = true;
    if (!userId) return;
    void supabase.from('profiles').select('display_name').eq('id', userId).maybeSingle()
      .then(({ data, error }) => {
        if (!active) return;
        setDisplayName(data?.display_name || '');
        setMessage(error?.message || '');
        setLoading(false);
      });
    return () => { active = false; };
  }, [userId]);

  if (!userId) return null;

  async function save() {
    if (!userId || saving) return;
    const name = displayName.trim();
    if (name.length > 80) { setMessage('Use a name of 80 characters or fewer.'); return; }
    setSaving(true); setMessage('');
    const { error } = await supabase.from('profiles').upsert({
      id: userId, display_name: name || null,
    }, { onConflict: 'id' });
    setSaving(false);
    setMessage(error?.message || 'Account details saved.');
  }

  return <View style={{ gap: 12 }}>
    <Txt size={17} weight="700">Account details</Txt>
    <Txt muted size={12}>Save the name you want associated with your TESFA account. Phone verification is not available yet.</Txt>
    {loading ? <Txt muted size={13}>Loading account details…</Txt> : <>
      <Field label="Display name" placeholder="Your name" value={displayName} onChangeText={setDisplayName} />
      <Button label={saving ? 'Saving…' : 'Save account details'} onPress={() => { void save(); }} disabled={saving} outline />
    </>}
    {!!message && <Txt size={13}>{message}</Txt>}
  </View>;
}
