import React, { useCallback, useEffect, useState } from 'react';
import { Alert, Image, Pressable, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { Camera, FileText, Trash2 } from 'lucide-react-native';
import { Button, Card, Field, Screen, Txt } from '../../components/primitives';
import { useAuth } from '../../lib/auth';
import { useAppearance } from '../../lib/theme';
import { photoUrl } from '../../lib/campaigns';
import { supabase } from '../../lib/supabase';
import { uploadCampaignFile } from '../../lib/uploads';

type Category = 'medical' | 'education' | 'emergency';
type FileRow = { id: string; storage_path: string; document_type?: string };
const categories: Category[] = ['medical', 'education', 'emergency'];
const evidenceKinds = ['Poverty certificate', 'Hospital or school letter', 'Local administration letter', 'Other supporting document'];

export default function Create() {
  const { edit } = useLocalSearchParams<{ edit?: string }>();
  const { session } = useAuth();
  const { colors } = useAppearance();
  const [step, setStep] = useState(1);
  const [draftId, setDraftId] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [organizer, setOrganizer] = useState('');
  const [story, setStory] = useState('');
  const [plan, setPlan] = useState('');
  const [goal, setGoal] = useState('');
  const [location, setLocation] = useState('');
  const [category, setCategory] = useState<Category>('medical');
  const [evidenceKind, setEvidenceKind] = useState(evidenceKinds[0]);
  const [photos, setPhotos] = useState<FileRow[]>([]);
  const [documents, setDocuments] = useState<FileRow[]>([]);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState('draft');

  const loadFiles = useCallback(async (id: string) => {
    const [photoResult, evidenceResult] = await Promise.all([
      supabase.from('campaign_media').select('id,storage_path').eq('campaign_id', id).order('display_order'),
      supabase.from('verification_documents').select('id,storage_path,document_type').eq('campaign_id', id),
    ]);
    if (!photoResult.error) setPhotos((photoResult.data || []) as FileRow[]);
    if (!evidenceResult.error) setDocuments((evidenceResult.data || []) as FileRow[]);
  }, []);

  useEffect(() => {
    if (!edit || !session) return;
    supabase.from('campaigns').select('id,title,organizer_name,story,spending_plan,goal_etb,location,category,status')
      .eq('id', edit).eq('owner_id', session.user.id).single().then(({ data, error }) => {
        if (error || !data || !['draft', 'needs_info'].includes(data.status)) {
          Alert.alert('Unavailable', 'This campaign cannot be edited.');
          return;
        }
        setDraftId(data.id); setTitle(data.title); setOrganizer(data.organizer_name || '');
        setStory(data.story); setPlan(data.spending_plan || ''); setGoal(String(data.goal_etb));
        setLocation(data.location || ''); setCategory(data.category as Category); setStatus(data.status);
        loadFiles(data.id);
      });
  }, [edit, session?.user.id, loadFiles]);

  function basicsValid() {
    if (title.trim().length < 8 || title.trim().length > 140 || organizer.trim().length < 3 ||
      !location.trim() || !Number.isFinite(Number(goal)) || Number(goal) <= 0) {
      Alert.alert('Check the details', 'Add a title of at least 8 characters, organizer name, location, and a positive goal.');
      return false;
    }
    return true;
  }

  async function persistDraft(): Promise<string | null> {
    if (!session) { router.push('/auth'); return null; }
    if (!basicsValid()) return null;
    const fields = {
      title: title.trim(), organizer_name: organizer.trim(), category,
      location: location.trim(), goal_etb: Number(goal),
      story: story.trim(), spending_plan: plan.trim(), status: 'draft',
    };
    if (draftId) {
      const { error } = await supabase.from('campaigns').update(fields).eq('id', draftId).eq('owner_id', session.user.id);
      if (error) throw error;
      setStatus('draft');
      return draftId;
    }
    const { data, error } = await supabase.from('campaigns').insert({ ...fields, owner_id: session.user.id })
      .select('id').single();
    if (error || !data) throw error || new Error('Could not create the draft.');
    setDraftId(data.id);
    return data.id;
  }

  async function safeDraft(showConfirmation: boolean) {
    setBusy(true);
    try {
      const id = await persistDraft();
      if (id && showConfirmation) Alert.alert('Draft saved', 'Your campaign is private until a reviewer approves it.');
      return id;
    } catch (err) {
      Alert.alert('Could not save', err instanceof Error ? err.message : 'Please try again.');
      return null;
    } finally { setBusy(false); }
  }

  async function addPhoto() {
    if (!session || busy) return;
    setBusy(true);
    try {
      const id = await persistDraft();
      if (!id) return;
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'], allowsMultipleSelection: false, quality: 0.85,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const uploaded = await uploadCampaignFile({
        uri: asset.uri, size: asset.fileSize, mimeType: asset.mimeType || 'image/jpeg',
        ownerId: session.user.id, campaignId: id, privateEvidence: false,
      });
      const inserted = await supabase.from('campaign_media').insert({
        campaign_id: id, uploader_id: session.user.id, storage_path: uploaded.path,
        display_order: photos.length,
      });
      if (inserted.error) {
        await supabase.storage.from(uploaded.bucket).remove([uploaded.path]);
        throw inserted.error;
      }
      await loadFiles(id);
    } catch (err) {
      Alert.alert('Photo upload failed', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  async function addEvidence() {
    if (!session || busy) return;
    setBusy(true);
    try {
      const id = await persistDraft();
      if (!id) return;
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'],
        copyToCacheDirectory: true, multiple: false,
      });
      if (result.canceled || !result.assets[0]) return;
      const asset = result.assets[0];
      const uploaded = await uploadCampaignFile({
        uri: asset.uri, size: asset.size, mimeType: asset.mimeType || 'application/pdf',
        ownerId: session.user.id, campaignId: id, privateEvidence: true,
      });
      const inserted = await supabase.from('verification_documents').insert({
        campaign_id: id, uploader_id: session.user.id,
        storage_path: uploaded.path, document_type: evidenceKind,
      });
      if (inserted.error) {
        await supabase.storage.from(uploaded.bucket).remove([uploaded.path]);
        throw inserted.error;
      }
      await loadFiles(id);
    } catch (err) {
      Alert.alert('Evidence upload failed', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  async function removeFile(file: FileRow, evidenceFile: boolean) {
    if (!draftId || busy) return;
    setBusy(true);
    const table = evidenceFile ? 'verification_documents' : 'campaign_media';
    const bucket = evidenceFile ? 'tesfa-private-evidence' : 'tesfa-campaign-photos';
    const result = await supabase.from(table).delete().eq('id', file.id);
    if (result.error) Alert.alert('Could not remove file', result.error.message);
    else {
      await supabase.storage.from(bucket).remove([file.storage_path]);
      await loadFiles(draftId);
    }
    setBusy(false);
  }

  async function submit() {
    if (story.trim().length < 80 || plan.trim().length < 25)
      return Alert.alert('Complete your application', 'Your story needs at least 80 characters and the spending plan needs at least 25.');
    if (!photos.length || !documents.length)
      return Alert.alert('Files required', 'Upload at least one campaign photo and one supporting evidence document.');
    setBusy(true);
    try {
      const id = await persistDraft();
      if (!id) return;
      const { error } = await supabase.from('campaigns').update({ status: 'submitted' }).eq('id', id);
      if (error) throw error;
      Alert.alert('Application submitted', 'Your campaign will remain private while TESFA staff review the information.');
      setDraftId(null); setTitle(''); setStory(''); setOrganizer(''); setPlan('');
      setGoal(''); setLocation(''); setPhotos([]); setDocuments([]); setStep(1);
      router.replace('/drafts');
    } catch (err) {
      Alert.alert('Could not submit', err instanceof Error ? err.message : 'Please try again.');
    } finally { setBusy(false); }
  }

  return <Screen>
    <View style={{ gap: 5 }}><Txt size={27} weight="700">{edit ? 'Edit your campaign' : 'Start a campaign'}</Txt>
      <Txt muted>Build your application and send it for review.</Txt></View>
    <View style={{ flexDirection: 'row', gap: 8 }}>
      {[1, 2, 3].map((number) => <Pressable key={number} accessibilityLabel={'Step ' + number} onPress={() => { if (number <= step || draftId) setStep(number); }}
        style={{ flex: 1, backgroundColor: number <= step ? '#173B63' : colors.soft, borderRadius: 8, paddingVertical: 10, alignItems: 'center' }}>
        <Txt size={13} weight="700" style={{ color: number <= step ? '#FFFFFF' : colors.subtle }}>
          {number === 1 ? 'Details' : number === 2 ? 'Story' : 'Files'}</Txt>
      </Pressable>)}
    </View>
    {step === 1 && <>
      <Card style={{ backgroundColor: colors.soft, borderWidth: 0 }}>
        <Txt weight="700">Before you begin</Txt>
        <Txt size={13} muted>Your application is private until approved. Organizers must explain the need and provide supporting evidence.</Txt>
      </Card>
      {!session && <Button label="Sign in to continue" onPress={() => router.push('/auth')} />}
      <Txt size={19} weight="700">Campaign basics</Txt>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
        {categories.map((item) => <Pressable key={item} onPress={() => setCategory(item)}
          style={{ backgroundColor: category === item ? '#173B63' : colors.surface, borderColor: colors.line, borderWidth: 1, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 }}>
          <Txt size={13} weight="600" style={{ color: category === item ? '#FFFFFF' : colors.text }}>{item[0].toUpperCase() + item.slice(1)}</Txt>
        </Pressable>)}
      </View>
      <Field label="Campaign title" placeholder="What is the campaign for?" value={title} onChangeText={setTitle} />
      <Field label="Organizer or organization name" placeholder="Full name or registered organization" value={organizer} onChangeText={setOrganizer} />
      <Field label="City or area" placeholder="Addis Ababa" value={location} onChangeText={setLocation} />
      <Field label="Fundraising goal (ETB)" keyboardType="decimal-pad" placeholder="50000" value={goal} onChangeText={setGoal} />
      <Button label="Continue to story" disabled={!session || busy} onPress={() => { if (basicsValid()) setStep(2); }} />
    </>}
    {step === 2 && <>
      <Txt size={19} weight="700">Tell the full story</Txt>
      <Field label="Why is support needed?" multiline placeholder="Explain the situation and who will benefit. At least 80 characters." value={story} onChangeText={setStory} />
      <Field label="How will the funds be spent?" multiline placeholder="Break down expected costs and explain where donations would go. At least 25 characters." value={plan} onChangeText={setPlan} />
      <Card><Txt size={13} weight="700">Be specific and honest</Txt><Txt muted size={13}>Use facts you can support. A reviewer may request more details before the campaign goes public.</Txt></Card>
      <Button label="Continue to uploads" disabled={busy} onPress={() => {
        if (story.trim().length < 80 || plan.trim().length < 25) Alert.alert('More detail needed', 'The story needs 80 characters and the spending plan needs 25.');
        else setStep(3);
      }} />
      <Button label="Back to details" outline onPress={() => setStep(1)} />
    </>}
    {step === 3 && <>
      <Txt size={19} weight="700">Photos and evidence</Txt>
      <Card style={{ backgroundColor: colors.soft, borderWidth: 0 }}>
        <Txt weight="700">Protect private information</Txt>
        <Txt muted size={13}>Campaign photos are stored publicly and appear in the app after approval. Do not include private information in photos. Evidence files stay private to you and TESFA reviewers.</Txt>
        <Txt muted size={12}>During prototype testing, upload fictional, non-sensitive documents only. Do not upload real IDs or medical records yet.</Txt>
      </Card>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><Camera color={colors.navy} size={19} /><Txt weight="700">Campaign photos</Txt><Txt muted size={12}>({photos.length})</Txt></View>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
        {photos.map((file) => <View key={file.id} style={{ width: 105 }}>
          <Image source={{ uri: photoUrl(file.storage_path) }} style={{ height: 96, borderRadius: 10, backgroundColor: colors.soft }} />
          <Pressable onPress={() => removeFile(file, false)} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 4, padding: 6 }}>
            <Trash2 color={colors.subtle} size={13} /><Txt muted size={11}>Remove</Txt>
          </Pressable>
        </View>)}
      </View>
      <Button label={busy ? 'Working…' : 'Add a photo'} disabled={busy} onPress={addPhoto} outline />
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}><FileText color={colors.navy} size={19} /><Txt weight="700">Private supporting evidence</Txt></View>
      <Txt size={13} muted>Select a document type, then upload a PDF or image (up to 8 MB).</Txt>
      {evidenceKinds.map((kind) => <Pressable key={kind} onPress={() => setEvidenceKind(kind)}
        style={{ borderColor: kind === evidenceKind ? colors.navy : colors.line, borderWidth: 1, backgroundColor: colors.surface, borderRadius: 9, padding: 12 }}>
        <Txt size={13}>{kind === evidenceKind ? '●  ' : '○  '}{kind}</Txt>
      </Pressable>)}
      {documents.map((file) => <Card key={file.id} style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flex: 1, gap: 4 }}><Txt size={13} weight="700">{file.document_type}</Txt><Txt muted size={11}>Private upload</Txt></View>
        <Pressable onPress={() => removeFile(file, true)} accessibilityLabel="Remove document"><Trash2 color={colors.subtle} size={19} /></Pressable>
      </Card>)}
      <Button label={busy ? 'Working…' : 'Upload evidence'} disabled={busy} outline onPress={addEvidence} />
      <Button label={busy ? 'Submitting…' : 'Submit for staff review'} disabled={busy || !session} onPress={submit} />
      <Button label={busy ? 'Saving…' : 'Save private draft'} disabled={busy || !session} outline onPress={() => safeDraft(true)} />
      <Button label="Back to story" outline onPress={() => setStep(2)} />
      <Txt size={12} muted>TESFA checks applications for completeness. Approval requires a staff decision and does not imply government authentication.</Txt>
    </>}
  </Screen>;
}
