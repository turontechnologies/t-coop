# T-Coop — Current State (Everything We Have, In One File)

Snapshot of what's actually built today. This merges `README.md` and every
file under `documentation/` into one place — those files still exist and go
deeper on any one topic, but this is the single-file version.

**No real backend is wired up yet.** Every flow below runs against
hardcoded mock data / in-memory Zustand stores, **except** Paystack
(payments, bank verification, payouts) and Cloudinary (photo upload), which
are genuinely real, working integrations already. See
[API contracts](./api-contracts.md) for the endpoints a real backend needs
to expose.

---

## Tech Stack

Next.js 15 (App Router) · React 19 · TypeScript · Tailwind CSS v4 ·
shadcn/ui (on [Base UI](https://base-ui.com), not Radix) · TanStack Query ·
React Hook Form + Zod · Zustand · Framer Motion · Recharts · next-themes

## Roles & Demo Accounts

Three hardcoded roles, no public sign-up — a super admin creates new
co-operatives from `/co-operatives`, that's the only "onboarding" path.

| Role        | Membership ID | Password          | Lands on                        |
| ----------- | ------------- | ----------------- | ------------------------------- |
| Super Admin | `SA-0001`     | `SuperAdmin@2026` | `/dashboard` (super admin view) |
| Admin       | `AD-0001`     | `Admin@2026`      | `/dashboard` (admin view)       |
| Member      | `MB-0001`     | `Member@2026`     | `/dashboard` (member view)      |

Defined in `src/lib/mock-users.ts`. Passwords are mutable at runtime (the
password-recovery flow genuinely changes them in-memory) but reset on a
full page reload since there's no backend to persist to.

- **Super Admin** — oversees every co-operative on the platform.
- **Admin** — manages the members, savings, and loans of the one
  co-operative they run.
- **Member** — manages their own savings, loans, and profile.

## What's Real vs. Mocked

| Integration                                                                       | Status                                                       | Where                                                         |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------ | ------------------------------------------------------------- |
| Paystack Inline (savings deposit checkout)                                        | **Real** — needs a test-mode public key                      | `NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`                             |
| Paystack bank-account verification                                                | **Real** — needs a test-mode secret key                      | `PAYSTACK_SECRET_KEY`, `src/app/api/paystack/resolve-account` |
| Paystack live bank list                                                           | **Real**                                                     | `src/app/api/paystack/banks`                                  |
| Paystack Transfers (loan disbursement, savings withdrawal payout)                 | **Real**                                                     | `src/app/api/paystack/transfer`, `/transfer/finalize`         |
| Cloudinary profile-photo upload                                                   | **Real** — needs `CLOUDINARY_*` env vars                     | `src/app/api/upload`                                          |
| Country/State/City cascade                                                        | **Real** — free public API, called directly from the browser | `src/lib/geo-lookup.ts` (countriesnow.space)                  |
| Everything else (auth, members, savings/loan records, notices, dashboard numbers) | **Mocked** — in-memory only, resets on reload                | `src/lib/*-data.ts`, `src/store/*.store.ts`                   |

Two known real-world constraints discovered while building the payout
integration (not app bugs): Paystack's test mode caps real-bank-account
resolves at 3/day (bank code `001` "Test Bank" works around this for
verification only, not for actual payouts), and an actual Transfer needs
the connected Paystack business account to be past "Starter" tier
(`"You cannot initiate third party payouts as a starter business"` — a
Paystack KYB/business-verification requirement, not something fixable in
code). Full detail in [payments-and-payouts.md](./payments-and-payouts.md).

---

## Feature Areas

### Auth (`/login`, `/forgot-password`, `/verify-otp`, `/create-new-password`)

Split-screen `/login` (Membership ID + Password, not email). Full working
password-reset loop: request OTP by email (simulated — OTP is currently
just handed back to the client, a real backend must email it instead and
never return it), verify the 6-digit code, set a new password that
genuinely persists in-memory and works to log back in. OTP is **not**
part of primary login — only the reset flow.

### Dashboard (`/dashboard`)

One route, one layout, shared by all three roles — content (quick-summary
cards, activity chart, recent activity list) reconfigures per role. **All
figures here are currently 100% static/hardcoded**, not derived from the
real savings/loan/member data elsewhere in the app — this is the single
biggest "looks real but isn't" gap in the whole demo.

### Profile (`/profile`, all roles)

Read-only by default, "Edit" toggles a form. Real Cloudinary photo upload.
Bank Account section (bank picker + account number + "Verify" button that
calls real Paystack resolve, shows the resolved account holder name) —
this replaced an earlier BVN field entirely. Country/State/City via the
live cascading dropdown.

### Savings & Contributions (`/savings`)

- **Member**: real Paystack checkout for a new deposit, request a
  withdrawal (goes to admin for approval), savings-record detail page.
- **Admin**: Quick Summary, "Members Savings" (by-type breakdown →
  per-type record table → record detail) / "My Savings" / "Request"
  tabs, manual teller-upload with receipt attachment, approve/decline
  deposit or withdrawal requests — approving a withdrawal triggers a
  **real** Paystack payout to the member's saved bank details (never
  marks Approved if the transfer fails).
- **Super Admin**: `/savings` now shows a real oversight page — Quick
  Summary (Total Savings + an illustrative Transaction Fees Received
  figure, 0.25% of volume, clearly not a real fee ledger), a table of
  every co-operative with its savings totals, clicking a row deep-links
  into that co-op's existing Savings tab. (Loans doesn't have this
  super-admin top-level view yet — see Loans below.)

