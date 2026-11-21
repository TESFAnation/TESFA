# Phone-only development and testing

1. Open the TESFA repository on GitHub. In the Code menu, open a Codespace if Codespaces is available for your account.
2. In a terminal run `cd apps/mobile && npm install && npx expo start --tunnel`.
3. Install **Expo Go** on Android. Open the Expo Go link provided by Expo. On one phone, switching between Codespaces and Expo Go is easiest using two browser tabs.
4. The mobile app is configured for the development Supabase project. Sign up with an email you control. Supabase may ask you to verify the email.
5. The reviewer dashboard is deployed at [TESFA admin](https://tesfa-admin-sigma.vercel.app). Vercel may first ask you to sign in to your Vercel account. The TESFA staff sign-in is a separate email/password login.

## Deployment note

The dashboard was published to the `tesfa-admin` Vercel project directly. The new Vercel team does not yet have its GitHub integration installed, so changes pushed to GitHub will not automatically redeploy the dashboard. When ready, install Vercel's GitHub integration and connect `TESFAnation/TESFA`, setting the project Root Directory to `apps/admin`.

## Grant reviewer access

There is intentionally **no public reviewer sign-up**. After creating your account, ask the project owner to run the following SQL in the Supabase SQL Editor, replacing the email with your own:

```sql
insert into public.staff_members (user_id, role)
select id, 'admin' from auth.users where email = 'YOUR_EMAIL_ADDRESS'
on conflict (user_id) do update set role = excluded.role;
```

This action must be performed through the trusted Supabase dashboard by the project owner. Never expose a service-role key in the client.

## Not supported yet

Real payments, payout reconciliation, actual ID or phone verification, advanced fraud detection, and production compliance are not available. Evidence and campaign photo uploads are working, but test with fictional non-sensitive documents only until the privacy and licensing process is ready.
