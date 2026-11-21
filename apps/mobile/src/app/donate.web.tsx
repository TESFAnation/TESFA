import React, { useState } from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Banknote, ChevronLeft, ClipboardCheck, ShieldAlert } from 'lucide-react-native';
import { Txt } from '../components/primitives';
import { SectionHeading, WebAction, WebPage } from '../components/web-layout';
import { money } from '../lib/campaigns';
import { useAppearance } from '../lib/theme';

const amounts = [100, 250, 500, 1000, 2500];
const methods = ['Telebirr', 'CBE Birr', 'Bank transfer'];

export default function WebDonate() {
  const { title } = useLocalSearchParams<{ title?: string }>();
  const { colors } = useAppearance();
  const { width } = useWindowDimensions();
  const desktop = width >= 820;
  const [amount, setAmount] = useState(250);
  const [method, setMethod] = useState(methods[0]);
  const [finished, setFinished] = useState(false);

  return <WebPage>
    <Pressable accessibilityRole="link" onPress={() => router.back()} style={{ marginTop: 32,
      flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 27 }}>
      <ChevronLeft color={colors.navy} size={19} /><Txt size={14} weight="700" style={{ color: colors.navy }}>Back to campaign</Txt>
    </Pressable>
    <SectionHeading eyebrow="Payment preview" title={finished ? 'No payment was made' : 'Support this cause'}
      description={title || 'TESFA campaign'} />
    <View style={{ marginTop: 32, flexDirection: desktop ? 'row' : 'column', gap: 25, alignItems: 'flex-start' }}>
      <View style={{ flex: desktop ? 1.5 : undefined, width: desktop ? undefined : '100%', gap: 19 }}>
        <View style={{ padding: width < 600 ? 24 : 32, borderRadius: 9, borderWidth: 1,
          borderColor: colors.line, backgroundColor: colors.surface, gap: 21 }}>
          {!finished ? <>
            <View style={{ gap: 6 }}><Txt size={21} weight="700">Choose an amount</Txt>
              <Txt muted size={14}>All values are in Ethiopian birr.</Txt></View>
            <View style={{ flexDirection: 'row', gap: 10, flexWrap: 'wrap' }}>
              {amounts.map((value) => <Pressable key={value} accessibilityRole="button"
                accessibilityState={{ selected: amount === value }} onPress={() => setAmount(value)}
                style={{ paddingVertical: 15, paddingHorizontal: 18, borderWidth: 1,
                  borderRadius: 7, borderColor: amount === value ? colors.navy : colors.line,
                  backgroundColor: amount === value ? colors.soft : colors.surface, minWidth: 110, alignItems: 'center' }}>
                <Txt size={15} weight="700" style={{ color: amount === value ? colors.navy : colors.text }}>
                  {money(value)}
                </Txt>
              </Pressable>)}
            </View>
            <View style={{ borderTopWidth: 1, borderColor: colors.line, paddingTop: 23, gap: 15 }}>
              <Txt size={21} weight="700">Future payment method</Txt>
              {methods.map((name) => <Pressable key={name} accessibilityRole="button"
                accessibilityState={{ selected: method === name }} onPress={() => setMethod(name)}
                style={{ padding: 16, borderWidth: 1, borderColor: method === name ? colors.navy : colors.line,
                  borderRadius: 7, flexDirection: 'row', gap: 12, backgroundColor: colors.surface }}>
                <Txt size={16} style={{ color: colors.navy }}>{method === name ? '◉' : '○'}</Txt>
                <Txt size={15} weight={method === name ? '700' : '500'}>{name}</Txt>
              </Pressable>)}
            </View>
            <WebAction label={'Preview checkout with ' + method} onPress={() => setFinished(true)} />
          </> : <>
            <ClipboardCheck color={colors.navy} size={42} />
            <Txt size={24} weight="700">Preview complete</Txt>
            <Txt muted size={15} style={{ lineHeight: 25 }}>You selected {money(amount)} and {method}. No account was charged, no contribution was recorded, and no receipt has been issued.</Txt>
            <WebAction label="Return to the campaign" onPress={() => router.back()} />
            <WebAction label="Try another amount" secondary onPress={() => setFinished(false)} />
          </>}
        </View>
      </View>
      <View style={{ width: desktop ? 350 : '100%', gap: 19 }}>
        <View style={{ padding: 28, backgroundColor: colors.soft, borderRadius: 9, gap: 12 }}>
          <ShieldAlert color={colors.navy} size={28} />
          <Txt size={20} weight="700">This is not a checkout</Txt>
          <Txt size={14} muted style={{ lineHeight: 24 }}>TESFA is a functional prototype, but live payments have not been enabled. This screen demonstrates the experience only.</Txt>
          <Txt size={13} weight="700">Nothing will be charged, collected, pledged or transferred.</Txt>
        </View>
        <View style={{ padding: 25, borderRadius: 9, borderWidth: 1,
          borderColor: colors.line, backgroundColor: colors.surface, gap: 15 }}>
          <View style={{ flexDirection: 'row', gap: 9, alignItems: 'center' }}>
            <Banknote color={colors.navy} size={21} /><Txt size={17} weight="700">Preview summary</Txt>
          </View>
          <Txt size={13} muted>Selected amount</Txt><Txt size={29} weight="800">{money(amount)}</Txt>
          <View style={{ borderTopWidth: 1, borderColor: colors.line, paddingTop: 15 }}>
            <Txt size={13} muted>Method: {method}</Txt><Txt size={13} muted>Actual charge: ETB 0</Txt>
          </View>
        </View>
      </View>
    </View>
  </WebPage>;
}
