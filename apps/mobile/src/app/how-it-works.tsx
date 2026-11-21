import React from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Building2, ClipboardList, FileCheck2, ShieldCheck } from 'lucide-react-native';
import { Button, Card, Screen, Txt } from '../components/primitives';
import { useAppearance } from '../lib/theme';

const steps = [
  { Icon: Building2, title: '1. Register an organization', body: 'Create a TESFA account, then submit an organization name, registration reference, and background for staff review.' },
  { Icon: ClipboardList, title: '2. Prepare a campaign', body: 'Add the cause, location, fundraising goal, clear spending plan, photographs, and supporting documents.' },
  { Icon: FileCheck2, title: '3. Submit evidence', body: 'A poverty certificate is one option. Relevant hospital, school, or local administration letters may also support the application. Supporting files are private.' },
  { Icon: ShieldCheck, title: '4. Wait for a staff decision', body: 'TESFA staff check the application. Only approved campaigns are publicly listed. Organizers can share approved progress updates.' },
] as const;

const questions = [
  { question: 'Does TESFA guarantee that a campaign is genuine?', answer: 'No. TESFA staff review applications and uploaded material, but this prototype does not independently authenticate government certificates, medical records, or identities. Donors should understand that limitation.' },
  { question: 'Who can create a campaign?', answer: 'Organizations can prepare private drafts. An organization must be approved by TESFA staff before submitting a campaign for public review.' },
  { question: 'Can a campaign use evidence other than a poverty certificate?', answer: 'Yes. Organizers can submit other relevant evidence, such as a letter from a hospital, school, or local administration. Staff decide whether it is sufficient for review.' },
  { question: 'Can people donate money right now?', answer: 'No. The payment screens are previews. TESFA does not take payments, store card details, make transfers, or issue donation receipts in this version.' },
  { question: 'Are supporting documents public?', answer: 'No. Evidence files use private storage and access controls for the uploader and authorized TESFA reviewers. Public campaign photographs are separate.' },
  { question: 'What happens if an application needs changes?', answer: 'Staff can request more information. The organizer can edit the private application and submit it again.' },
] as const;

export default function HowItWorks() {
  const { colors } = useAppearance();
  const { width } = useWindowDimensions();
  const desktop = width >= 850;
  const stepWidth = desktop ? '48.7%' : '100%';
  return <Screen webWidth={1120}>
    <Pressable accessibilityRole="link" onPress={() => router.push('/')}><Txt muted size={13}>Back to TESFA</Txt></Pressable>
    <View style={{ gap: 10, maxWidth: 780, marginTop: 14, marginBottom: 21 }}>
      <Txt size={12} weight="800" style={{ color: colors.navy, letterSpacing: 1.3 }}>THE TESFA PROCESS</Txt>
      <Txt size={desktop ? 39 : 30} weight="700">How campaign review works</Txt>
      <Txt muted size={16} style={{ lineHeight: 26 }}>
        TESFA is designed for fundraising applications from Ethiopian organizations. Here is what happens before a campaign becomes public.
      </Txt>
    </View>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 16 }}>
      {steps.map(({ Icon, title, body }) => <Card key={title} style={{ width: stepWidth, minHeight: desktop ? 215 : undefined,
        padding: 25, borderRadius: 9, gap: 15 }}>
        <Icon size={27} color={colors.navy} strokeWidth={1.7} />
        <Txt size={19} weight="700">{title}</Txt>
        <Txt size={14} muted style={{ lineHeight: 24 }}>{body}</Txt>
      </Card>)}
    </View>
    <Card style={{ padding: 25, backgroundColor: colors.soft, borderWidth: 0, borderRadius: 9, gap: 12, marginTop: 15 }}>
      <Txt size={20} weight="700">Important while TESFA is in testing</Txt>
      <Txt size={15} style={{ lineHeight: 25 }}>
        Please use fictional, non-sensitive documents. Do not upload real identity documents or confidential medical records. Payment processing and phone verification are not active.
      </Txt>
    </Card>
    <View style={{ marginTop: 35, marginBottom: 8, gap: 6 }}>
      <Txt size={27} weight="700">Questions people ask</Txt>
      <Txt muted size={14}>The current rules for this prototype.</Txt>
    </View>
    {questions.map(({ question, answer }) => <View key={question}
      style={{ paddingVertical: 20, gap: 8, borderBottomColor: colors.line, borderBottomWidth: 1 }}>
      <Txt size={17} weight="700">{question}</Txt>
      <Txt size={14} muted style={{ lineHeight: 23, maxWidth: 950 }}>{answer}</Txt>
    </View>)}
    <View style={{ flexDirection: desktop ? 'row' : 'column', flexWrap: 'wrap', gap: 13, marginTop: 25 }}>
      <Button label="Register an organization" onPress={() => router.push('/organization')} />
      <Button label="Explore approved campaigns" outline onPress={() => router.push('/explore')} />
    </View>
  </Screen>;
}
