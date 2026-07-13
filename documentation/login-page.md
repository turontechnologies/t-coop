# Login Page

## Overview

The `/login` route is the entry point to T-Coop. Visiting `/` redirects here.
It replaces the legacy centered-card login screen with a premium, split-screen
authentication experience appropriate for an enterprise fintech SaaS product.

## Purpose

Authenticate a co-operative member with a **Membership ID** and **Password**,
then hand off to OTP verification (built in the next milestone). The page
must read as a brand moment — the one screen where a bold green presence is
appropriate — while staying fast, accessible, and honest about its current
(mocked) backend.

## Design Decisions

- **Split-screen layout, not a copy of the reference.** The uploaded design
  was a centered white card on a solid green background. We kept the
  _information architecture_ (Membership ID, password, "keep me logged in",
  forgot password, register link) but reimagined the visual language as a
  two-pane layout: a deep brand-green panel (logo, value proposition, trust
  highlights) on the left, and a clean neutral form pane on the right. This
  is the pattern used by Stripe, Ramp, Mercury, and Vercel for auth screens,
  and it lets the brand green "have a moment" without flooding the rest of
  the interface — the explicit brand constraint in the design brief.
- **Brand green is contained to the auth panel, buttons, links, and focus
  rings.** Everything else (inputs, borders, page background) uses Tailwind
  Slate neutrals, per the brand guidance.
- **The provided `Logo.svg` is used as-is** on the green panel (it was
  authored in white, designed for a dark-green surface — exactly what this
  panel is). A separate `<LogoMark />` component (built from the same nested
  diamond geometry, recolored via `currentColor`) is used on neutral
  surfaces: the mobile header and the favicon.
- **Two-tier color tokens for accessibility.** Brand green used as a _fill_
  (buttons: `#00543D` bg + white text) stays identical across themes because
  its own internal contrast is what matters (~9:1). Brand green used as
  _text/icons/focus rings on a page background_ switches to a brighter
  emerald (`#10B981` / `#34D399`) in dark mode, because the deep brand green
  fails WCAG AA against a near-black `#020617` background. All token pairs
  were checked against WCAG AA (4.5:1 text, 3:1 UI components).
- **Mock auth service, not a stub UI.** Rather than leaving the form
  non-functional, `authService.login` simulates a network round trip via
  `NEXT_PUBLIC_USE_MOCK_AUTH=true` (the current default via the mock
  fallback), so the loading/success/error states are all real and
  demoable. Swapping in a real backend is a one-line change in
  `src/services/auth.service.ts` + setting `NEXT_PUBLIC_API_URL`.
- **No navigation to `/otp` yet.** Since the OTP screen isn't built in this
  milestone, a successful login shows an inline confirmation state instead
  of routing to a page that doesn't exist. This will become a
  `router.push("/otp")` once that route ships.

## Components

- `src/app/(auth)/login/page.tsx` — route entry, metadata, heading.
- `src/app/(auth)/layout.tsx` — wraps all auth routes in `AuthLayout`.
- `src/components/layouts/auth-layout.tsx` — responsive split-screen shell.
- `src/components/features/auth/auth-brand-panel.tsx` — left brand panel
  (logo, headline, trust highlights, decorative grid/glow background).
- `src/components/features/auth/login-form.tsx` — the form itself: RHF + Zod
  validation, password visibility toggle, "keep me logged in" checkbox,
  loading/error/success states.
- `src/components/brand/logo.tsx` / `logo-mark.tsx` — reusable brand marks.
- `src/components/theme/theme-toggle.tsx` — light/dark/system switcher
  (top-right of the form pane).
- shadcn/ui primitives used: `Button`, `Input`, `Label`, `Checkbox`,
  `DropdownMenu` (theme toggle), `Sonner` (toasts).

## Animations

Framer Motion, kept subtle and purposeful:

- Brand panel: logo fades/slides in, headline block slides up, trust
  highlights stagger in one at a time.
- Form fields: staggered fade + slide-up entrance (~80ms cadence).
- Field errors: animate height/opacity in and out (`AnimatePresence`) rather
  than popping in.
- Submit button: shows a spinning `Loader2` icon and disables the form while
  the mutation is pending.
- Success state: the form cross-fades into a confirmation card
  (scale + fade).

## Responsive Behavior

- **Desktop (`lg:` and up, ≥1024px):** two-column grid — brand panel left,
  form pane right.
- **Tablet / mobile (<1024px):** brand panel is hidden (`hidden lg:flex`);
  the form pane becomes a single centered column with a compact logo mark +
  wordmark in the header instead. No horizontal scroll at any width; the
  form column has a `max-w-sm` cap and the outer page uses fluid padding
  (`px-6` → `sm:px-10` → `lg:px-16`).
