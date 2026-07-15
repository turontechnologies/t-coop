# Register Co-operative

## Overview

`/register` shares the `(auth)` route group with `/login` — the same
split-screen `<AuthLayout>` (brand panel + form pane), not the centered
green-card treatment used by the password-recovery flow. It originally
lived in `(password-recovery)` with a plain centered card; moved here to
match login's premium presentation, on the reasoning that registration is
as much a primary entry point as login, not a secondary utility screen.

## Purpose

Let a new co-operative submit a registration request, matching the fields
and layout of the reference design, validated and genuinely submitted
against the mock backend — not a static form.

## Design Decisions

- **Same premium treatment as login, not a plainer form.** `AuthLayout`
  gained an optional `formClassName` prop (`src/components/layouts/auth-layout.tsx`)
  so the form pane's max-width can widen per-route; `src/app/(auth)/layout.tsx`
  is a client component that checks `usePathname()` and passes `max-w-md`
  for `/register` (it has two-column field rows and more fields than
  login's `max-w-sm` was ever meant to hold) while leaving `/login` alone.
  The heading now lives in `page.tsx` — `RegisterForm` is just the fields,
  mirroring how `LoginPage` / `LoginForm` are split.
- **Fields match the reference exactly:** Membership ID, Co-operative name,
  First/Last name (two-column), Email, Phone/Country (two-column), a
  terms-of-use + privacy-policy checkbox, "Create Account" submit, and an
  "Already have an account? Login" footer. The two-column rows collapse to
  one column below the `sm:` breakpoint (`grid-cols-1 sm:grid-cols-2`) so
  they don't cramp on narrow phones.
- **Country is a native `<select>`,** not a new combobox component. There
  was no existing `Select` primitive in `src/components/ui/`, and building
  one for a single low-stakes field would have been the wrong amount of new
  surface area for what's needed here. It's styled to match `<Input>`
  (same height, border, focus ring) with a `ChevronDown` icon overlay so it
  doesn't read as an unstyled native control.
- **Terms/privacy links are inert, not broken.** There's no real terms or
  privacy page yet, so "terms of use" and "privacy policy" are buttons that
  surface a "Coming soon" toast — the same honesty pattern used for the
  dashboard's not-yet-built nav items — rather than linking to a 404.
- **Duplicate membership IDs are actually rejected.** `authService
.registerCooperative` checks the submitted ID against
  `src/lib/mock-users.ts` and throws if it's already taken, surfaced as a
  field error on Membership ID. Small, but it's the difference between a
  form that looks validated and one that actually is.
- **Submitting does not create a usable login.** This is the one place in
  the app where the mock intentionally stops short of full simulation: a
  new co-operative registration in a real product would need a review/
  approval step before the account is active, so `/register` ends with
  "Registration received" messaging and a transition back to `/login` —
  not a new working account. Logging in still only works with the three
  hardcoded demo roles (`src/lib/mock-users.ts`). This was a deliberate
  choice over silently minting a fake account that would then fail to log
  in and confuse a demo audience.

## Components

- `src/app/(auth)/register/page.tsx` — route entry, metadata, heading (same
  split as `login/page.tsx`).
- `src/components/features/auth/register-form.tsx` — just the fields: RHF +
  Zod validation (`registerCooperativeSchema`), the native country select,
  the terms checkbox, and the post-submit `<RouteTransition>`.
- `src/lib/countries.ts` — the curated country list backing the select.
- `src/hooks/use-register.ts` — TanStack Query mutation wrapping
  `authService.registerCooperative`.

## Animations

Same staggered field-entrance pattern as every other auth form
(`src/lib/animations.ts`), applied per field/field-row (8 stagger steps —
more than the other forms simply because there are more fields), and the
same `<RouteTransition>` on success before returning to `/login`. See
[theming-and-motion.md](./theming-and-motion.md) for the shared mechanics.

## Files Created

```
src/app/(auth)/register/page.tsx
src/components/features/auth/register-form.tsx
src/hooks/use-register.ts
src/lib/countries.ts
```

Plus additions to shared files: `registerCooperativeSchema` in
`src/lib/validations/auth.schema.ts`, `registerCooperative` /
`mockRegisterCooperative` in `src/services/auth.service.ts`, and
`RegisterCooperativeRequest` / `RegisterCooperativeResponse` in
`src/types/auth.ts`.

## Future Improvements

- Once a real backend exists, decide what "submitted" actually means:
  instant account creation, or a genuine review queue (the current mock
  narrative implies the latter). Either way, `authService
.registerCooperative`'s mock branch is the only thing that needs to
  change.
- The country list (`src/lib/countries.ts`) is a curated shortlist, not a
  full ISO country list — fine for a demo, worth swapping for a complete
  list (or a real combobox with search) before this is a production form.
