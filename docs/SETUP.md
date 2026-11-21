# TESFA deployment and testing

## Live addresses

- Public browser app: https://tesfa-app-zeta.vercel.app
- Staff dashboard: https://tesfa-admin-sigma.vercel.app
- Repository: https://github.com/TESFAnation/TESFA

## Supabase email confirmation and account recovery

The owner must update these settings in **Supabase > Authentication > URL Configuration**. Use the public app as the default **Site URL**:

`https://tesfa-app-zeta.vercel.app`

Add these **Redirect URLs**:

- `https://tesfa-app-zeta.vercel.app/auth`
- `https://tesfa-app-zeta.vercel.app/reset-password`

You can optionally allow `https://tesfa-app-zeta.vercel.app/**` for the same verified host if you need additional account callback pages. Do not use `localhost` as the production default. This prototype's Android email links deliberately open the published browser app, since no native deep-link registration has been configured. Do not put the Supabase secret or service-role key into either app.

**Important:** Changing the site URL alone does not enable password recovery if the redirect URL is not on the allowlist. Verify by requesting a password reset for a test account and completing it on the website.

## Run on a computer

1. Install Node.js 24 and Android Studio if you want to build an APK locally.
2. From `apps/mobile`, run `npm ci` then `npx expo start`. Open the development link with Expo Go on Android, or run `npx expo start --web` for a browser preview.
3. From `apps/admin`, run `npm ci` then `npm run dev` to work on the staff dashboard.
4. To check a release, run `npx tsc --noEmit`, `npx expo lint`, and `npx expo export --platform web` in `apps/mobile`; run `npm run lint` and `npm run build` in `apps/admin`.

The `.github/workflows/android-apk.yml` workflow builds a standalone Android APK after commits to `main` that modify `apps/mobile`. Open the successful GitHub Actions run and download the `TESFA-Android-APK` artifact. Android APK installation may require approving installation from the browser or file manager. APK builds are not automatically published on the website.

## Phone-only development and testing

1. Open the TESFA repository on GitHub. In the Code menu, open a Codespace if Codespaces is available for your account.
2. In a terminal run `cd apps/mobile && npm install && npx expo start --tunnel`.
3. Install **Expo Go** on Android. Open the Expo Go link provided by Expo. On one phone, switching between Codespaces and Expo Go is easiest using two browser tabs.
4. The mobile app is configured for the development Supabase project. Sign up with an email you control. Supabase may ask you to verify the email.
5. The reviewer dashboard is deployed at [TESFA admin](https://tesfa-admin-sigma.vercel.app). Vercel may first ask you to sign in to your Vercel account. The TESFA staff sign-in is a separate email/password login.

## Deployment note

The dashboard was published to the `tesfa-admin` Vercel project directly. The new Vercel team does not yet have its GitHub integration installed, so changes pushed to GitHub will not automatically redeploy the dashboard. When ready, install Vercel's GitHub integration and connect `TESFAnation/TESFA`, setting the project Root Directory to `apps/admin`.

## Grant reviewer access

There is intentionally **no public reviewer sign-up**. Reviewer access has not been granted automatically to any user. After signing up and confirming your email, the Supabase project owner must run this SQL in the Supabase SQL Editor, replacing the email with the email address of the person they intend to appoint:

```sql
insert into public.staff_members (user_id, role)
select id, 'admin' from auth.users where email = 'YOUR_EMAIL_ADDRESS'
on conflict (user_id) do update set role = excluded.role;
```

This action must be performed through the trusted Supabase dashboard by the project owner. Do not guess which account belongs to the owner. Never expose a service-role key in the client. Reviewer privileges allow access to sensitive campaign evidence, so grant them only to people who are authorized to see the submitted documents.

## First end-to-end review

1. Confirm the Supabase redirects listed above are set, and confirm your email address.
2. As an organizer, open **Organization registration** and submit a real organization name and reference. For testing, use fictional, non-sensitive references.
3. As staff, sign into the admin dashboard and review the registration using an independent check before approving it.
4. As an organizer, create and save a campaign draft, add a detailed story and spending plan, then upload an organizer-owned photo and a **fictional** supporting document.
5. Submit for review. The server will reject submissions with no approved organization or missing required information.
6. As staff, check the campaign, open its private evidence, make a documented decision, and approve only appropriate real campaigns when the testing policy allows publication.
7. Verify approved campaigns appear on browser and Android, saved causes work while signed in, and updates require separate approval. Verify unapproved campaigns do not appear to guests.

Before real users upload sensitive information, complete a privacy/security review and establish lawful document handling, retention, reviewer access, and incident response procedures. Supabase's leaked-password protection also needs to be enabled by the project owner in **Authentication > Settings**.

## Not supported yet

Real payments, payout reconciliation, actual ID or phone verification, advanced fraud detection, and production compliance are not available. Evidence and campaign photo uploads are working, but test with fictional non-sensitive documents only until the privacy and licensing process is ready.
