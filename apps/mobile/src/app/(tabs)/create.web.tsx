import React from 'react';
import { useWindowDimensions, View } from 'react-native';
import { ClipboardCheck, FileText, Image as PhotoIcon, LockKeyhole, ShieldCheck } from 'lucide-react-native';
import CreateCampaign from './create';
import { Txt } from '../../components/primitives';
import { useAppearance } from '../../lib/theme';

const guidance = [
  { Icon: FileText, heading: 'Explain the need', body: 'Describe the cause, location, goal, and how the funds would be used.' },
  { Icon: PhotoIcon, heading: 'Add campaign photos', body: 'Use photographs provided by the organizer. Do not upload someone else’s images without permission.' },
  { Icon: LockKeyhole, heading: 'Provide private evidence', body: 'Submit a poverty certificate or other relevant documentation for staff review.' },
] as const;

export default function DesktopCampaignCreation() {
  const { colors } = useAppearance();
  const { width } = useWindowDimensions();
  if (width < 1050) return <CreateCampaign />;
  return <View style={{
    flex: 1, flexDirection: 'row', alignSelf: 'center', width: '100%', maxWidth: 1240,
    paddingHorizontal: 32, gap: 28, backgroundColor: colors.page,
  }}>
    <View style={{ flex: 1, minWidth: 0 }}>
      <CreateCampaign />
    </View>
    <View style={{ width: 280, paddingTop: 32, paddingBottom: 30, gap: 18 }}>
      <View style={{ borderWidth: 1, borderColor: colors.line, borderRadius: 8, padding: 23, backgroundColor: colors.surface, gap: 22 }}>
        <View style={{ gap: 8 }}>
          <Txt size={12} weight="800" style={{ color: colors.navy, letterSpacing: 1 }}>APPLICATION GUIDE</Txt>
          <Txt size={21} weight="700">Before you submit</Txt>
          <Txt size={13} muted style={{ lineHeight: 21 }}>Prepare these items to help the reviewer understand your campaign.</Txt>
        </View>
        {guidance.map(({ Icon, heading, body }) => <View key={heading}
          style={{ borderTopWidth: 1, borderColor: colors.line, paddingTop: 16, flexDirection: 'row', gap: 12 }}>
          <Icon size={20} color={colors.navy} />
          <View style={{ flex: 1, gap: 5 }}>
            <Txt size={14} weight="700">{heading}</Txt>
            <Txt size={12} muted style={{ lineHeight: 19 }}>{body}</Txt>
          </View>
        </View>)}
      </View>
      <View style={{ backgroundColor: colors.soft, borderRadius: 8, padding: 23, gap: 11 }}>
        <ShieldCheck size={23} color={colors.navy} />
        <Txt size={15} weight="700">Reviewed before publication</Txt>
        <Txt size={12} muted style={{ lineHeight: 20 }}>
          Your application and uploaded evidence stay private while TESFA staff review them. Only approved campaigns become visible.
        </Txt>
      </View>
      <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
        <ClipboardCheck size={17} color={colors.subtle} />
        <Txt size={12} muted style={{ flex: 1, lineHeight: 19 }}>
          This is a prototype. Donations are previews and no payments are processed.
        </Txt>
      </View>
    </View>
  </View>;
}
