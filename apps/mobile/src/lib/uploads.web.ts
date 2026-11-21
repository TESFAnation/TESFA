import { supabase } from './supabase';

const maxFileSize = 8 * 1024 * 1024;
const accepted = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export async function uploadCampaignFile(input: {
  uri: string; mimeType: string; size?: number; ownerId: string;
  campaignId: string; privateEvidence: boolean;
}) {
  if (!accepted.includes(input.mimeType)) throw new Error('Choose a PDF, JPEG, PNG, or WebP file.');
  if (!input.privateEvidence && input.mimeType === 'application/pdf') throw new Error('Campaign photos must be images.');
  if ((input.size || 0) > maxFileSize) throw new Error('Files must be smaller than 8 MB.');
  const response = await fetch(input.uri);
  if (!response.ok) throw new Error('Could not read the selected file.');
  const bytes = await response.arrayBuffer();
  if (bytes.byteLength > maxFileSize) throw new Error('Files must be smaller than 8 MB.');
  const extension = input.mimeType === 'application/pdf' ? 'pdf'
    : input.mimeType === 'image/png' ? 'png'
    : input.mimeType === 'image/webp' ? 'webp' : 'jpg';
  const path = input.ownerId + '/' + input.campaignId + '/' + Date.now() + '-' +
    Math.random().toString(36).slice(2, 11) + '.' + extension;
  const bucket = input.privateEvidence ? 'tesfa-private-evidence' : 'tesfa-campaign-photos';
  const { error } = await supabase.storage.from(bucket).upload(path, bytes, {
    contentType: input.mimeType, upsert: false, cacheControl: '3600',
  });
  if (error) throw error;
  return { path, bucket };
}