- Verified at 1440px (desktop), 834px (tablet), and 390px (mobile) widths.

## Accessibility

- All inputs have associated `<Label>`s via `useId()`-generated `htmlFor`/`id`
  pairs (stable across server/client render).
- Validation errors use `aria-invalid` + `aria-describedby` pointing at a
  `role="alert"` message element, and are announced as they appear.
- Password visibility toggle is a real `<button>` with `aria-label` and
  `aria-pressed`, excluded from tab order (`tabIndex={-1}`) since it's a
  secondary action next to the password field.
- Focus rings use the brand `--ring` token, which meets 3:1 contrast against
  both card and page backgrounds in both themes.
- Color is never the sole error indicator — errors carry an icon + text.
- Color tokens were selected to meet WCAG AA contrast (see Design Decisions).

## State Management

- **Form state:** `react-hook-form` + `zodResolver(loginSchema)`
  (`src/lib/validations/auth.schema.ts`).
- **Server state:** `useLogin()` (`src/hooks/use-login.ts`) wraps
  `authService.login` in a TanStack Query `useMutation` — no `useEffect`
  fetching.
- **Global state:** `useAuthStore` (Zustand, `src/store/auth.store.ts`)
  persists the "keep me logged in" preference to `localStorage`; the
  authenticated member itself is intentionally _not_ persisted here yet
  (that lands with session/token handling in a later milestone).

## Files Created

```
src/app/(auth)/layout.tsx
src/app/(auth)/login/page.tsx
src/app/page.tsx                          (redirect → /login)
src/app/layout.tsx                        (providers, fonts, metadata)
src/app/icon.svg                          (favicon)
src/app/globals.css                       (brand color tokens)
src/components/layouts/auth-layout.tsx
src/components/features/auth/auth-brand-panel.tsx
src/components/features/auth/login-form.tsx
src/components/brand/logo.tsx
src/components/brand/logo-mark.tsx
src/components/theme/theme-provider.tsx
src/components/theme/theme-toggle.tsx
src/components/providers/query-provider.tsx
src/lib/axios.ts
src/lib/validations/auth.schema.ts
src/services/auth.service.ts
src/hooks/use-login.ts
src/store/auth.store.ts
src/types/auth.ts
public/logo-full.svg
```

## Dependencies

Next.js 15, React 19, TypeScript, Tailwind CSS v4, shadcn/ui (base-ui
primitives), TanStack Query, React Hook Form, `@hookform/resolvers`, Zod,
Axios, Framer Motion, Lucide React, `next-themes`, Sonner, Zustand,
`clsx` / `tailwind-merge` / `class-variance-authority`. ESLint, Prettier,
Husky, and lint-staged are wired for commit-time formatting/linting.

**Note on pinned versions:** `zod` is pinned to `4.0.0` — the latest
`@hookform/resolvers@5.4.0` ships type definitions that don't structurally
match `zod@4.4.x`'s internals (a real upstream type-level incompatibility
discovered while building this page, not a stylistic choice). Runtime
behavior is unaffected; this can be revisited when `@hookform/resolvers`
publishes a fix.

## Future Improvements

- Wire real navigation to `/otp` once that page exists, passing the
  membership ID forward (likely via a short-lived value in the auth store
  rather than a query param).
- Replace `authService`'s mock branch with a real endpoint once the backend
  is available; delete the mock once `NEXT_PUBLIC_API_URL` is set in every
  environment.
- Add rate-limit / lockout messaging for repeated failed attempts once the
  backend supports it.
- Consider a `prefers-reduced-motion` check to shorten/disable the stagger
  animations for users who request it (currently relies on Framer Motion's
  defaults, which do not auto-respect this).

## Developer Notes

- This project pins `next@15.x` deliberately (per the brief) even though
  `create-next-app@latest` scaffolds Next 16 by default — see the
  `package.json` history if the two ever drift again after a `pnpm update`.
- `eslint.config.mjs` uses `FlatCompat` to load `eslint-config-next`, because
  `eslint-config-next@15.5.20` still ships legacy `.eslintrc`-style configs
  under `next/core-web-vitals.js`, not flat-config arrays — the native flat
  config only appeared in `eslint-config-next@16`.
- shadcn/ui here is generated against `@base-ui/react`, not Radix. Composition
  uses base-ui's `render` prop (`<Trigger render={<Button />}>`), not Radix's
  `asChild` — worth knowing before copying patterns from Radix-based shadcn
  examples found elsewhere.
