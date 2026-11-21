import React, { useCallback, useState } from 'react';
import { Pressable } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { Button, Card, Screen, Txt } from '../components/primitives';
import { supabase } from '../lib/supabase';
import { useAuth } from '../lib/auth';
import { money, titleCase } from '../lib/campaigns';

type Mine = { id: string; title: string; category: string; goal_etb: number; status: string };
export default function Drafts() {
  const { session } = useAuth();
  const [items, setItems] = useState<Mine[]>([]);
  const [error, setError] = useState('');
  useFocusEffect(useCallback(() => {
    if (!session) return;
    let active = true;
    supabase.from('campaigns').select('id,title,category,goal_etb,status')
      .eq('owner_id', session.user.id).order('created_at', { ascending: false }).then(({ data, error }) => {
        if (active) {
          setItems((data || []) as Mine[]);
          setError(error?.message || '');
        }
      });
    return () => { active = false; };
  }, [session]));
  return <Screen>
    <Pressable onPress={() => router.back()}><Txt muted>‹ Back</Txt></Pressable>
    <Txt size={26} weight="700">My campaigns</Txt>
    {!session ? <Button label="Sign in" onPress={() => router.push('/auth')} /> : <>
      <Txt muted>Campaigns remain private until TESFA approves them.</Txt>
      {items.map((item) => <Card key={item.id}>
        <Txt size={18} weight="700">{item.title}</Txt>
        <Txt muted size={12}>{titleCase(item.category)}  ·  {money(Number(item.goal_etb))}</Txt>
        <Txt size={13} weight="700">Status: {item.status.replace('_', ' ')}</Txt>
      </Card>)}
      {!items.length && <Txt muted>You have no applications yet.</Txt>}
      {!!error && <Txt muted>{error}</Txt>}
      <Button label="Start another campaign" onPress={() => router.push('/create')} outline />
    </>}
  </Screen>;
}

