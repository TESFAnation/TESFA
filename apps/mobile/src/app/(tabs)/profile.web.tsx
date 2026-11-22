import React from 'react';
import { Pressable, useWindowDimensions, View } from 'react-native';
import { router } from 'expo-router';
import { Bookmark, Building2, FilePenLine, LogOut, ShieldCheck, UserRound } from 'lucide-react-native';
import { Txt } from '../../components/primitives';
import { SectionHeading, WebAction, WebPage } from '../../components/web-layout';
import { useAppearance, type ThemeChoice } from '../../lib/theme';
import { useAuth } from '../../lib/auth';
import { useOrganizations } from '../../lib/organization';
import { supabase } from '../../lib/supabase';
import { AccountDetails } from '../../components/account-details';

const options: { label: string; path: '/drafts' | '/saved' | '/organization'; Icon: typeof Bookmark; description: string }[] = [
  { label: 'My campaigns', path: '/drafts', Icon: FilePenLine, description: 'Manage drafts, applications and published campaigns.' },
  { label: 'Saved causes', path: '/saved', Icon: Bookmark, description: 'Return to the campaigns you want to follow.' },
  { label: 'Organization registration', path: '/organization', Icon: Building2, description: 'Submit and track your organization application.' },
];

export default function WebProfile() {
  const { session, ready } = useAuth();
  const { colors, choice, setChoice } = useAppearance();
  const { approved, pending, items, loading } = useOrganizations();
  const { width } = useWindowDimensions();
  const desktop = width >= 850;
  const status = approved ? 'Approved organization' : pending ? 'Review in progress'
    : items.some((item) => item.status === 'needs_info') ? 'More information requested'
      : 'No approved organization';

  return <WebPage>
    <View style={{ marginTop: 54, marginBottom: 32 }}>
      <SectionHeading eyebrow="Your TESFA" title="Account and preferences"
        description="Manage your applications, saved causes and account settings from one place." />
    </View>
    {!ready ? <Txt muted>Checking your account...</Txt> : !session ? <View style={{
      borderWidth: 1, borderColor: colors.line, borderRadius: 9, backgroundColor: colors.surface,
      padding: width < 600 ? 27 : 54, flexDirection: desktop ? 'row' : 'column', gap: 24,
      alignItems: desktop ? 'center' : 'flex-start', justifyContent: 'space-between',
    }}>
      <View style={{ gap: 9, maxWidth: 720 }}>
        <UserRound color={colors.navy} size={35} />
        <Txt size={25} weight="700">Your TESFA account</Txt>
        <Txt size={15} muted>Browsing is open to everyone. Sign in to save causes, register an organization and manage campaigns.</Txt>
      </View>
      <WebAction label="Sign in or create account" onPress={() => router.push('/auth')} />
    </View> : <>
      <View style={{ flexDirection: desktop ? 'row' : 'column', gap: 22 }}>
        <View style={{ flex: 1.65, gap: 22 }}>
          <View style={{ padding: 28, backgroundColor: colors.surface, borderWidth: 1,
            borderColor: colors.line, borderRadius: 9, gap: 13 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 13 }}>
              <View style={{ padding: 12, backgroundColor: colors.soft, borderRadius: 8 }}>
                <UserRound color={colors.navy} size={23} />
              </View>
              <View style={{ flex: 1, gap: 3 }}><Txt muted size={12}>SIGNED IN AS</Txt>
                <Txt size={18} weight="700">{session.user.email || 'TESFA member'}</Txt></View>
            </View>
            <View style={{ borderTopWidth: 1, borderColor: colors.line, paddingTop: 17, gap: 7 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <ShieldCheck color={colors.navy} size={18} /><Txt weight="700">{loading ? 'Checking organization' : status}</Txt>
              </View>
              <Txt size={13} muted>{approved ? approved.name + ' can submit campaigns for staff review.'
                : pending ? pending.name + ' is waiting for a staff decision. You can prepare campaign drafts in the meantime.'
                  : 'Register an organization to submit campaigns. Every application must pass staff review.'}</Txt>
              <Pressable accessibilityRole="link" onPress={() => router.push('/organization')}>
                <Txt size={13} weight="700" style={{ color: colors.navy }}>View organization status</Txt>
              </Pressable>
            </View>
          </View>
          <View style={{ gap: 13 }}><Txt size={21} weight="700">Your workspace</Txt>
            {options.map(({ label, path, Icon, description }) => <Pressable key={path}
              accessibilityRole="link" onPress={() => router.push(path)} style={{ flexDirection: 'row',
                alignItems: 'center', gap: 18, padding: 23, backgroundColor: colors.surface,
                borderRadius: 9, borderColor: colors.line, borderWidth: 1 }}>
              <Icon size={24} color={colors.navy} />
              <View style={{ flex: 1, gap: 5 }}><Txt size={17} weight="700">{label}</Txt>
                <Txt size={13} muted>{description}</Txt></View>
              <Txt size={21} muted>›</Txt>
            </Pressable>)}
          </View>
          <View style={{ padding: 26, backgroundColor: colors.surface, borderWidth: 1,
            borderColor: colors.line, borderRadius: 9 }}>
            <AccountDetails key={session.user.id} />
          </View>
        </View>
        <View style={{ flex: 1, gap: 22 }}>
          <View style={{ backgroundColor: colors.surface, borderWidth: 1,
            borderColor: colors.line, borderRadius: 9, padding: 26, gap: 17 }}>
            <Txt size={20} weight="700">Appearance</Txt>
            <Txt size={13} muted>Choose how TESFA looks on this device.</Txt>
            <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
              {(['system', 'light', 'dark'] as ThemeChoice[]).map((mode) => <Pressable
                key={mode} accessibilityRole="button" accessibilityState={{ selected: choice === mode }}
                onPress={() => setChoice(mode)} style={{ flex: 1, minWidth: 70, paddingVertical: 13,
                  alignItems: 'center', backgroundColor: choice === mode ? '#173B63' : colors.surface,
                  borderRadius: 7, borderWidth: 1, borderColor: choice === mode ? '#173B63' : colors.line }}>
                <Txt size={13} weight="700" style={{ color: choice === mode ? '#FFFFFF' : colors.text }}>
                  {mode[0].toUpperCase() + mode.slice(1)}
                </Txt>
              </Pressable>)}
            </View>
          </View>
          <View style={{ backgroundColor: colors.soft, borderRadius: 9, padding: 26, gap: 12 }}>
            <ShieldCheck color={colors.navy} size={27} />
            <Txt size={19} weight="700">How TESFA reviews campaigns</Txt>
            <Txt size={14} muted>Understand the supporting documents, organization checks and staff approval process.</Txt>
            <WebAction label="Read the review process" secondary onPress={() => router.push('/how-it-works')} />
          </View>
          <Pressable accessibilityRole="button" onPress={() => { void supabase.auth.signOut(); }} style={{
            borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 17,
            flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10,
            backgroundColor: colors.surface }}>
            <LogOut color={colors.text} size={18} /><Txt weight="700">Sign out</Txt>
          </Pressable>
        </View>
      </View>
    </>}
  </WebPage>;
}