Filter-by-savings-type is available everywhere records are listed
(records tables and the Requests tabs, both admin and member).

### Loans (`/loans`)

- **Member**: eligibility-gated "Take a Loan" flow (amount is validated
  against a live-computed max before you can even type past it), live
  cost preview, repayment schedule + transactions detail page.
- **Admin**: Quick Summary, "Requests" (guarantor-accept/reject with
  payslip upload → admin approve/reject-with-reason) / "Members Loans" /
  "My Loans" tabs. Approving triggers a real Paystack payout the same way
  savings withdrawal does.
- **Super Admin**: nav item still has no dedicated `/loans` view — the
  equivalent oversight already exists per co-operative under
  `/co-operatives/[id]/loans/...`, same situation Savings was in before
  this session's work gave it a real top-level page.

Two loan status models currently exist side by side and aren't unified:
the member's own simple `LoanRecord` (`Active|Awaiting Approval|
Completed|Rejected`, no guarantor step, never resolved by an admin
action) vs. the richer co-op-scoped `CoopLoanRecord` (adds
`Awaiting Guarantor`/`Awaiting Admin`, the real approval pipeline). A real
backend should standardize on the richer one.

### Co-operatives (`/co-operatives`, super admin only)

List every co-op, add a new one (writes straight to the co-op store,
duplicate-ID checked, no "pending review" queue — the super admin _is_
the approval authority). Drill down: co-op → Members/Savings/Loans tabs →
individual member/savings-type/loan-type → individual record detail.
This replaced the old public `/register` route entirely — co-operatives
are admin-created, not self-service.

### Members Directory (`/members`, admin only)

The admin's own co-op's member list: add (with the same real bank-account
verification step as Profile), bulk import via an Excel template, export,
edit (including bank details), activate/disable, per-member detail with
their own Savings/Loans tabs. Currently hardcoded to one fixed co-op ID
(`ADMIN_DIRECTORY_COOP_ID`) standing in for "the admin's own co-op" —
real auth/session data should replace that once a backend exists.

### Notice Board (`/notice-board`, all roles)

Create a notice (General / Meeting Notice with a date / Meeting Minutes
with a PDF attachment), choose recipients (All Members / All Admins /
All Members & Admins) and medium (Email / SMS / both, simulated), send
now or schedule. Real cross-tab real-time sync via the browser `storage`
event (not a server push — works across tabs in the same browser only,
not across devices/users, since there's no backend). Reply thread, live
notification bell, resend, delete.

### Subscriptions (`/subscriptions`, super admin only)

Every co-operative's subscription standing at a glance: Quick Summary
(Mgt Fees Received — total across all co-ops), a table (Co-op ID, Co-op
Name, Revenue Earned, Subscription Fee, Date of last payment, Active/
Overdue status) with search + status filter + date range, "Manual
Upload" to record a payment for any co-op. Clicking a row drills into
`/subscriptions/[id]` — the same `CoopHeaderCard` used on
`/co-operatives/[id]` (Co-op ID/Name/Contact/Admin/Address/Total
Savings/Total Loan + Disable Co-operative), plus that one co-op's full
"Subscription History" table and its own Manual Upload. No real payment
gateway here (money coming _in_ from a co-op, recorded manually, not a
Paystack flow) — see [subscriptions-page.md](./subscriptions-page.md).

### Settings (`/settings`, super admin + admin — role-branched)

**Super admin** gets five tabs: **Profile** (avatar, name/email/address/phone/country, and
an optional inline password change — all backed by the same
`ProfileRecord`/mock-password functions `/profile` and password recovery
already use, so it can't drift out of sync). **Payment Settings** →
Fees & Charges (savings/loan charge type + amount) and Account Details
(the platform's own collections bank account, same real Paystack
"Verify" flow as everywhere else). **Integrations** — Paystack and
Flutterwave as two fully independent toggles (either, both, or
neither), each with its own credential fields, saved as a record only
(the live Paystack integration still reads its keys from the server
environment; Flutterwave has no live route handler behind it yet).
**User Management** — platform staff accounts and roles (distinct from
co-operative members), each row fully actionable: edit (role for
users, name/permissions for roles), disable/activate, remove (role
removal is blocked while a user is still assigned to it). **Logs** — a
real, searchable, app-wide audit trail: every mutating action across
the whole app (login, co-op/member/savings/loan/subscription/notice/
settings actions) writes an entry via a `logActivity()` utility
callable from any store, each patched in place with an approximate
IP-resolved location once it's looked up, viewable in full via a
slide-in Activity Details panel. See [settings-page.md](./settings-page.md).

**Admin** gets a different five tabs, reflecting one co-operative's
day-to-day operations rather than the whole platform: **Profile** (User
sub-tab reuses the exact same component super admin's Profile tab uses;
Bank Accounts is the admin's own personal payout account, same
`ProfileRecord` fields `/profile` manages). **Savings Settings** and
**Loan Settings** — real, working CRUD over the co-op's savings/loan
product catalog (seeded from the same `SAVINGS_TYPES`/`LOAN_TYPES`
constants used everywhere else, honestly not yet wired back into them —
same "illustrative settings" pattern as super admin's Fees & Charges);
new/edit a loan type is a full page
(`/settings/loans/new`, `?id=` for edit) since that form has far more
fields than a modal comfortably holds. **Co-operative Settings** — the
co-op's own profile + committee members, and its own bank account
(Co-operative/Bank Accounts sub-tabs). **User Management** — the exact
same component super admin uses (platform staff is currently shared
between the two roles, not per-co-operative). See
[admin-settings-page.md](./admin-settings-page.md).

Not yet extended to the member role.

### Payments & Payouts (cross-cutting)

Covered under Savings/Loans above and Profile/Members Directory's bank
verification step — full technical detail (route handlers, request/
response shapes, the real Paystack constraints discovered) lives in
[payments-and-payouts.md](./payments-and-payouts.md).

---

## Core Data Models (current, in-memory)

```ts
// Auth
type UserRole = "super_admin" | "admin" | "member";
interface AuthenticatedMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

