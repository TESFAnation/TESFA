import * as FileSystem from 'expo-file-system/legacy';
import { decode } from 'base64-arraybuffer';
import { supabase } from './supabase';

const maximumBytes = 8 * 1024 * 1024;
const supportedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function uploadCampaignFile(input: {
  uri: string; mimeType: string; size?: number; ownerId: string;
  campaignId: string; privateEvidence: boolean;
}) {
  if (!supportedTypes.includes(input.mimeType)) throw new Error('Choose a PDF, JPEG, PNG, or WebP file.');
  if (!input.privateEvidence && input.mimeType === 'application/pdf') throw new Error('Campaign photos must be images.');
  const info = await FileSystem.getInfoAsync(input.uri);
  const bytes = input.size || (info.exists && 'size' in info ? info.size : 0) || 0;
  if (bytes > maximumBytes) throw new Error('Files must be smaller than 8 MB.');
  const extension = input.mimeType === 'application/pdf' ? 'pdf'
    : input.mimeType === 'image/png' ? 'png'
    : input.mimeType === 'image/webp' ? 'webp' : 'jpg';
  const path = input.ownerId + '/' + input.campaignId + '/' + Date.now() + '-' +
    Math.random().toString(36).slice(2, 11) + '.' + extension;
  const bucket = input.privateEvidence ? 'tesfa-private-evidence' : 'tesfa-campaign-photos';
  const base64 = await FileSystem.readAsStringAsync(input.uri, { encoding: FileSystem.EncodingType.Base64 });
  if (base64.length * 0.75 > maximumBytes + 10) throw new Error('Files must be smaller than 8 MB.');
  const { error } = await supabase.storage.from(bucket).upload(path, decode(base64), {
    contentType: input.mimeType, upsert: false, cacheControl: '3600',
  });
  if (error) throw error;
  return { path, bucket };
}
