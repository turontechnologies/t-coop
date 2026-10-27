# T-Coop

The enterprise platform for managing co-operative savings, contributions,
loans, and dividends — a modern SaaS web frontend for the
[t-coop-backend](../t-coop-backend) Spring Boot API. Every screen reads and
writes the real backend; there is no mock mode. A companion mobile app
lives in `t-coop-mobile`.

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
`/login`. The backend must be running (see its README; locally,
`docker compose up` in `t-coop-backend` serves it on port 8080).

Create `.env.local` (gitignored) in the project root:

```
NEXT_PUBLIC_API_URL=http://localhost:8080/api/v1   # the backend
PAYSTACK_SECRET_KEY=sk_test_...                    # savings-withdrawal payouts only
CLOUDINARY_CLOUD_NAME=...                          # profile photo uploads
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

**Payment gateway keys are not env vars.** Paystack/Flutterwave/OPay keys
are entered in the app: the super admin's Settings → Integrations (platform
keys — subscriptions, bank lookups, and co-op payments by default) and each
co-op admin's Settings → Integrations (that co-op's own account for member
deposits, repayments, and loan payouts). See
[payments-and-payouts.md](./documentation/payments-and-payouts.md).

`PAYSTACK_SECRET_KEY` is only read by the web app's
`src/app/api/paystack/transfer*` route, used for savings-withdrawal payouts.
Use a **test-mode** key and never put it in a `NEXT_PUBLIC_*` variable.
Cloudinary credentials are server-only too (no `NEXT_PUBLIC_` prefix).

## Accounts

There's no public sign-up. The backend's seed migrations create a super
admin and a demo co-operative; everything else is created in the app:

| Role        | Membership ID | Password   | Notes                                                                   |
| ----------- | ------------- | ---------- | ----------------------------------------------------------------------- |
| Super Admin | `SA-0001`     | `admin123` | Creates co-operatives from `/co-operatives`                             |
| Co-op Admin | `COOP-0001`   | `admin123` | A co-op's admin logs in with the co-op's own ID                         |
| Member      | `MB-0001`     | `admin123` | Seeded member of `COOP-0001`; new members are added from `/members/new` |

Every new co-op admin and member starts on the default password `admin123`
and is expected to change it (Settings → password, or Forgot password).

## Routes

| Route                                           | Purpose                                                                                                                                                          | Docs                                                                                                                   |
| ----------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `/login`                                        | Sign in with a membership ID + password                                                                                                                          | [login-page.md](./documentation/login-page.md)                                                                         |
| `/forgot-password`                              | Request a one-time password by email                                                                                                                             | [password-recovery.md](./documentation/password-recovery.md)                                                           |
| `/verify-otp`                                   | Enter the OTP emailed to you                                                                                                                                     | [password-recovery.md](./documentation/password-recovery.md)                                                           |
| `/create-new-password`                          | Set a new password after OTP verification                                                                                                                        | [password-recovery.md](./documentation/password-recovery.md)                                                           |
| `/dashboard`                                    | Role-aware dashboard (super admin / admin / member)                                                                                                              | [dashboard.md](./documentation/dashboard.md)                                                                           |
| `/profile`                                      | View your own member details, Edit to change them (any role)                                                                                                     | [profile-page.md](./documentation/profile-page.md)                                                                     |
| `/api/upload`                                   | Route handler: signs and uploads the profile photo to Cloudinary                                                                                                 | [profile-page.md](./documentation/profile-page.md)                                                                     |
| `/api/paystack/transfer`                        | Route handler: savings-withdrawal payout (loan payouts run on the backend)                                                                                       | [payments-and-payouts.md](./documentation/payments-and-payouts.md)                                                     |
| `/api/paystack/transfer/finalize`               | Route handler: OTP-confirms a payout, if Paystack requires it                                                                                                    | [payments-and-payouts.md](./documentation/payments-and-payouts.md)                                                     |
| `/savings`                                      | Savings & Contributions (member + admin; real Paystack)                                                                                                          | [savings-page.md](./documentation/savings-page.md)                                                                     |
| `/savings/[id]`                                 | Individual savings record detail (member's own)                                                                                                                  | [savings-page.md](./documentation/savings-page.md)                                                                     |
| `/savings/type/[type]`                          | Admin: all members' records for one savings type                                                                                                                 | [savings-page.md](./documentation/savings-page.md)                                                                     |
| `/savings/record/[recordId]`                    | Admin: individual savings record detail                                                                                                                          | [savings-page.md](./documentation/savings-page.md)                                                                     |
| `/loans`                                        | Loans (member + admin; eligibility + application flow)                                                                                                           | [loans-page.md](./documentation/loans-page.md)                                                                         |
| `/loans/[id]`                                   | Individual loan detail (member's own)                                                                                                                            | [loans-page.md](./documentation/loans-page.md)                                                                         |
| `/loans/type/[type]`                            | Admin: all members' records for one loan type                                                                                                                    | [loans-page.md](./documentation/loans-page.md)                                                                         |
| `/loans/record/[recordId]`                      | Admin: individual loan detail                                                                                                                                    | [loans-page.md](./documentation/loans-page.md)                                                                         |
| `/loans/request/[recordId]`                     | Guarantor accept/decline, officer approval chain (VP → Treasurer → Secretary → payout), approvals timeline                                                       | [loans-page.md](./documentation/loans-page.md)                                                                         |
| `/co-operatives`                                | Super admin: list every co-operative, add a new one                                                                                                              | [co-operatives-page.md](./documentation/co-operatives-page.md)                                                         |
| `/co-operatives/new`                            | Add a new co-operative (moved here from the old `/register`)                                                                                                     | [co-operatives-page.md](./documentation/co-operatives-page.md)                                                         |
| `/co-operatives/[id]`                           | One co-op's details + Members/Savings/Loans tabs                                                                                                                 | [co-operatives-page.md](./documentation/co-operatives-page.md)                                                         |
| `/co-operatives/[id]/members/[memberId]`        | One member's own details + Savings/Loans tabs                                                                                                                    | [co-operatives-page.md](./documentation/co-operatives-page.md)                                                         |
| `/co-operatives/[id]/savings/[type]`            | All transactions of one savings product in the co-op                                                                                                             | [co-operatives-page.md](./documentation/co-operatives-page.md)                                                         |
| `/co-operatives/[id]/savings/record/[recordId]` | Individual savings record detail (co-op scoped)                                                                                                                  | [co-operatives-page.md](./documentation/co-operatives-page.md)                                                         |
| `/co-operatives/[id]/loans/[type]`              | All loan applications of one loan product in the co-op                                                                                                           | [co-operatives-page.md](./documentation/co-operatives-page.md)                                                         |
| `/co-operatives/[id]/loans/record/[recordId]`   | Individual loan detail, repayment schedule + transactions                                                                                                        | [co-operatives-page.md](./documentation/co-operatives-page.md)                                                         |
| `/members`                                      | Admin: list the members of their co-operative, add a new one                                                                                                     | [members-directory-page.md](./documentation/members-directory-page.md)                                                 |
| `/members/new`                                  | Add a member, with a real bank-account verification step                                                                                                         | [members-directory-page.md](./documentation/members-directory-page.md)                                                 |
| `/members/[memberId]`                           | One member's own details + Savings/Loans tabs                                                                                                                    | [members-directory-page.md](./documentation/members-directory-page.md)                                                 |
| `/notice-board`                                 | All roles: real-time announcements/meeting notices/minutes                                                                                                       | [notice-board-page.md](./documentation/notice-board-page.md)                                                           |
| `/notice-board/new`                             | Create a notice (admin/super admin only)                                                                                                                         | [notice-board-page.md](./documentation/notice-board-page.md)                                                           |
| `/notice-board/[id]`                            | A notice + attachment download + the reply/feedback thread                                                                                                       | [notice-board-page.md](./documentation/notice-board-page.md)                                                           |
| `/subscriptions`                                | Super admin: every co-op's subscription standing + manual upload                                                                                                 | [subscriptions-page.md](./documentation/subscriptions-page.md)                                                         |
| `/subscriptions/[id]`                           | One co-op's full subscription payment history                                                                                                                    | [subscriptions-page.md](./documentation/subscriptions-page.md)                                                         |
| `/settings`                                     | Role-branched: super admin (profile, fees, integrations, staff, logs) / admin (profile, savings & loan settings, co-op settings, integrations, staff & officers) | [settings-page.md](./documentation/settings-page.md), [admin-settings-page.md](./documentation/admin-settings-page.md) |
| `/settings/loans/new`                           | Admin: create/edit a loan type (full page)                                                                                                                       | [admin-settings-page.md](./documentation/admin-settings-page.md)                                                       |

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
                              (co-operatives/, members/, notice-board/ nested under here)
    api/upload/               route handler: signed Cloudinary upload for avatars
    api/paystack/             route handlers: transfer + finalize (savings-withdrawal payouts)
    layout.tsx, template.tsx, loading.tsx   root providers + page transitions
  components/
    brand/                   logo, animated loading mark, route transitions
    features/auth/           one form component per auth screen
    features/coop/           co-operatives list/detail/member/drill-down components
    features/dashboard/      quick-summary cards, activity chart, activity list
    features/loans/          loans list/modal/detail; admin-loans-view.tsx
                              (Quick Summary + tabs), loan-requests-table.tsx
    features/members-directory/  admin's own members list + add-member form
    features/notice-board/   create notice form, list, reply thread, member view
    features/profile/        profile view + edit-toggle form
    features/savings/        savings list/modal/detail; admin-savings-view.tsx
                              (Quick Summary + tabs), upload-teller-modal.tsx,
                              savings-requests-table.tsx
    features/shared/         cross-feature components (export/import menu,
                              live cascading Country/State/City fields)
    layouts/                 the three shared page shells (auth / centered / dashboard)
    theme/                   next-themes provider + toggle
    ui/                      shadcn primitives (Base UI-based)
  config/                    role → nav item mapping
  hooks/                     one hook per mutation, + small UI-timing hooks,
                              cross-tab real-time sync
  lib/                       types, validation schemas, gateway widgets, small utilities
  services/                  one service per backend area — every call goes to the real API
  store/                     Zustand stores for client session state only (auth session,
                              password-reset session)
  types/                     shared domain types
```