// Cooperative + nested member/savings/loan records
interface Cooperative {
  id: string;
  name: string;
  adminName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  country: string;
  state: string;
  city: string;
  status: "Active" | "Disabled";
  members: CoopMember[];
  savings: CoopSavingsRecord[];
  loans: CoopLoanRecord[];
  savingsRequests: SavingsRequest[];
  subscriptionFee: number;
  subscriptionPayments: CoopSubscriptionPayment[];
}
interface CoopSubscriptionPayment {
  id: string;
  paymentRef: string;
  amountPaid: number;
  method: "Manual" | "Paystack";
  date: string;
  narration: string;
  status: "Active" | "Overdue"; // subscription standing as of this payment
}
interface CoopMember {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: "Admin" | "Member";
  status: "Active" | "Inactive";
  guarantor: string;
  country: string;
  state: string;
  city: string;
  bankCode: string;
  accountNumber: string;
  accountName: string;
}
interface CoopSavingsRecord {
  id: string;
  memberId: string;
  memberName: string;
  savingsType: string;
  amount: number;
  balanceAfter: number;
  method: "Paystack" | "Manual Upload";
  transactionId: string;
  date: string;
  status: "Success" | "Pending" | "Failed";
  receiptUrl?: string;
}
interface SavingsRequest {
  id: string;
  memberId: string;
  memberName: string;
  type: "Deposit" | "Withdrawal";
  savingsType: string;
  amount: number;
  note?: string;
  status: "Pending" | "Approved" | "Declined";
  requestedAt: string;
  resolvedAt?: string;
}
interface CoopLoanRecord {
  id: string;
  memberId: string;
  memberName: string;
  loanType: string;
  amount: number;
  interestRate: number;
  durationMonths: number;
  numberOfRepayments: number;
  monthlyRepayment: number;
  totalRepayment: number;
  guarantorName: string;
  date: string;
  status:
    | "Awaiting Guarantor"
    | "Awaiting Admin"
    | "Active"
    | "Completed"
    | "Rejected";
  repaymentsMade: number;
  guarantorDocumentUrl?: string;
  guarantorAcceptedAt?: string;
  rejectionReason?: string;
}

