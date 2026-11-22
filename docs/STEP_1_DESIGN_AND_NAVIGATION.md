# TESFA: Step 1 design and navigation

Status: approved and included in the TESFA v1.2 release preparation.

## Decisions retained

- Name: **TESFA**, uppercase wordmark only. No symbol or decorative logo.
- Main color: solid blue, with neutral surfaces and no gradients.
- Languages: English for this prototype.
- Appearance: light, dark and system modes.
- Android navigation: four tabs, **Home**, **Explore**, **Create**, and **Profile**.
- Browser navigation: **Home**, **Explore causes**, **How it works**, **Start a campaign**; account and saved causes are separate shortcuts.
- Content: staff-approved campaigns only. No fictional fundraising listings.
- Payments: preview only, with no money charged, pledged or transferred.

## Screen behavior

| Area | Android app | Browser site |
| --- | --- | --- |
| Home | Brand, intro, category shortcuts, recently approved causes | Wide two-column introduction, category cards and campaign grid |
| Explore | Search, category filters and sorting | Search and sorting plus a desktop filter sidebar |
| Create | Multi-step form | Same form and validation with a wide-screen guidance panel |
| Profile | Account cards and appearance settings | Account workspace in a full desktop layout |
| Secondary screens | Full-screen routes and consistent buttons | Global header with desktop-friendly widths |
| Theme | Respects device setting or saved choice | Respects browser setting or saved choice |

Category shortcuts share the same `category` URL parameter on both platforms. The parameter stays in sync with the selected Explore filter instead of being duplicated in local component state.

## Shared design rules

- `src/lib/design.ts` owns common widths, gutters, radius values, brand color and category parsing.
- `src/lib/theme.tsx` owns light and dark palettes.
- `src/components/primitives.tsx` owns cross-platform text, fields, buttons and cards.
- `src/components/web-layout.tsx` owns desktop header, footer, grids and campaign cards.
- Screen-specific `.web.tsx` modules may change layout, but must keep the same routes and backend behavior as their Android equivalents.

## Acceptance checklist

- [ ] Android has four tabs, with readable labels and selected states.
- [ ] Android tab bar leaves room for the system navigation inset.
- [ ] Desktop header shows the right route as active and works with keyboard navigation.
- [ ] Narrow browser widths show account access without an extra Explore shortcut.
- [ ] Category links from the Android homepage select the correct Explore filter.
- [ ] Both Explore screens use the same category parameter values.
- [ ] Light and dark modes are readable on all redesigned surfaces.
- [ ] Both platform bundles complete without TypeScript or lint errors.
- [ ] Owner approves the screens before any GitHub push, Vercel deployment or APK build.

## Boundaries for Step 1

No database migrations, Supabase setting changes, email messages, payments, GitHub pushes, APK builds or Vercel deployments are authorized by this step. Steps 2 and onward will handle the account and verification flows separately.