## Project Documentation

Per-feature design decisions, accessibility notes, and architecture are
documented under [`documentation/`](./documentation) as each screen ships —
see the [Routes](#routes) table above for the map. These are living
documents: read them before changing the feature they describe, and update
them when the feature's behavior changes, not just when it's first built.

For a single-file snapshot of everything currently built (instead of
reading each doc separately), see
[project-overview.md](./documentation/project-overview.md). The API
contract lives in the backend repo:
`t-coop-backend/documentation/api-contracts.md`.

## Status

- [x] Login (real backend auth; super admin, co-op admin, co-op staff, member)
- [x] Forgot password → OTP → new password
- [x] Dashboard (super admin / admin / member views)
- [x] My Profile (read-only by default, Edit toggle, all roles; real Cloudinary photo upload)
- [x] Savings & Contributions (member: real Paystack checkout, real withdrawal requests, savings detail page. admin: Quick Summary, Members Savings/My Savings/Request tabs, Upload Teller with receipt attachment, deposit approval + real-payout withdrawal approval. super admin: `/savings` oversight page — all co-ops' savings totals, drills into each co-op's existing Savings tab)
- [x] Loans (member: eligibility-based application flow, repayment schedule + transactions detail page. admin: Quick Summary, Requests/Members Loans/My Loans tabs, guarantor accept/reject with payslip upload, officer approval chain Vice President → Treasurer → Secretary with automatic server-side payout, President can reject at any stage, admin covers vacant offices; real installment repayments. super admin: oversight)
- [x] Co-operatives (super admin: list, add, per-co-op Members/Savings/Loans drill-down, member detail, record detail)
- [x] Members Directory (admin: list, add with real bank-account verification — no guarantor needed to join, next of kin optional, bulk import via template, export, edit (including bank details), disable/activate, member detail with Savings/Loans tabs, responsive mobile cards)
- [x] Notice Board (all roles; real cross-tab real-time via `storage` events — announcements, meeting notices, meeting minutes with PDF attachment, scheduled send, reply/feedback thread, live notification bell)
- [x] Real Paystack Transfers (loan disbursement, savings withdrawal payouts), real bank-account verification, live bank list, live cascading Country/State/City — see [payments-and-payouts.md](./documentation/payments-and-payouts.md)
- [x] Subscriptions (super admin: every co-op's subscription standing, revenue, manual payment upload, per-co-op payment history — see [subscriptions-page.md](./documentation/subscriptions-page.md))
- [x] Settings (super admin: profile + password, fees & collections account, dual Paystack/Flutterwave integration toggles, platform staff users/roles with full edit/disable/remove actions, real app-wide audit log with live IP-resolved location — see [settings-page.md](./documentation/settings-page.md). admin: profile + personal bank account, savings/loan type catalog management (add/edit/enable/disable), co-operative profile + bank account + currency, own payment gateways (Integrations), co-op staff roles including the four officer roles — see [admin-settings-page.md](./documentation/admin-settings-page.md))
- [x] Per-co-op currency with live conversion (admin sets their co-op's currency from ~160 real ISO 4217 options; super admin sees it read-only with a genuinely live rate against NGN, refreshed on a timer, everywhere a co-op shows up; every displayed savings/loans amount app-wide is formatted in that co-op's own currency, isolated per co-op on the super-admin side, with cross-co-op aggregates genuinely converted and summed — see [currency-conversion.md](./documentation/currency-conversion.md))
- [x] Light/dark theme
- [x] Real backend for everything — no mock mode; payments verified server-side
- [ ] Move savings-withdrawal payouts to the backend (loan payouts already are)
- [ ] Confirm payments and transfers by Paystack webhook, not only the synchronous response

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