// Savings/Loan product catalogs (fixed, 3 of each)
interface SavingsTypeDef {
  name: string;
  min: number;
  max: number;
}
interface LoanTypeDef {
  name: string;
  interestRate: number;
  maxAmount: number;
  durationMonths: number;
  eligibilityPercent: number;
}

// Profile (self)
interface ProfileRecord {
  membershipId: string;
  accountNumber: string;
  bankCode: string;
  accountName: string;
  nin: string;
  firstName: string;
  lastName: string;
  otherName?: string;
  gender: "Male" | "Female" | "Other";
  phone: string;
  email: string;
  homeAddress: string;
  country: string;
  state: string;
  city: string;
  facebook?: string;
  twitter?: string;
  guarantor?: string;
}

// Notices
interface Notice {
  id: string;
  type: "General" | "Meeting Notice" | "Meeting Minutes";
  title: string;
  message: string;
  recipient: "All Members" | "All Admins" | "All Members & Admins";
  medium: "Email" | "SMS" | "Email & SMS";
  meetingDate?: string;
  attachment?: { name: string; dataUrl: string; size: number };
  sendAt: string;
  createdByName: string;
  createdByRole: UserRole;
  createdAt: string;
}
interface NoticeReply {
  id: string;
  noticeId: string;
  authorId: string;
  authorName: string;
  authorRole: UserRole;
  authorAvatarUrl?: string;
  message: string;
  createdAt: string;
}
```

---

## Routes

| Route                                                                                                                                                                       | Purpose                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `/login`                                                                                                                                                                    | Sign in with membership ID + password                                                                                                   |
| `/forgot-password`, `/verify-otp`, `/create-new-password`                                                                                                                   | Password recovery loop                                                                                                                  |
| `/dashboard`                                                                                                                                                                | Role-aware dashboard                                                                                                                    |
| `/profile`                                                                                                                                                                  | Own member details, editable, all roles                                                                                                 |
| `/savings`, `/savings/[id]`, `/savings/type/[type]`, `/savings/record/[recordId]`                                                                                           | Savings (member + admin + now super admin)                                                                                              |
| `/loans`, `/loans/[id]`, `/loans/type/[type]`, `/loans/record/[recordId]`, `/loans/request/[recordId]`                                                                      | Loans (member + admin)                                                                                                                  |
| `/co-operatives`, `/co-operatives/new`, `/co-operatives/[id]`, `/co-operatives/[id]/members/[memberId]`, `/co-operatives/[id]/savings/...`, `/co-operatives/[id]/loans/...` | Super admin oversight                                                                                                                   |
| `/members`, `/members/new`, `/members/[memberId]`                                                                                                                           | Admin's own member directory                                                                                                            |
| `/notice-board`, `/notice-board/new`, `/notice-board/[id]`                                                                                                                  | Announcements/meetings/minutes, all roles                                                                                               |
| `/subscriptions`, `/subscriptions/[id]`                                                                                                                                     | Super admin: subscription oversight                                                                                                     |
| `/settings`                                                                                                                                                                 | Role-branched: super admin (profile, fees, integrations, staff, logs) / admin (profile, savings & loan settings, co-op settings, staff) |
| `/settings/loans/new`                                                                                                                                                       | Admin: create/edit a loan type (full page)                                                                                              |
| `/api/upload`                                                                                                                                                               | Cloudinary avatar upload (real)                                                                                                         |
| `/api/paystack/resolve-account`, `/banks`, `/transfer`, `/transfer/finalize`                                                                                                | Paystack route handlers (real)                                                                                                          |

## Project Structure

```
src/
  app/
    (auth)/                  split-screen layout — /login
    (password-recovery)/     centered layout — forgot/verify/new-password
    (dashboard)/              role-aware dashboard, auth-guarded
                              (co-operatives/, members/, notice-board/ nested here)
    api/upload/               Cloudinary avatar upload
    api/paystack/             bank resolve, live bank list, transfer + finalize
  components/
    brand/                   logo, loading mark, route transitions
    features/{auth,coop,dashboard,loans,members-directory,notice-board,profile,savings,shared}/
    layouts/                 auth / centered / dashboard shells
    theme/                   next-themes provider + toggle
    ui/                      shadcn primitives (Base UI-based)
  config/                    role → nav item mapping
  hooks/                     one hook per mutation, small UI-timing hooks, cross-tab sync
  lib/                       mock data, validation schemas, small utilities
  services/                  auth/profile/etc. — the seam a real backend plugs into
  store/                     Zustand stores (auth session, password-reset session,
                              savings, loans, co-operatives, notice board, settings)
  types/                     shared domain types
