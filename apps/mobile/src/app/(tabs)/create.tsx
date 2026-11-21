import React, { useState } from 'react';
import { Alert, Pressable, View } from 'react-native';
import { router } from 'expo-router';
import { Button, Card, Field, Screen, Txt } from '../../components/primitives';
import { useAuth } from '../../lib/auth';
import { useAppearance } from '../../lib/theme';
import { supabase } from '../../lib/supabase';

type Category = 'medical' | 'education' | 'emergency';
const categories: Category[] = ['medical', 'education', 'emergency'];
const evidenceChoices: Record<Category, string[]> = {
  medical: ['Hospital cost estimate (sample)', 'Poverty certificate (sample)'],
  education: ['Enrollment or fee letter (sample)', 'Poverty certificate (sample)'],
  emergency: ['Local administration report (sample)', 'Other supporting evidence (sample)'],
};
export default function Create() {
  const { session } = useAuth();
  const { colors } = useAppearance();
  const [title, setTitle] = useState('');
  const [story, setStory] = useState('');
  const [goal, setGoal] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Category>('medical');
  const [evidence, setEvidence] = useState('');
  const [busy, setBusy] = useState(false);

  async function save(submitForReview: boolean) {
    if (!session) return router.push('/auth');
    if (title.trim().length < 8 || story.trim().length < 80 || !location.trim() || !Number.isFinite(Number(goal)) || Number(goal) <= 0) {
      return Alert.alert('Incomplete application', 'Add a title, location, a story of at least 80 characters, and a positive fundraising goal.');
    }
    if (submitForReview && !evidence) return Alert.alert('Select sample evidence', 'Choose the fictional supporting document type used in this demo.');
    setBusy(true);
    const { data, error } = await supabase.from('campaigns').insert({
      owner_id: session.user.id, title: title.trim(), story: story.trim(),
      goal_etb: Number(goal), category, location: location.trim(), status: 'draft',
    }).select('id').single();
    if (error || !data) {
      setBusy(false);
      return Alert.alert('Could not save campaign', error?.message || 'Try again.');
    }
    if (submitForReview) {
      const document = await supabase.from('verification_documents').insert({
        campaign_id: data.id, uploader_id: session.user.id,
        document_type: evidence, storage_path: 'sample-only/' + data.id,
      });
      if (document.error) {
        setBusy(false);
        return Alert.alert('Draft saved', 'We could not add the sample evidence. Your draft is private. ' + document.error.message);
      }
      const submitted = await supabase.from('campaigns').update({ status: 'submitted' }).eq('id', data.id);
      if (submitted.error) {
        setBusy(false);
        return Alert.alert('Draft saved', 'Submission did not finish. Your draft is private. ' + submitted.error.message);
      }
    }
    setBusy(false);
    setTitle(''); setStory(''); setGoal(''); setLocation(''); setEvidence('');
    Alert.alert(submitForReview ? 'Sent for demo review' : 'Draft saved',
      submitForReview ? 'Your fictional application is private until a TESFA reviewer approves it.' : 'Find your draft under Profile → My campaigns.');
  }
  return <Screen>
    <Txt size={26} weight="700">Start a campaign</Txt>
    <Card style={{ backgroundColor: colors.soft, borderWidth: 0 }}>
      <Txt size={14} weight="700">Before you begin</Txt>
      <Txt size={13} muted>Tesfa checks applications before publication. For now, use fictional stories, amounts, and evidence choices. Do not submit real IDs or medical information.</Txt>
    </Card>
    {!session && <Button label="Sign in to continue" onPress={() => router.push('/auth')} />}
    <Txt size={18} weight="700">Campaign details</Txt>
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
      {categories.map((item) => <Pressable key={item} onPress={() => { setCategory(item); setEvidence(''); }} style={{
        backgroundColor: category === item ? '#173B63' : colors.surface,
        borderColor: colors.line, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 18,
      }}><Txt size={13} weight="600" style={{ color: category === item ? 'white' : colors.text }}>{item.charAt(0).toUpperCase() + item.slice(1)}</Txt></Pressable>)}
    </View>
    <Field label="Campaign title" placeholder="Describe the purpose" value={title} onChangeText={setTitle} />
    <Field label="City or area" placeholder="Addis Ababa" value={location} onChangeText={setLocation} />
    <Field label="Fundraising goal (ETB)" keyboardType="decimal-pad" placeholder="50000" value={goal} onChangeText={setGoal} />
    <Field label="Your story" multiline placeholder="Explain the need and how funds would be used. Minimum 80 characters." value={story} onChangeText={setStory} />
    <Txt size={18} weight="700">Sample supporting evidence</Txt>
    <Txt size={13} muted>Choose a demonstration document type. No actual file is uploaded or verified.</Txt>
    {evidenceChoices[category].map((item) => <Pressable key={item} onPress={() => setEvidence(item)} style={{
      borderColor: evidence === item ? colors.navy : colors.line, borderWidth: 1,
      borderRadius: 11, padding: 13, backgroundColor: colors.surface,
    }}><Txt size={14}>{evidence === item ? '●  ' : '○  '}{item}</Txt></Pressable>)}
    <Button label={busy ? 'Saving…' : 'Save private draft'} disabled={busy || !session} outline onPress={() => save(false)} />
    <Button label={busy ? 'Submitting…' : 'Submit for demo review'} disabled={busy || !session} onPress={() => save(true)} />
    <Txt size={12} muted>Submission does not guarantee approval. A person assigned as reviewer must make the final decision.</Txt>
  </Screen>;
}

