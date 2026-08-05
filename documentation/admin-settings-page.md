# Settings (Admin)

## Overview

`/settings` now branches by role: `super_admin` still gets the five tabs
documented in [settings-page.md](./settings-page.md); `admin` gets a
different five — Profile, Savings Settings, Loan Settings, Co-operative
Settings, User Management — reflecting that an admin manages one
co-operative's day-to-day configuration, not the whole platform. Same
route, same shell, same auth guard; the branch lives entirely inside
`src/app/(dashboard)/settings/page.tsx`.

## Purpose

Give an admin one place to manage their own account (profile + personal
bank account), the co-operative's savings and loan product catalog
(create/edit/enable/disable savings types and loan types), the
co-operative's own profile and bank account, and the same platform-staff
user/role management super admin has.

## Design Decisions

- **Reuse over rebuild, wherever the design is genuinely the same
  thing.** `AdminSettingsProfileTab`'s "User" sub-tab renders the exact
  same `SettingsProfileTab` component super admin uses (it's already
  generic over `member: AuthenticatedMember`) — same avatar upload, same
  inline optional password change, same live country dropdown. The
  "User Management" tab is the literal same `SettingsUserManagementTab`
  component, unmodified — admin and super admin currently share one
  platform-staff list (`useSettingsStore`), which is honest given this
  app has no per-co-op staff scoping mechanism yet; building one would
  be a real architecture change out of scope for a settings screen.
- **Two "Bank Accounts" screens, two different real data sources, same
  UI pattern.** Profile → Bank Accounts is the _admin's own personal_
  payout account — it reads/writes the same `ProfileRecord.bankCode/
accountNumber/accountName` fields `/profile` already manages
  (`admin-bank-account-form.tsx`), so there's exactly one source of
  truth for "this person's bank details," not two drifting copies.
  Co-operative Settings → Bank Accounts is the _co-operative's own_
  collections account — new state in `useAdminSettingsStore`
  (`coop-bank-account-form.tsx`). Both reuse the real Paystack
  bank-list + "Verify" flow (`useBankList`, `resolveBankAccount`) used
  everywhere else in the app that captures a bank account — no new
  verification mechanism invented. The two forms are near-identical by
  design (same fields, same flow) rather than sharing one generic
  component, to avoid touching the already-shipped, already-verified
  `CollectionAccountForm` super admin uses.
- **Savings/Loan Settings are seeded from the real, existing catalogs
  and are honestly illustrative, not yet wired back into them.**
  `INITIAL_SAVINGS_TYPE_SETTINGS`/`INITIAL_LOAN_TYPE_SETTINGS`
  (`src/lib/admin-settings-data.ts`) are generated directly from the
  app-wide `SAVINGS_TYPES`/`LOAN_TYPES` constants so this screen starts
  showing the same three savings types and three loan types a member
  sees when saving or applying for a loan. Editing a type here (name,
  min/max, eligibility, interest, approvers, status) updates a separate
  `useAdminSettingsStore` slice — it does **not** currently change what
  `SAVINGS_TYPES`/`LOAN_TYPES` return elsewhere in the app. This is the
  same pattern already established for the super admin's Fees &
  Charges: a real, working settings UI, honestly not yet the source of
  truth for the live calculations that use the original constants.
  Making the whole app read from a store instead of static constants
  would be a legitimate, larger follow-up — not attempted here to avoid
  a wide, risky rewire for a single settings page.
- **New Loan Type is a full page, not a modal** — the mockup's form has
  far more fields (name, eligibility, duration, repayment interval,
  auto-calculated installment count, interest type/amount, two
  approvers, loan terms, a separate Guarantor Requirements section)
  than a modal comfortably holds, and the reference itself shows it as
  a dedicated screen. `src/app/(dashboard)/settings/loans/new/page.tsx`
  handles both create and edit (`?id=` query param, matching the
  `?tab=`/`?id=` deep-linking convention already used elsewhere, e.g.
  `co-operatives/[id]?tab=savings`) rather than a separate edit route.
  "No of installments" is a real computed value
  (`computeInstallments(durationMonths, repaymentInterval)`), not a
  placeholder — Weekly ≈ 4×duration, Monthly = duration, Quarterly =
  duration/3.
- **Approval Group / Approver 1 / Approver 2 pull from real co-op
  members**, not a fabricated list — `getDirectoryMembers(cooperatives)`
  (the same function `/members` already uses to scope to the admin's
  one co-operative) feeds both the savings-type modal's multi-select
  (reusing the `DropdownMenuCheckboxItem` pattern from the super admin's
  role-permissions picker) and the loan-type page's two approver
  `Select`s.
- **Status toggle reuses `ConfirmToggleDialog` and the Edit/Toggle
  pattern from `coop-members-table.tsx`** — same "Disable"/"Activate"
  wording, same confirm-dialog behavior — for a savings type, loan type
  (table row, plus row-click opens the same full-page editor used for
  create), and co-operative bank account, rather than three different
  ad hoc toggle implementations.

## Components

- `src/app/(dashboard)/settings/page.tsx` — role branch (super_admin vs
  admin tab sets).
- `src/app/(dashboard)/settings/loans/new/page.tsx` — full-page Loan
  Type Creation/Edit form.
- `src/components/features/admin-settings/admin-settings-profile-tab.tsx`,
  `admin-bank-account-form.tsx` — Profile tab (User sub-tab reuses
  `SettingsProfileTab`; Bank Accounts is new).
- `src/components/features/admin-settings/admin-savings-settings-tab.tsx`,
  `savings-type-settings-table.tsx`, `savings-type-modal.tsx` — Savings
  Settings tab (table + create/edit modal).
- `src/components/features/admin-settings/admin-loan-settings-tab.tsx`,
  `loan-type-settings-table.tsx` — Loan Settings tab (table; "New"/row
  click routes to the full-page form).
- `src/components/features/admin-settings/admin-cooperative-settings-tab.tsx`,
  `cooperative-details-form.tsx`, `coop-bank-account-form.tsx` —
  Co-operative Settings tab (Co-operative + Bank Accounts sub-tabs).
- `src/lib/admin-settings-data.ts`, `src/lib/validations/
admin-settings.schema.ts` — types, seed data, zod schemas.
- `src/store/admin-settings.store.ts` — cooperative settings, co-op bank
  account, savings/loan type settings; every mutation logs to the audit
  trail (module `Settings`).
- Reused unmodified: `src/components/features/settings/
settings-profile-tab.tsx`, `settings-user-management-tab.tsx`,
  `src/components/features/coop/confirm-toggle-dialog.tsx`,
  `src/hooks/use-bank-list.ts`, `src/lib/bank-lookup.ts`,
  `src/lib/member-directory.ts`.

## Future Improvements

- Savings/Loan type edits here don't flow back into the app-wide
  `SAVINGS_TYPES`/`LOAN_TYPES` constants — a real backend would make
  these the actual source of truth instead of a parallel settings view.
- Platform staff (User Management) is shared between super admin and
  admin — no per-co-operative scoping exists yet.
- The co-operative's own bank account and the `Cooperative` object
  itself (name/address/contact fields shown on `/co-operatives/[id]`)
  aren't connected — Co-operative Settings writes to its own
  `useAdminSettingsStore` slice rather than updating the actual
  `Cooperative` record the super admin's oversight pages read.
