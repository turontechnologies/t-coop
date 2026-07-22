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

**Real payments require a Paystack public key.** To pay for a new savings
entry on `/savings`, add a **test-mode** public key to the same
`.env.local`:

```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
```

Never put a Paystack _secret_ key in a `NEXT_PUBLIC_*` variable. Without
this one set, "Proceed" in the Add to Savings modal fails with a toast
explaining what's missing rather than doing nothing silently. See
[savings-page.md](./documentation/savings-page.md#setup-paystack).

## Demo Accounts

There is no public sign-up path into the app — these three hardcoded roles
are the only way in. New co-operatives are added by a super admin from
`/co-operatives` (see [co-operatives-page.md](./documentation/co-operatives-page.md)),
not self-service. The login page also has a click-to-autofill panel for
these three roles, so you don't need to type them by hand.

| Role        | Membership ID | Password          | Lands on                        |
| ----------- | ------------- | ----------------- | ------------------------------- |
| Super Admin | `SA-0001`     | `SuperAdmin@2026` | `/dashboard` (super admin view) |
| Admin       | `AD-0001`     | `Admin@2026`      | `/dashboard` (admin view)       |
| Member      | `MB-0001`     | `Member@2026`     | `/dashboard` (member view)      |

Defined in `src/lib/mock-users.ts`. Passwords are mutable at runtime — the
password-recovery flow genuinely changes them in-memory (resets on a full
page reload, since there's no backend to persist to).

## Routes

| Route                                           | Purpose                                                      | Docs                                                                   |
| ----------------------------------------------- | ------------------------------------------------------------ | ---------------------------------------------------------------------- |
| `/login`                                        | Sign in with a membership ID + password                      | [login-page.md](./documentation/login-page.md)                         |
| `/forgot-password`                              | Request a one-time password by email                         | [password-recovery.md](./documentation/password-recovery.md)           |
| `/verify-otp`                                   | Enter the OTP sent (simulated) to your email                 | [password-recovery.md](./documentation/password-recovery.md)           |
| `/create-new-password`                          | Set a new password after OTP verification                    | [password-recovery.md](./documentation/password-recovery.md)           |
| `/dashboard`                                    | Role-aware dashboard (super admin / admin / member)          | [dashboard.md](./documentation/dashboard.md)                           |
| `/profile`                                      | View your own member details, Edit to change them (any role) | [profile-page.md](./documentation/profile-page.md)                     |
| `/savings`                                      | Savings & Contributions (member only for now; real Paystack) | [savings-page.md](./documentation/savings-page.md)                     |
| `/savings/[id]`                                 | Individual savings record detail                             | [savings-page.md](./documentation/savings-page.md)                     |
| `/loans`                                        | Loans (member only for now; eligibility + application flow)  | [loans-page.md](./documentation/loans-page.md)                         |
| `/loans/[id]`                                   | Individual loan detail (repayment schedule, transactions)    | [loans-page.md](./documentation/loans-page.md)                         |
| `/co-operatives`                                | Super admin: list every co-operative, add a new one          | [co-operatives-page.md](./documentation/co-operatives-page.md)         |
| `/co-operatives/new`                            | Add a new co-operative (moved here from the old `/register`) | [co-operatives-page.md](./documentation/co-operatives-page.md)         |
| `/co-operatives/[id]`                           | One co-op's details + Members/Savings/Loans tabs             | [co-operatives-page.md](./documentation/co-operatives-page.md)         |
| `/co-operatives/[id]/members/[memberId]`        | One member's own details + Savings/Loans tabs                | [co-operatives-page.md](./documentation/co-operatives-page.md)         |
| `/co-operatives/[id]/savings/[type]`            | All transactions of one savings product in the co-op         | [co-operatives-page.md](./documentation/co-operatives-page.md)         |
| `/co-operatives/[id]/savings/record/[recordId]` | Individual savings record detail (co-op scoped)              | [co-operatives-page.md](./documentation/co-operatives-page.md)         |
| `/co-operatives/[id]/loans/[type]`              | All loan applications of one loan product in the co-op       | [co-operatives-page.md](./documentation/co-operatives-page.md)         |
| `/co-operatives/[id]/loans/record/[recordId]`   | Individual loan detail, repayment schedule + transactions    | [co-operatives-page.md](./documentation/co-operatives-page.md)         |
| `/members`                                      | Admin: list the members of their co-operative, add a new one | [members-directory-page.md](./documentation/members-directory-page.md) |
| `/members/new`                                  | Add a member, with a BVN-verification auto-fill step         | [members-directory-page.md](./documentation/members-directory-page.md) |
| `/members/[memberId]`                           | One member's own details + Savings/Loans tabs                | [members-directory-page.md](./documentation/members-directory-page.md) |

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
                              /create-new-password
    (dashboard)/              role-aware dashboard, auth-guarded
                              (co-operatives/, members/ nested under here)
    layout.tsx, template.tsx, loading.tsx   root providers + page transitions
  components/
    brand/                   logo, animated loading mark, route transitions
    features/auth/           one form component per auth screen
    features/coop/           co-operatives list/detail/member/drill-down components
    features/dashboard/      quick-summary cards, activity chart, activity list
    features/loans/          loans list/modal/detail components
    features/members-directory/  admin's own members list + add-member form
    features/profile/        profile view + edit-toggle form
    features/savings/        savings list/modal/detail
    features/shared/         cross-feature components (export/import menu)
    layouts/                 the three shared page shells (auth / centered / dashboard)
    theme/                   next-themes provider + toggle
    ui/                      shadcn primitives (Base UI-based)
  config/                    role → nav item mapping
  hooks/                     one hook per mutation, + small UI-timing hooks
  lib/                       mock data, validation schemas, small utilities
  services/                  auth/profile/etc. services — the seam a real backend plugs into
  store/                     Zustand stores (auth session, password-reset session,
                              savings records, loan records, co-operatives)
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
- [x] Dashboard (super admin / admin / member views)
- [x] My Profile (read-only by default, Edit toggle, all roles)
- [x] Savings & Contributions (member view, real Paystack checkout, savings detail page — admin/super-admin oversight view removed, awaiting a corrected reference design)
- [x] Loans (member view, eligibility-based application flow, repayment schedule + transactions detail page — admin/super-admin oversight view removed, awaiting a corrected reference design)
- [x] Co-operatives (super admin: list, add, per-co-op Members/Savings/Loans drill-down, member detail, record detail)
- [x] Members Directory (admin: list, add with BVN auto-fill, bulk import via template, export, edit, disable/activate, member detail with Savings/Loans tabs, responsive mobile cards)
- [x] Light/dark theme
- [ ] Real backend integration (everything currently mocked in `src/services/*.service.ts`)
- [ ] Server-side Paystack transaction verification (client-side callback is trusted for now — see savings-page.md)
- [ ] Admin loan approval action (loans stay "Awaiting Approval" indefinitely — see loans-page.md)
- [ ] Real photo upload for the profile avatar (Cloudinary — in progress)
- [ ] The dashboard's other non-Dashboard nav items (Subscriptions, Settings, etc.)

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
- **`Calendar`'s focus prop is `autoFocus`, not `initialFocus`.** This
  project's `react-day-picker` is v10, which renamed the prop; older
  shadcn snippets/docs still show `initialFocus`. Passing the old name
  isn't a type error — React just silently drops an unrecognized prop —
  so the calendar quietly loses its open-focus behavior instead of
  failing loudly. See [savings-page.md](./documentation/savings-page.md)
  for where this first showed up.
