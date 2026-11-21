# TESFA

TESFA is an Android-first crowdfunding prototype for Ethiopia.

It includes a mobile app for donors and organizers, a web dashboard for reviewers, and a Supabase database. This is a prototype, not a licensed fundraising service. There are no live payments, payouts, or government ID checks.

## Projects

- `apps/mobile`: Expo / React Native app. Start with `npm install` and `npm start` inside that folder.
- `apps/admin`: Next.js reviewer dashboard. Start with `npm install` and `npm run dev` inside that folder.
- `supabase`: database changes.
- `docs`: product and setup notes.

The Supabase project is `TESFA Project` (`hfvqzzhcjkkjacivwddy`). Both apps use its **public, publishable** key. Never add a Supabase secret or service-role key to the mobile app, GitHub, or a `NEXT_PUBLIC_` variable.

## Demo safety

- Campaigns marked **SAMPLE** are fictional and their figures are not real donations.
- Evidence choices are sample document descriptions only. Do not upload real IDs, poverty certificates, or medical records.
- All applications are private until an authorized reviewer approves them.
- A review in this prototype does not establish government or hospital verification.
- The donation screen does not charge, record, or transfer money.

## What to test

1. Open the Android app and switch among Home, Explore, Create, and Profile.
2. Switch appearance among System, Light, and Dark.
3. Sign up with email, confirm it if required, and sign in.
4. Create a draft and submit it with a **fictional evidence type**.
5. After the owner grants your account the reviewer role, sign in to the admin dashboard to review the application.
6. Approve the fictional application, then confirm it appears in Explore on the phone.

See [the setup guide](docs/SETUP.md) for account and reviewer setup.