```

## Status Checklist

- [x] Login (3 hardcoded roles, demo-account picker)
- [x] Forgot password → OTP → new password
- [x] Dashboard (super admin / admin / member views — figures are static, not real)
- [x] My Profile (real Cloudinary photo upload, real bank verification)
- [x] Savings & Contributions (member + admin + **super admin oversight, now built**)
- [x] Loans (member + admin; super-admin top-level view still pending — per-co-op view already covers it)
- [x] Co-operatives (super admin: list, add, full drill-down)
- [x] Members Directory (admin: list, add w/ bank verification, bulk import, export, edit, disable/activate)
- [x] Notice Board (all roles, real cross-tab real-time)
- [x] Real Paystack Transfers, bank verification, live bank list, live Country/State/City
- [x] Subscriptions (super admin: all co-ops' standing, revenue, manual payment upload, per-co-op history)
- [x] Settings (super admin: profile/password, fees & collections account, dual Paystack/Flutterwave toggles, staff users/roles with full edit/disable/remove actions, real app-wide audit log with live IP-resolved location. admin: profile + personal bank, savings/loan type catalog CRUD, co-op profile + bank account, shared staff management)
- [x] Light/dark theme
- [ ] Real backend integration (everything in `src/services/*.service.ts` is mocked)
- [ ] Server-side Paystack transaction verification for Inline checkout (client callback trusted for now)
- [ ] Admin approval path for the member's own simple "Take a Loan" flow (stays "Awaiting Approval" forever — separate from the co-op guarantor pipeline)
- [ ] OTP confirmation UI for Paystack Transfers (not exercised in test mode)
- [ ] Dashboard's real numbers (currently 100% static)
- [ ] Settings for the member role (still not built — the nav label has no `href` for member)

## Known Gotchas

- **Base UI, not Radix** — `Menu.Item` takes `onClick`, not Radix's
  `onSelect` (the latter silently type-checks but never fires).
- **Font loader variable must be exactly `--font-sans`** for the Tailwind
  theme handoff to resolve.
- `zod` pinned to `4.0.0` — `@hookform/resolvers@5.4.0` doesn't
  structurally match newer `zod@4.4.x` internals yet (runtime unaffected).
- **`Calendar`'s focus prop is `autoFocus`, not `initialFocus`** —
  `react-day-picker` v10 renamed it; the old name is silently dropped,
  not a type error.

## Setup (env vars, all in `.env.local`, gitignored)

```
NEXT_PUBLIC_USE_MOCK_AUTH=true                 # required — without it, auth 404s
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_...     # savings deposit checkout
PAYSTACK_SECRET_KEY=sk_test_...                 # bank verification + real payouts
CLOUDINARY_CLOUD_NAME=...
CLOUDINARY_API_KEY=...
CLOUDINARY_API_SECRET=...
```

## Full Per-Feature Docs (deeper detail than this file)

- [login-page.md](./login-page.md)
- [password-recovery.md](./password-recovery.md)
- [dashboard.md](./dashboard.md)
- [profile-page.md](./profile-page.md)
- [savings-page.md](./savings-page.md)
- [loans-page.md](./loans-page.md)
- [co-operatives-page.md](./co-operatives-page.md)
- [members-directory-page.md](./members-directory-page.md)
- [notice-board-page.md](./notice-board-page.md)
- [subscriptions-page.md](./subscriptions-page.md)
- [settings-page.md](./settings-page.md)
- [admin-settings-page.md](./admin-settings-page.md)
- [payments-and-payouts.md](./payments-and-payouts.md)
- [theming-and-motion.md](./theming-and-motion.md)
- [api-contracts.md](./api-contracts.md) — what a real backend needs to build
