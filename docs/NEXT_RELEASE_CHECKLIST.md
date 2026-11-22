# TESFA next release: review and handoff

Release record for TESFA v1.2. The organization-feedback migration was applied to the connected TESFA Project on November 21, 2026. The public site, staff dashboard and Android APK must use the same revision for verification.

## What is prepared

1. Shared Android and website layouts, consistent navigation, responsive desktop screens, solid blue branding, and light/dark/system appearance.
2. Organizer application corrections edit an existing `needs_info` organization application and send it back to `pending`.
3. Staff organization reviews require an acknowledgement and applicant-facing explanation. Approval, rejection or request for corrections is recorded in one transaction with an immutable review event.
4. Organization applicants see the latest staff feedback. Campaign creators see the latest campaign review feedback on Android and web.
5. Admin organization queue has counts, search, status filters, application details, and review history. Campaign approvals require feedback too.
6. Signed-in users can edit a display name. No phone verification is claimed.
7. Saved-campaign and organization hooks handle loading, sign-out and data errors more reliably.

## Compatibility contract

| App or capability | Requires | Status |
| --- | --- | --- |
| Android organizer registration | `organizations` owner policies | Existing production tables |
| Organization correction | New `organizations_owner_resubmit` RLS policy and update grants | Applied to connected Supabase project |
| Applicant review feedback | New read policy on campaign events, new `organization_review_events` table | Applied to connected Supabase project |
| Admin organization decisions | New `tesfa_review_organization` RPC | Applied to connected Supabase project |
| Admin campaign decisions | Existing `tesfa_review_campaign` RPC | Existing production migration |
| User profile display name | Existing `profiles` RLS | Existing production migration |
| Approved public campaigns and private evidence | Existing campaign, media, and Storage RLS | Existing production migrations |
| Donation preview | No payment API | Available offline; does not charge |

Run `node scripts/check-contracts.mjs` from the repository root to check local source contracts. This is static verification, not a substitute for a real database test.

## Joint release order

1. Review the UI and the migration `supabase/migrations/20261121200637_organization_review_and_applicant_feedback.sql` together. Confirm all staff feedback is safe for applicants to see. **Migration completed November 21, 2026.**
2. Create an authorized reviewer account in Supabase and manually grant `staff_members` access using the setup guide. Do not grant staff rights to an email that has not been verified as the intended person.
3. Confirm the applied migration is present, with the new table, RPC, RLS and grants. It must be available **before** the new admin and organizer code goes live. **Verified November 21, 2026.**
4. Update the website and staff dashboard together to use this source revision and the same publishable Supabase project. Set the proper public environment variables for both apps and check Supabase Auth redirect URLs.
5. Build Android version **1.2.0 (versionCode 3)** from the same Expo revision. Test Expo Go first, then install a standalone APK on a physical Android device.
6. Create two distinct fictional/non-sensitive test accounts, one organizer and one authorized reviewer. Repeat the scenarios below. Publish only genuine, authorized campaigns.
7. Enable leaked-password protection in Supabase Auth, verify recovery links, establish evidence-file retention/consent rules, and perform security and compliance reviews **before** any real sensitive uploads or payment rollout.

## End-to-end acceptance scenarios

- [ ] A guest sees zero unapproved campaigns on the public site and Android.
- [ ] New email account confirms and signs in. Profile display name saves and survives sign-out/sign-in.
- [ ] Organizer registers an organization with fictional, non-sensitive details. It appears only in their account and in the staff queue.
- [ ] Staff selects the application, reviews it, requests changes with a written reason. The organizer sees the exact reason.
- [ ] Organizer edits that **same** application, resubmits and sees `Awaiting review`. No duplicate organization is created.
- [ ] Staff approves the corrected application and both the decision and written feedback appear in the organization history.
- [ ] Organizer creates and edits a private campaign draft, uploads an owned photo and fictional evidence, submits it, and remains invisible to guests.
- [ ] Staff requests more campaign information with written feedback. Organizer sees it, edits, resubmits, and staff approves it after reviewing evidence.
- [ ] The approved, non-fictional campaign appears on Android and browser with a photo, detailed story and spending plan.
- [ ] User saves and unsaves an approved campaign, signs out, signs back in, and gets the correct saved list.
- [ ] Organizer posts an update. Only staff-approved updates appear publicly.
- [ ] A signed-in user submits a report; staff can resolve or dismiss it.
- [ ] Donation preview clearly states **no money is collected**. No balance or payment record changes.
- [ ] System, Light and Dark modes work on a narrow Android screen and at 390px, 768px and 1440px browser widths.
- [ ] Unauthenticated visitors and ordinary authenticated users cannot read other applicants' private drafts, evidence, review notes, or the staff workspace.

## Owner decisions still needed

- Which confirmed account should become the first reviewer? No staff account is assigned yet.
- Confirm the public production site and Auth callback addresses before release.
- Agree on a real-world document verification, privacy, retention, abuse response and incident process before collecting real private evidence.
- Banking, Chapa, donations and payouts stay disabled until licensing and integration are approved.
