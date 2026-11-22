// Static release contract check. This does not connect to or modify Supabase.
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const read = (path) => readFileSync(join(root, path), 'utf8');
const latestMigration = read('supabase/migrations/20261121200637_organization_review_and_applicant_feedback.sql');
const initial = read('supabase/migrations/20261121000000_tesfa_initial_schema.sql');
const staff = read('supabase/migrations/20261121055954_staff_and_organization_review.sql');
const rich = read('supabase/migrations/20261121082022_rich_campaign_experience.sql');
const gate = read('supabase/migrations/20261121120000_organization_gate_and_atomic_reviews.sql');
const mobileClient = read('apps/mobile/src/lib/supabase.ts');
const adminClient = read('apps/admin/lib/supabase.ts');

const checks = [
  ['Both clients target the same Supabase project', () => {
    const project = 'hfvqzzhcjkkjacivwddy.supabase.co';
    assert.ok(mobileClient.includes(project));
    assert.ok(adminClient.includes(project));
  }],
  ['No secret key in browser or mobile client', () => {
    for (const source of [mobileClient, adminClient]) {
      assert.doesNotMatch(source, /sb_secret_[a-zA-Z0-9]+|service[_-]role[_-]key\s*[:=]/i);
      assert.match(source, /SUPABASE_PUBLISHABLE_KEY/);
    }
  }],
  ['Organization review RPC and RLS are prepared', () => {
    assert.match(latestMigration, /create function public\.tesfa_review_organization\s*\(/i);
    assert.match(latestMigration, /create policy organizations_owner_resubmit/i);
    assert.match(latestMigration, /organization_review_events enable row level security/i);
    assert.match(read('apps/admin/app/page.tsx'), /rpc\('tesfa_review_organization'/);
    assert.match(read('apps/mobile/src/lib/review-feedback.ts'), /organization_review_events/);
  }],
  ['Campaign review uses atomic RPC with applicant feedback', () => {
    assert.match(gate, /create function public\.tesfa_review_campaign\s*\(/i);
    assert.match(latestMigration, /reviews_campaign_owner_read/i);
    assert.match(read('apps/admin/app/page.tsx'), /rpc\('tesfa_review_campaign'/);
    assert.match(read('apps/mobile/src/lib/review-feedback.ts'), /\.from\('review_events'\)/);
  }],
  ['Campaign visibility and upload permissions have RLS policies', () => {
    assert.match(initial, /create policy campaigns_read/i);
    assert.match(initial, /status = 'approved' or owner_id/i);
    assert.match(rich, /create policy tesfa_evidence_read/i);
    assert.match(rich, /tesfa-private-evidence.*false/i);
    assert.match(gate, /approved organization is required before submitting a campaign/i);
  }],
  ['Phone and browser have matching core routes', () => {
    for (const path of ['(tabs)/index', '(tabs)/explore', '(tabs)/create', '(tabs)/profile', 'drafts', 'saved', 'campaign/[id]', 'donate']) {
      assert.ok(existsSync(join(root, `apps/mobile/src/app/${path}.tsx`)), `Missing Android route: ${path}`);
      assert.ok(existsSync(join(root, `apps/mobile/src/app/${path}.web.tsx`)), `Missing web route: ${path}`);
    }
  }],
  ['Payment preview has no payment gateway integration', () => {
    for (const path of ['apps/mobile/src/app/donate.tsx', 'apps/mobile/src/app/donate.web.tsx']) {
      const source = read(path);
      assert.doesNotMatch(source, /checkout\.create|chapa\.initialize|chargeCard\(|payments\.create\(/i);
      assert.match(source, /preview/i);
    }
  }],
  ['Reviewer access comes from staff_members, not public signup', () => {
    assert.match(staff, /revoke insert, update, delete on public\.staff_members from anon, authenticated/i);
    assert.match(read('apps/admin/app/page.tsx'), /\.from\('staff_members'\)/);
  }],
];

for (const [title, check] of checks) {
  check();
  process.stdout.write(`PASS ${title}\n`);
}
process.stdout.write(`\n${checks.length} local contracts verified. Test real RLS behavior with two accounts after deployment.\n`);
