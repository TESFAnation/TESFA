# TESFA

TESFA is an Android and web crowdfunding prototype for Ethiopia. Its browser interface has layouts designed for desktop and smaller screens. The Android app and website share Expo / React Native business logic.

It includes a mobile app for donors and organizers, a web dashboard for reviewers, and a Supabase database. This is a prototype, not a licensed fundraising service. There are no live payments, payouts, or government ID checks.

## Projects

- `apps/mobile`: Expo / React Native app. Start with `npm ci` and `npx expo start` inside that folder.
- The same Expo app builds for browsers with `npx expo export --platform web`. The browser site is published at [TESFA](https://tesfa-app-zeta.vercel.app) separately from the staff dashboard.
- `apps/admin`: Next.js reviewer dashboard. Start with `npm install` and `npm run dev` inside that folder.
- `supabase`: database changes.
- `docs`: product and setup notes.

The Supabase project is `TESFA Project` (`hfvqzzhcjkkjacivwddy`). Both apps use its **public, publishable** key. Never add a Supabase secret or service-role key to the mobile app, GitHub, or a `NEXT_PUBLIC_` variable.

## Prototype safety

- Only genuinely submitted, staff-approved campaigns appear in the public feed. There are no seeded or fictional campaigns.
- Organizers upload their own campaign photos to public storage. Photos can be seen by anyone with their URL, so do not include private details.
- Supporting evidence is uploaded to private storage and can be opened only by its organizer and staff. Use fictional, non-sensitive test files until the real privacy and licensing processes are ready.
- Organization applications must be reviewed before their owners can submit campaigns for review. Drafts remain private.
- Campaign submissions must have a story, spending plan, location, one public photo and one private supporting document. Staff decisions and their audit notes are recorded together in the database.
- All campaigns are private until an authorized reviewer approves them.
- A review in this prototype does not establish government or hospital verification.
- The donation screen does not charge, record, or transfer money.

## Browser and Android features

- Guest browsing of approved campaigns, with category filters and search.
- Responsive desktop campaign details, account dashboard, saved causes, organizer workspace and payment preview.
- Email accounts, confirmation links, password resets, and persistent sign-in. Phone identity verification is not enabled.
- Organization registration with status tracking; private campaign drafts, user-uploaded photos and private evidence.
- Organization correction and applicant-facing review feedback, pending the next database migration.
- Personal display-name editing for signed-in accounts.
- Staff-only dashboard for reviewing organizations, campaign documents, photos, updates and reports.
- Staff campaign and organization search, status filters, review history, and atomic decision/audit logging.
- Light, dark and automatic appearance modes.

## What to test

1. Open the Android app and switch among Home, Explore, Create, and Profile.
2. Switch appearance among System, Light, and Dark.
3. Sign up with email, confirm it if required, and sign in. Check that confirmation and reset links return to the published website.
4. Register an organization and have a reviewer approve its application. You can create private drafts while waiting.
5. Create a draft, add an organizer name and spending plan, upload an image and a non-sensitive test PDF or image.
6. After the owner grants your account the reviewer role, sign in to the admin dashboard to review the organization and campaign.
7. Manually inspect evidence, approve an appropriate real application, then confirm it appears in Explore on the phone and website.
8. Save an approved cause, report a concern, and submit an organizer update for staff review.

See [the setup guide](docs/SETUP.md) for account and reviewer setup.

The organization-feedback migration is installed on TESFA Project. Review [the release checklist](docs/NEXT_RELEASE_CHECKLIST.md) to verify the website, admin dashboard and Android build against the same v1.2 code. Run `node scripts/check-contracts.mjs` to check the source contracts without connecting to the database.

