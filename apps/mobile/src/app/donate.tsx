import React, { useState } from 'react';
import { View, Pressable } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Button, Card, Screen, Txt } from '../components/primitives';
import { money } from '../lib/campaigns';
import { useAppearance } from '../lib/theme';

const amounts = [100, 250, 500, 1000];
const methods = ['Telebirr', 'CBE Birr', 'Bank transfer'];

export default function Donate() {
  const { title } = useLocalSearchParams<{ title: string }>();
  const { colors } = useAppearance();
  const [amount, setAmount] = useState(250);
  const [method, setMethod] = useState('Telebirr');
  const [finished, setFinished] = useState(false);
  return <Screen>
    <Pressable onPress={() => router.back()}><Txt muted>‹ Back to campaign</Txt></Pressable>
    <Txt muted size={12} weight="700">PAYMENT PREVIEW ONLY</Txt>
    <Txt size={26} weight="700">{finished ? 'No payment was made' : 'Support this cause'}</Txt>
    <Txt muted>{title || 'TESFA campaign'}</Txt>
    <Card style={{ backgroundColor: colors.soft, borderWidth: 0 }}>
      <Txt weight="700">Prototype notice</Txt>
      <Txt size={13} muted>These screens illustrate a future payment flow. No money is collected, no pledge is recorded, and no receipt is issued.</Txt>
    </Card>
    {!finished ? <>
      <Txt size={18} weight="700">Choose an amount</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {amounts.map((value) => <Pressable key={value} onPress={() => setAmount(value)} style={{ width: '47%', backgroundColor: amount === value ? '#173B63' : colors.surface, padding: 16, borderRadius: 10, alignItems: 'center', borderColor: colors.line, borderWidth: 1 }}>
          <Txt weight="700" style={{ color: amount === value ? '#FFFFFF' : colors.text }}>{money(value)}</Txt>
        </Pressable>)}
      </View>
      <Txt size={18} weight="700">Payment method preview</Txt>
      {methods.map((name) => <Pressable key={name} onPress={() => setMethod(name)} style={{ padding: 15, backgroundColor: colors.surface, borderRadius: 10, borderColor: method === name ? colors.navy : colors.line, borderWidth: 1 }}>
        <Txt>{method === name ? '●  ' : '○  '}{name}</Txt>
      </Pressable>)}
      <Button label={'Continue demo with ' + method} onPress={() => setFinished(true)} />
    </> : <>
      <Txt>No money was charged. Your selected amount of {money(amount)} was only a preview.</Txt>
      <Button label="Return to campaign" onPress={() => router.back()} />
    </>}
  </Screen>;
}

