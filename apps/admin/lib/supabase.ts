import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://hfvqzzhcjkkjacivwddy.supabase.co';
const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || 'sb_publishable_xcXHj_jLqHegCVnV5f9kNQ_beWBuP_4';

// Publishable keys are browser-safe. RLS, not the key, enforces permissions.
export const supabase = createClient(url, key);

