# Savings & Contributions

## Overview

`/savings` (plus its detail route `/savings/[id]`) is the third real page
in the `(dashboard)` route group, alongside `/dashboard` and `/profile` —
see [dashboard.md](./dashboard.md) and
[profile-page.md](./profile-page.md). Unlike those two, this page's shape
genuinely differs by role rather than just its data: members see their own
savings, admins see both an org-wide view and their own, super admins see
only the org-wide view.

## Purpose

Let a member actually add money to a savings type and pay for it through a
real payment gateway — not a fake "success" button — while giving
admin/super-admin roles the oversight view the reference designs showed.
Every screen in the reference set is covered: the summary + record table,
the "Add to Savings" modal, the Paystack checkout, the success
confirmation, and the individual savings record detail page.

## Design Decisions

- **Real Paystack, not a simulated payment UI.** The reference screenshots
  of the card-entry screen ("PAY WITH: Card/Bank/Transfer/…", card number/
  expiry/CVV) are literally Paystack's own Inline checkout popup — so
  rather than rebuild that UI, `src/lib/paystack.ts` loads Paystack's
  `inline.js` and calls `PaystackPop.setup(...).openIframe()` directly.
  Paystack renders and owns that entire screen; the app only needs to
  trigger it and react to its `callback`/`onClose`. This only needs a
  **public** key (`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY` in `.env.local`) — safe
  to expose client-side by design, which is exactly why Paystack Inline
  works without a backend. If the key isn't set, "Proceed" fails with a
  clear toast telling you what env var to add, instead of silently doing
  nothing or pretending to succeed.
- **No backend means no server-side payment verification.** A real
  production integration would verify the transaction reference against
  Paystack's API from a server before crediting the account. There is no
  server here — the same honest limitation as every other mock service in
  this app — so Paystack's client-side `callback` firing is treated as
  success. This is called out explicitly rather than glossed over: see
  [Future Improvements](#future-improvements).
- **One reusable per-member view, not two.** The reference showed the
  admin's "My Savings" tab as visually identical to the member's whole
  page. Rather than duplicate that UI, `<MemberSavingsView>` takes a
  `memberId`/`memberName`/`memberEmail` and is used both for the member
  role's entire page _and_ as the admin's "My Savings" tab content — same
  component, different props.
- **Aggregate admin view, not a per-transaction list.** The reference's
  "Members Savings" tab showed one row per savings _type_ with an org-wide
  total, not a giant list of every member's individual transactions (that
  already exists per-member on their own page). `<MembersSavingsOverview>`
  reflects that: it sums `records` by `savingsType` across everyone.
- **New `Dialog`, `Tabs`, `Select`, `Popover`, and `Calendar` primitives
  were added** (`src/components/ui/dialog.tsx`, `tabs.tsx`, `select.tsx`,
  `popover.tsx`, `calendar.tsx`) via `pnpm dlx shadcn@latest add`, not
  hand-authored — the CLI generates them against this project's
  `base-nova`/`@base-ui/react` style (`components.json`) so they match the
  rest of `src/components/ui/` (same `data-open`/`data-closed` animation
  classes as `dropdown-menu.tsx`) automatically. None of these are
  one-off code local to this feature — every future screen that needs a
  modal, tabs, a select, or a date picker reuses these instead of
  inventing another. `Calendar` pulls in `react-day-picker`; its focus
  prop is `autoFocus`, not the `initialFocus` name older shadcn examples
  use — the older name is silently dropped as an unrecognized prop rather
  than a type error, worth knowing before copying old snippets.
- **Savings records live in a Zustand store, not a plain module array.**
  Every other mock mutation in this app (password reset, profile edits)
  uses a plain mutable module-level object, which is enough because
  nothing needs to _reactively_ re-render when it changes elsewhere.
  Adding a savings record is different: paying through Paystack needs the
  summary card total and the table to update live, in place, without a
  navigation — that needs real reactive state, so
  `src/store/savings.store.ts` exists specifically for that. It is _not_
  persisted (resets on reload), consistent with the rest of the app's mock
  data lifetime.
- **Filters are real, not decorative.** Search, status, and date-range in
  `<SavingsRecordsTable>` actually filter the client-side array; pagination
  actually slices it. Status (here and in the "Add to Savings" modal's
  Savings Type field) and page-size use the shadcn `Select`; the date
  range uses a `Popover` + `Calendar` (`mode="range"`, two-month view)
  instead of the two plain native `<input type="date">` fields this
  screen originally shipped with — every interactive control on this page
  is now a shadcn primitive rather than a native form element, matching
  the standing rule that the whole app should read as one designed
  system, not a mix of styled and browser-default controls.
