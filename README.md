# T-Coop

The enterprise platform for managing co-operative savings, contributions,
loans, and dividends — rebuilt as a modern, premium SaaS frontend. No
backend is wired up yet: authentication, the dashboard, and every flow
below run against a hardcoded mock so the whole app is demoable end-to-end.

## Tech Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
shadcn/ui (on [Base UI](https://base-ui.com), not Radix) · TanStack Query ·
React Hook Form + Zod · Zustand · Framer Motion · Recharts · next-themes

## Getting Started

```bash
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) — it redirects to
`/login`.

**Mock auth requires one env var.** Create `.env.local` (gitignored) in the
project root with:

```
NEXT_PUBLIC_USE_MOCK_AUTH=true
```

Without it, the app posts to a real `/api/auth/*` endpoint that doesn't
exist yet, and every auth flow fails silently against a 404. This is the
single most common "why can't I log in" cause — check this first.

## Demo Accounts

There is no sign-up path into the app itself (see
[register-page.md](./documentation/register-page.md) for why) — these three
hardcoded roles are the only way in. The login page also has a
click-to-autofill panel for these, so you don't need to type them by hand.

| Role        | Membership ID | Password          | Lands on                        |
| ----------- | ------------- | ----------------- | ------------------------------- |
| Super Admin | `SA-0001`     | `SuperAdmin@2026` | `/dashboard` (super admin view) |
| Admin       | `AD-0001`     | `Admin@2026`      | `/dashboard` (admin view)       |
| Member      | `MB-0001`     | `Member@2026`     | `/dashboard` (member view)      |

Defined in `src/lib/mock-users.ts`. Passwords are mutable at runtime — the
password-recovery flow genuinely changes them in-memory (resets on a full
page reload, since there's no backend to persist to).

## Routes

| Route                  | Purpose                                             | Docs                                                         |
| ---------------------- | --------------------------------------------------- | ------------------------------------------------------------ |
| `/login`               | Sign in with a membership ID + password             | [login-page.md](./documentation/login-page.md)               |
| `/forgot-password`     | Request a one-time password by email                | [password-recovery.md](./documentation/password-recovery.md) |
| `/verify-otp`          | Enter the OTP sent (simulated) to your email        | [password-recovery.md](./documentation/password-recovery.md) |
| `/create-new-password` | Set a new password after OTP verification           | [password-recovery.md](./documentation/password-recovery.md) |
| `/register`            | Register a new co-operative                         | [register-page.md](./documentation/register-page.md)         |
| `/dashboard`           | Role-aware dashboard (super admin / admin / member) | [dashboard.md](./documentation/dashboard.md)                 |

Cross-cutting systems (theming, fonts, animation, the branded loading
system, and two real bugs worth knowing about before touching menu or
theme code) are documented separately in
[theming-and-motion.md](./documentation/theming-and-motion.md).

## Scripts

- `pnpm dev` — start the dev server
- `pnpm build` — production build
- `pnpm start` — run a production build
- `pnpm lint` — run ESLint
- `pnpm format` — run Prettier

## Project Structure

```
src/
  app/
    (auth)/                  split-screen layout — /login
    (password-recovery)/     centered layout — /forgot-password, /verify-otp,
                              /create-new-password, /register
    (dashboard)/              role-aware dashboard, auth-guarded
    layout.tsx, template.tsx, loading.tsx   root providers + page transitions
  components/
    brand/                   logo, animated loading mark, route transitions
    features/auth/           one form component per auth screen
    features/dashboard/      quick-summary cards, activity chart, activity list
    layouts/                 the three shared page shells (auth / centered / dashboard)
    theme/                   next-themes provider + toggle
    ui/                      shadcn primitives (Base UI-based)
  config/                    role → nav item mapping
  hooks/                     one hook per mutation, + small UI-timing hooks
  lib/                       mock data, validation schemas, small utilities
  services/                  authService — the one seam a real backend plugs into
  store/                     Zustand stores (auth session, password-reset session)
  types/                     shared domain types
```

## Project Documentation

Per-feature design decisions, accessibility notes, and architecture are
documented under [`documentation/`](./documentation) as each screen ships —
see the [Routes](#routes) table above for the map. These are living
documents: read them before changing the feature they describe, and update
them when the feature's behavior changes, not just when it's first built.

## Status

- [x] Login (3 hardcoded roles, demo-account picker)
- [x] Forgot password → OTP → new password
- [x] Register co-operative
- [x] Dashboard (super admin / admin / member views)
- [x] Light/dark theme
- [ ] Real backend integration (everything currently mocked in `src/services/auth.service.ts`)
- [ ] The dashboard's non-Dashboard nav items (Co-operatives, Loans, Settings, etc.)

## Known Gotchas

- **Base UI, not Radix.** This shadcn setup is generated against
  `@base-ui/react`. Its `Menu.Item` takes `onClick`, not Radix's
  `onSelect` — the latter silently type-checks (it's a real, unrelated
  native DOM event) but never fires. Full story in
  [theming-and-motion.md](./documentation/theming-and-motion.md#the-onselect-vs-onclick-bug).
- **Font loader variable names matter.** `globals.css` expects the loaded
  font's `variable` option to be exactly `--font-sans` for the Tailwind
  theme handoff to resolve. Details in
  [theming-and-motion.md](./documentation/theming-and-motion.md#the-font-pipeline---font-sans).
- `zod` is pinned to `4.0.0` — `@hookform/resolvers@5.4.0`'s types don't
  structurally match newer `zod@4.4.x` internals. Runtime is unaffected;
  revisit when `@hookform/resolvers` publishes a fix.
