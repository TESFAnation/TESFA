# TESFA

TESFA is an Android-first crowdfunding prototype for Ethiopia.

It includes a mobile app for donors and organizers, a web dashboard for reviewers, and a Supabase database. This is a prototype, not a licensed fundraising service. There are no live payments, payouts, or government ID checks.

## Projects

- `apps/mobile`: Expo / React Native app. Start with `npm install` and `npm start` inside that folder.
- `apps/admin`: Next.js reviewer dashboard. Start with `npm install` and `npm run dev` inside that folder.
- `supabase`: database changes.
- `docs`: product and setup notes.

The Supabase project is `TESFA Project` (`hfvqzzhcjkkjacivwddy`). Both apps use its **public, publishable** key. Never add a Supabase secret or service-role key to the mobile app, GitHub, or a `NEXT_PUBLIC_` variable.

## Prototype safety

- Only genuinely submitted, staff-approved campaigns appear in the public feed. There are no seeded or fictional campaigns.
- Organizers upload their own campaign photos to public storage. Photos can be seen by anyone with their URL, so do not include private details.
- Supporting evidence is uploaded to private storage and can be opened only by its organizer and staff. Use fictional, non-sensitive test files until the real privacy and licensing processes are ready.
- All applications are private until an authorized reviewer approves them.
- A review in this prototype does not establish government or hospital verification.
- The donation screen does not charge, record, or transfer money.

## What to test

1. Open the Android app and switch among Home, Explore, Create, and Profile.
2. Switch appearance among System, Light, and Dark.
3. Sign up with email, confirm it if required, and sign in.
4. Create a draft, add an organizer name and spending plan, upload an image and a non-sensitive test PDF or image.
5. After the owner grants your account the reviewer role, sign in to the admin dashboard to review the application.
6. Manually inspect the evidence file, approve an appropriate real application, then confirm it appears in Explore on the phone.
7. Save an approved cause, report a concern, and submit an organizer update for staff review.

See [the setup guide](docs/SETUP.md) for account and reviewer setup.