- **Export is real, and Import requires the approved template first.**
  "Export / Import" (per-member table and the admin aggregate view) is a
  `<ExportImportMenu>` dropdown (`src/components/features/savings/export-import-menu.tsx`)
  that generates real files client-side via `xlsx` (CSV/Excel) and
  `jspdf`/`jspdf-autotable` (PDF) — see `src/lib/table-export.ts`. Import
  is deliberately template-gated: "Import from template" stays disabled
  (with a session-scoped `sessionStorage` flag, not a hard block that
  would annoy repeat use) until "Download import template" has been
  clicked at least once, so a member can't upload an arbitrary file and
  guess at the expected shape. `src/lib/savings-import.ts` generates that
  template (an `.xlsx` with a `Template` sheet + a `Valid Savings Types`
  reference sheet) and parses/validates whatever gets re-uploaded — unknown
  Savings Type names, out-of-range amounts, and unparseable dates are
  rejected per-row (not the whole file) with a toast summarizing how many
  rows imported vs. were skipped and why. Imported records are tagged
  `method: "Manual Upload"` (the value already existed on
  `SavingsRecord.method`, unused until now) so they're visually
  distinguishable from a real Paystack payment on the details page.

## Flow

```
/savings
  member          → <MemberSavingsView> (their own records + "+ New Savings")
  admin           → Tabs: "Members Savings" (org-wide) | "My Savings" (their own)
  super_admin     → <MembersSavingsOverview> only (no personal savings, no tabs)

"+ New Savings" → <AddSavingsModal> (pick type, enter amount within its min/max)
  → "Proceed" → Paystack Inline checkout (real popup)
        → paid → <PaymentSuccessModal>, new record added, table/summary update live
        → popup closed without paying → modal stays open, no record added

Any row in a records table → /savings/[id] → Savings Details page
  (full record: type, amount, method, date, member — linked to /profile —
  balance after, transaction ID, status)
```

## Components

- `src/app/(dashboard)/savings/page.tsx` — role switch described above.
- `src/app/(dashboard)/savings/[id]/page.tsx` — the details page.
- `src/components/features/savings/member-savings-view.tsx` — summary
  card, table, "+ New Savings"/"Export/Import" actions, modal
  orchestration (this is where the Paystack call actually happens).
- `src/components/features/savings/members-savings-overview.tsx` — the
  admin/super-admin aggregate-by-type view.
- `src/components/features/savings/savings-records-table.tsx` — search,
  status filter, date range, pagination, clickable rows.
- `src/components/features/savings/add-savings-modal.tsx` /
  `payment-success-modal.tsx` — the two dialogs.
- `src/components/features/savings/export-import-menu.tsx` — the
  Export/Import dropdown, reused by both the per-member table and the
  admin aggregate view (generic over row shape via `ExportColumn<T>`).
- `src/lib/paystack.ts` — the Paystack Inline wrapper.
- `src/lib/savings-data.ts` — savings type definitions (name + min/max),
  the `findSavingsTypeRange` lookup shared by the table and export
  columns, and seed records.
- `src/lib/table-export.ts` — generic CSV/Excel/PDF export (`xlsx`,
  `jspdf` + `jspdf-autotable`).
- `src/lib/savings-import.ts` — import template generation + parsing/
  validation for `<ExportImportMenu>`'s Import flow.
- `src/store/savings.store.ts` — the reactive record store.
- `src/components/ui/dialog.tsx`, `tabs.tsx`, `select.tsx`, `popover.tsx`,
  `calendar.tsx` — new shared primitives (see Design Decisions).

## Setup: Paystack

Add to `.env.local` (gitignored, same as the mock-auth flag):

```
NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY=pk_test_xxxxxxxxxxxxxxxxxxxxxxxx
```

Use a **test-mode** public key. Never put a secret key
(`sk_...`) in a `NEXT_PUBLIC_*` variable — it would ship to every
browser that loads the app. Without this variable set, "Proceed" in the
Add to Savings modal fails gracefully with a toast explaining what's
missing, rather than a silent no-op or a fake success.

## Animations

Follows the same "lighter touch on data-dense screens" rule established in
[dashboard.md](./dashboard.md#animations) and
[profile-page.md](./profile-page.md#animations) — no per-field stagger on
the table or forms. The two dialogs use the shared `Dialog` primitive's
scale+fade open/close (matching `dropdown-menu.tsx`'s existing animation
language), and the tabs indicator slides between "Members Savings" and "My
Savings" via Base UI's `Tabs.Indicator`.

## Future Improvements

- **Server-side Paystack verification.** The single biggest gap: a real
  integration verifies the transaction reference against Paystack's
  `/transaction/verify/:reference` endpoint from a trusted server before
  crediting anything. That requires a backend and the secret key, neither
  of which exist yet — flagged here rather than silently shipped as if it
  were production-ready.
- Import only adds new records — there's no bulk edit/delete of existing
  ones, and a large file (hundreds of rows) would add that many individual
  Zustand store updates in a synchronous loop rather than a single batched
  update, since nothing has needed that scale yet.
