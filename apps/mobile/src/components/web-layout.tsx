import React from 'react';
import { Image, Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native';
import { router, usePathname } from 'expo-router';
import { ArrowUpRight, BookOpen, HeartPulse, HousePlus, MapPin, Menu, Moon, Search, Sun } from 'lucide-react-native';
import { Txt } from './primitives';
import { money, titleCase, type Campaign } from '../lib/campaigns';
import { useAppearance } from '../lib/theme';

export const WEB_WIDTH = 1240;
const categories = { education: BookOpen, medical: HeartPulse, emergency: HousePlus };

export function WebHeader() {
  const { colors, dark, setChoice } = useAppearance();
  const { width } = useWindowDimensions();
  const pathname = usePathname();
  const compact = width < 920;
  const items = [
    { label: 'Home', path: '/' },
    { label: 'Explore causes', path: '/explore' },
    { label: 'Start a campaign', path: '/create' },
  ] as const;
  return <View style={{ backgroundColor: colors.surface, borderBottomWidth: 1, borderBottomColor: colors.line, zIndex: 2 }}>
    <View style={{ width: '100%', maxWidth: WEB_WIDTH, paddingHorizontal: width < 600 ? 20 : 32, minHeight: compact ? 70 : 82,
      alignSelf: 'center', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 14 }}>
      <Pressable accessibilityRole="link" onPress={() => router.push('/')} style={{ paddingVertical: 14, flexShrink: 0 }}>
        <Txt size={compact ? 26 : 30} weight="800" style={{ letterSpacing: 2.4, color: colors.navy }}>TESFA</Txt>
      </Pressable>
      {!compact && <View style={{ flexDirection: 'row', alignItems: 'center', gap: 34, alignSelf: 'stretch' }}>
        {items.map((item) => <Pressable key={item.path} accessibilityRole="link" onPress={() => router.push(item.path)}
          style={{ borderBottomWidth: pathname === item.path ? 2 : 2, borderBottomColor: pathname === item.path ? colors.navy : 'transparent',
            paddingHorizontal: 2, justifyContent: 'center' }}>
          <Txt size={14} weight={pathname === item.path ? '700' : '500'} style={{ color: pathname === item.path ? colors.navy : colors.text }}>{item.label}</Txt>
        </Pressable>)}
      </View>}
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: compact ? 8 : 18 }}>
        {!compact && <Pressable accessibilityRole="link" onPress={() => router.push('/saved')}><Txt size={14} weight="500">Saved</Txt></Pressable>}
        <Pressable accessibilityLabel={dark ? 'Switch to light mode' : 'Switch to dark mode'} accessibilityRole="button"
          onPress={() => setChoice(dark ? 'light' : 'dark')}
          style={{ width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: colors.line, borderRadius: 8 }}>
          {dark ? <Sun color={colors.text} size={18} /> : <Moon color={colors.text} size={18} />}
        </Pressable>
        <Pressable accessibilityRole="link" onPress={() => router.push(compact ? '/explore' : '/profile')}
          style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 8, paddingVertical: 10, paddingHorizontal: compact ? 12 : 18, flexDirection: 'row', gap: 7, alignItems: 'center' }}>
          {compact && <Menu color={colors.text} size={19} />}
          <Txt size={13} weight="700">{compact ? 'Explore' : 'My account'}</Txt>
        </Pressable>
      </View>
    </View>
    {compact && <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{
      gap: 22, paddingHorizontal: width < 600 ? 20 : 32, paddingBottom: 12, alignItems: 'center' }}>
      {[...items, { label: 'Saved', path: '/saved' }, { label: 'My account', path: '/profile' }].map((item) =>
        <Pressable key={item.path} accessibilityRole="link" onPress={() => router.push(item.path)}>
          <Txt size={13} weight={pathname === item.path ? '700' : '500'}
            style={{ color: pathname === item.path ? colors.navy : colors.subtle }}>{item.label}</Txt>
        </Pressable>)}
    </ScrollView>}
  </View>;
}

export function WebPage({ children, footer = true }: { children: React.ReactNode; footer?: boolean }) {
  const { colors } = useAppearance();
  const { width } = useWindowDimensions();
  return <ScrollView style={{ flex: 1, backgroundColor: colors.page }} contentContainerStyle={{ flexGrow: 1, alignItems: 'center' }}>
    <View style={{ width: '100%', maxWidth: WEB_WIDTH, paddingHorizontal: width < 600 ? 20 : 32, flexGrow: 1 }}>{children}</View>
    {footer && <WebFooter />}
  </ScrollView>;
}

export function WebFooter() {
  const { colors } = useAppearance();
  const { width } = useWindowDimensions();
  return <View style={{ width: '100%', marginTop: 80, borderTopWidth: 1, borderTopColor: colors.line, backgroundColor: colors.surface }}>
    <View style={{ width: '100%', maxWidth: WEB_WIDTH, alignSelf: 'center',
      paddingHorizontal: width < 600 ? 20 : 32, paddingTop: 34, paddingBottom: 38, gap: 15 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 15 }}>
        <View style={{ gap: 8 }}>
          <Txt size={24} weight="800" style={{ color: colors.navy, letterSpacing: 2 }}>TESFA</Txt>
          <Txt muted size={13}>Crowdfunding for communities across Ethiopia.</Txt>
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 22, flexWrap: 'wrap' }}>
          <Pressable onPress={() => router.push('/explore')}><Txt size={13}>Explore</Txt></Pressable>
          <Pressable onPress={() => router.push('/create')}><Txt size={13}>Create a campaign</Txt></Pressable>
          <Pressable onPress={() => router.push('/profile')}><Txt size={13}>Account</Txt></Pressable>
        </View>
      </View>
      <View style={{ borderTopWidth: 1, borderColor: colors.line, paddingTop: 17 }}>
        <Txt muted size={12}>TESFA is in testing. Donations are previews only. No payments are collected.</Txt>
      </View>
    </View>
  </View>;
}

export function WebAction({ label, onPress, secondary = false }: { label: string; onPress: () => void; secondary?: boolean }) {
  const { colors } = useAppearance();
  return <Pressable accessibilityRole="button" onPress={onPress} style={{
    paddingHorizontal: 22, paddingVertical: 14, borderRadius: 7,
    backgroundColor: secondary ? colors.surface : '#173B63',
    borderWidth: secondary ? 1 : 0, borderColor: colors.line,
  }}><Txt size={14} weight="700" style={{ color: secondary ? colors.text : '#FFFFFF' }}>{label}</Txt></Pressable>;
}

export function SectionHeading({ eyebrow, title, description, action, onAction }: {
  eyebrow?: string; title: string; description?: string; action?: string; onAction?: () => void;
}) {
  const { colors } = useAppearance();
  const { width } = useWindowDimensions();
  return <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 14 }}>
    <View style={{ gap: 7, maxWidth: 750 }}>
      {!!eyebrow && <Txt size={12} weight="800" style={{ color: colors.navy, letterSpacing: 1.3 }}>{eyebrow.toUpperCase()}</Txt>}
      <Txt size={width < 600 ? 27 : 33} weight="700" style={{ letterSpacing: -0.6 }}>{title}</Txt>
      {!!description && <Txt size={15} muted>{description}</Txt>}
    </View>
    {!!action && !!onAction && <Pressable accessibilityRole="link" onPress={onAction}
      style={{ flexDirection: 'row', gap: 7, alignItems: 'center', paddingVertical: 7 }}>
      <Txt size={14} weight="700" style={{ color: colors.navy }}>{action}</Txt><ArrowUpRight color={colors.navy} size={16} />
    </Pressable>}
  </View>;
}

export function WebCampaignCard({ campaign, width }: { campaign: Campaign; width: number }) {
  const { colors } = useAppearance();
  const Icon = categories[campaign.category] || HeartPulse;
  const progress = Math.max(0, Math.min(100, campaign.raised_etb / Math.max(campaign.goal_etb, 1) * 100));
  return <Pressable accessibilityRole="link" onPress={() => router.push({ pathname: '/campaign/[id]', params: { id: campaign.id } })}
    style={{ width, borderWidth: 1, borderColor: colors.line, borderRadius: 9,
      backgroundColor: colors.surface, overflow: 'hidden', marginBottom: 2 }}>
    <View style={{ height: 220, backgroundColor: colors.soft, justifyContent: 'center', alignItems: 'center' }}>
      {campaign.photo_url
        ? <Image source={{ uri: campaign.photo_url }} style={{ width: '100%', height: '100%' }} resizeMode="cover" />
        : <View style={{ alignItems: 'center', gap: 13 }}><Icon size={39} color={colors.navy} strokeWidth={1.4} /><Txt size={13} weight="700" style={{ color: colors.navy }}>{titleCase(campaign.category)}</Txt></View>}
      <View style={{ position: 'absolute', top: 15, left: 15, backgroundColor: colors.surface, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 5 }}>
        <Txt size={11} weight="700">{titleCase(campaign.category)}</Txt>
      </View>
    </View>
    <View style={{ padding: 22, gap: 13, minHeight: 220 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}><MapPin size={14} color={colors.subtle} /><Txt size={12} muted>{campaign.location}</Txt></View>
      <Txt size={20} weight="700" style={{ lineHeight: 27 }}>{campaign.title}</Txt>
      <View style={{ flex: 1 }} />
      <View style={{ backgroundColor: colors.line, height: 5, borderRadius: 2, overflow: 'hidden' }}>
        <View style={{ width: String(progress) + '%', height: 5, backgroundColor: colors.progress }} />
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
        <View style={{ gap: 3 }}><Txt size={16} weight="800">{money(campaign.raised_etb)}</Txt><Txt muted size={12}>of {money(campaign.goal_etb)} goal</Txt></View>
        <ArrowUpRight color={colors.navy} size={20} />
      </View>
    </View>
  </Pressable>;
}

export function CampaignGrid({ campaigns, availableWidth }: { campaigns: Campaign[]; availableWidth?: number }) {
  const { width } = useWindowDimensions();
  const contentWidth = availableWidth || (Math.min(width, WEB_WIDTH) - (width < 600 ? 40 : 64));
  const columns = contentWidth >= 940 ? 3 : contentWidth >= 590 ? 2 : 1;
  const gap = 22;
  const cardWidth = Math.max(250, (contentWidth - gap * (columns - 1)) / columns);
  return <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap }}>
    {campaigns.map((campaign) => <WebCampaignCard key={campaign.id} campaign={campaign} width={cardWidth} />)}
  </View>;
}

export function WebSearch({ value, onChangeText, placeholder = 'Search campaigns' }: { value: string; onChangeText: (text: string) => void; placeholder?: string }) {
  const { colors } = useAppearance();
  return <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11,
    borderWidth: 1, borderColor: colors.line, backgroundColor: colors.surface, paddingHorizontal: 15, borderRadius: 7, flex: 1, minWidth: 220 }}>
    <Search size={18} color={colors.subtle} />
    <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={colors.subtle}
      accessibilityLabel="Search campaigns" style={{ outlineStyle: 'none', flex: 1, fontSize: 15, color: colors.text, paddingVertical: 15 } as never} />
  </View>;
}
