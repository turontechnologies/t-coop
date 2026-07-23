# Savings & Contributions

## Overview

`/savings` (plus its detail route `/savings/[id]`) is the third real page
in the `(dashboard)` route group, alongside `/dashboard` and `/profile` —
see [dashboard.md](./dashboard.md) and
[profile-page.md](./profile-page.md).

**Member and admin are both built; super_admin is still inert.** The
member experience described in most of this document is unchanged. The
admin role now has its own real "Savings & Contributions" page — see
[Admin view](#admin-view) below — built against a corrected reference
design. Super admin's "Savings & Contributions" nav item still has no
`href` and shows the standard "coming soon" toast; super admin already has
an equivalent oversight view per co-operative under
`/co-operatives/[id]/savings/...` (see
[co-operatives-page.md](./co-operatives-page.md)), so a dedicated
super-admin `/savings` view hasn't been requested.

## Purpose

Let a member actually add money to a savings type and pay for it through a
real payment gateway — not a fake "success" button. Every member-facing
screen in the original reference set is covered: the summary + record
table, the "Add to Savings" modal, the Paystack checkout, the success
confirmation, and the individual savings record detail page.

## Admin view

An admin manages savings for their whole co-operative from the same
`/savings` route (branched by role in `page.tsx`): a page-level Quick
Summary (Total Savings across every member + the admin's own personal My
Savings total) above three tabs — **Members Savings**, **My Savings**, and
**Request** — with a single "+ New Savings" button whose behavior depends
on which tab is active (see [Design Decisions](#design-decisions)).

This replaces an earlier, unwired admin/super-admin oversight view
(`<MembersSavingsOverview>` + a tab switcher) that didn't match the
correct reference design and was removed pending one. `<MembersSavingsOverview>`
itself is still present in
`src/components/features/savings/members-savings-overview.tsx` but is no
longer imported by anything — `AdminSavingsView` was built fresh instead,
reusing the co-operative oversight components (`CoopSavingsSummaryTable`,
`CoopSavingsTypeRecordsTable`) rather than that old component. It can be
deleted in a future cleanup once nobody's relying on it as reference.

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
- **`<MemberSavingsView>` takes `memberId`/`memberName`/`memberEmail` as
  props rather than reading the signed-in member directly**, kept
  prop-driven specifically so the admin's "My Savings" tab could reuse it
  wholesale for the admin's own personal record — which is exactly what
  happened. It also gained two more optional props for that reuse:
  `showSummary` (hides its own "Quick Summary" heading/card/"+ New
  Savings" button when the parent page already renders an equivalent, as
  `AdminSavingsView` does) and `addOpen`/`onAddOpenChange` (lets a parent
  drive the Add Savings modal from an external button instead of the
  component's own internal one). Both default to the component's original
  fully-self-contained behavior, so the member's own `/savings` page needs
  no changes at all.
- **The admin's "+ New Savings" button does one of two different things,
  depending on which tab is active** — and that's deliberate, not an
  inconsistency. On **My Savings** it opens the exact same
  `<AddSavingsModal>` → Paystack flow a member gets, because it's
  crediting the admin's _own_ account and only the admin's own card can
  pay for that. On **Members Savings** it opens `<UploadTellerModal>`
  instead, because an admin recording a deposit _on behalf of_ another
  member obviously can't run that member's card through Paystack — the
  real-world equivalent is a bank teller slip, which is what that modal
  captures. One button, whose behavior tracks the active tab, models the
  actual constraint better than either a second unrequested button or
  reusing the Paystack modal somewhere it can't honestly apply.
- **Upload Teller records a real, downloadable receipt — not just a
  filename.** Reusing the exact same `readFileAsDataUrl`/
  `MAX_ATTACHMENT_BYTES` pieces already built for Notice Board attachments
  (see [notice-board-page.md](./notice-board-page.md#design-decisions)),
  the optional receipt image is read into a base64 data URL and stored as
  `CoopSavingsRecord.receiptUrl`. Both savings-record-detail pages (the
  new admin one and the existing super-admin
  `/co-operatives/[id]/savings/record/[recordId]`) show a real "Download
  receipt" link whenever it's present — a small, genuinely useful
  extension beyond what the reference screenshot showed, since "upload a
  teller" only means something if the proof stays retrievable afterward.
- **Withdrawal requests and approvals are modeled as signed amounts, not
  a parallel data shape.** Rather than invent a separate "withdrawal
  record" type, an approved withdrawal creates an ordinary
  `CoopSavingsRecord` with a **negative** `amount` for the same
  `savingsType`. `coopSavingsBySummaryType`'s per-type total is a plain
  sum, so a withdrawal nets out of "Total Savings & Contributions" with no
  special-casing anywhere it's displayed or exported — one honest
  representation, not two code paths that could drift apart.
- **Members can now submit a real withdrawal request — the gap flagged
  in this doc's previous revision is closed.** A "Withdraw" button next
  to "+ New Savings" (disabled when the balance is 0) opens
  `<RequestWithdrawalModal>`: pick a Savings Type (shows that type's
  current balance), enter an amount validated against it, an optional
  note, submit. This uses the legacy personal `useSavingsStore` — the
  same store `/savings` itself already uses — not the co-op model, since
  the member role's own records live there (see the next bullet for how
  this reconciles with the admin's coop-scoped Request tab).
- **`useSavingsStore` gained its own `requests`/`addRequest`/
  `resolveRequest`, reusing the exact same `SavingsRequest` type
  `coop-data.ts` already defined for coop-scoped requests** — the shape
  needed no coop-specific fields, so duplicating it for the personal
  model would have been two types drifting apart for no reason.
  `AdminSavingsView`'s Request tab now shows **both** sources merged
  into one list (`[...coop.savingsRequests, ...personalRequests]`,
  sorted newest-first) with one shared table and one resolve handler
  that checks which store a given request came from before routing the
  approve/decline call — this is also the only in-app way to test the
  full request flow against the app's one real "member" login (the
  admin's own coop members have no login of their own, see
  [loans-page.md](./loans-page.md#design-decisions) for the same
  guarantor-identity boundary).
- **Approving a withdrawal now moves real money — the request first,
  the record only if it worked.** Both the coop and personal paths
  attempt an actual Paystack Transfer to the member's verified bank
  account before creating any record or changing any status; a failure
  (missing bank details, or Paystack's real-bank-resolve quota) shows a
  clear error and leaves the request `Pending` rather than silently
  faking success. Full design reasoning, the bank-detail plumbing, and
  the quota constraint discovered while building this all live in
  [payments-and-payouts.md](./payments-and-payouts.md) — deliberately
  not repeated here since Loans' disbursement approval uses the exact
  same mechanism.
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
  "Export / Import" is a `<ExportImportMenu>` dropdown
  (`src/components/features/shared/export-import-menu.tsx` — genericized
  and moved out of this feature's folder once the Members Directory
  needed a real import flow too; see
  [members-directory-page.md](./members-directory-page.md#design-decisions))
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
  member      → <MemberSavingsView> (their own records + "+ New Savings")
  admin       → <AdminSavingsView> (Quick Summary + Members Savings/My Savings/Request tabs)
  super_admin → null (nav item inert)

Member "+ New Savings" → <AddSavingsModal> (pick type, enter amount within its min/max)
  → "Proceed" → Paystack Inline checkout (real popup)
        → paid → <PaymentSuccessModal>, new record added, table/summary update live
        → popup closed without paying → modal stays open, no record added

Member "Withdraw" → <RequestWithdrawalModal> (pick type, amount within balance)
  → "Submit Request" → real SavingsRequest added (status: Pending) — awaits
     admin approval on their Requests tab (see Admin-only, below)

Any row in a records table → /savings/[id] → Savings Details page
  (full record: type, amount, method, date, member — linked to /profile —
  balance after, transaction ID, status)

--- Admin-only ---

Members Savings tab → <CoopSavingsSummaryTable> (Basic/Advanced/Premium totals)
  → click a type row → /savings/type/[type] → per-type records for every member
      → click a record → /savings/record/[recordId] → Savings Details
        (same fields as above, plus "Download receipt" when one was uploaded)

My Savings tab → <MemberSavingsView showSummary={false}> for the admin's own
  record — identical Paystack flow as a member, driven by the page-level
  "+ New Savings" button

Members Savings tab + "+ New Savings" → <UploadTellerModal>
  (Member select, Savings Amount, Savings Type, optional receipt upload)
  → "Upload" → real CoopSavingsRecord added (method: "Manual Upload"),
     balance computed from that member's prior records for the type

Request tab → <SavingsRequestsTable> (coop-seeded requests + every real
  member-submitted personal withdrawal request, merged into one list)
  → "Approve" (Deposit) → confirm → creates a real record, positive amount
  → "Approve" (Withdrawal) → confirm → real Paystack Transfer to the
       member's verified bank account attempted first; only on success
       does a negative-amount record get created and the request resolve
       (failure → error toast, request stays Pending — see
       payments-and-payouts.md)
  → "Decline" → confirm → request marked Declined, no record created
```

## Components

- `src/app/(dashboard)/savings/page.tsx` — role branch: member/admin/
  super_admin, described above.
- `src/app/(dashboard)/savings/[id]/page.tsx` — the member's own record
  details page.
- `src/app/(dashboard)/savings/type/[type]/page.tsx` — admin-only:
  per-type records across the co-operative.
- `src/app/(dashboard)/savings/record/[recordId]/page.tsx` — admin-only:
  single-record details, mirrors the super-admin co-op equivalent.
- `src/components/features/savings/member-savings-view.tsx` — summary
  card, table, "+ New Savings"/"Export/Import" actions, modal
  orchestration (this is where the Paystack call actually happens); see
  the `showSummary`/`addOpen`/`onAddOpenChange` props added for admin
  reuse.
- `src/components/features/savings/admin-savings-view.tsx` — the admin
  orchestrator: Quick Summary cards, the three tabs, and the
  tab-dependent "+ New Savings" button.
- `src/components/features/savings/upload-teller-modal.tsx` — Member/
  Amount/Savings Type/optional receipt upload, for admin-recorded manual
  deposits.
- `src/components/features/savings/savings-requests-table.tsx` — the
  Request tab's table, with `AlertDialog`-confirmed Approve/Decline.
- `src/components/features/savings/request-withdrawal-modal.tsx` — the
  member-facing withdrawal request form (Savings Type with live balance,
  amount, optional note).
- `src/components/features/savings/members-savings-overview.tsx` — an
  earlier, unwired admin aggregate view; no longer imported anywhere (see
  [Admin view](#admin-view)) — candidate for deletion in a future cleanup.
- `src/components/features/savings/savings-records-table.tsx` — search,
  status filter, date range, pagination, clickable rows.
- `src/components/features/savings/add-savings-modal.tsx` /
  `payment-success-modal.tsx` — the two dialogs.
- `src/components/features/coop/coop-savings-summary-table.tsx` /
  `coop-savings-type-records-table.tsx` — the by-type aggregate and
  per-type records table, shared between the super-admin co-op oversight
  view and the admin's Members Savings tab via an optional `basePath`
  prop that points each at its own route tree.
- `src/components/features/shared/export-import-menu.tsx` — the
  Export/Import dropdown (generic over row shape via `ExportColumn<T>`
  and, separately, over the imported row shape via `ImportConfig<TImportRow>`).
- `src/lib/paystack.ts` — the Paystack Inline wrapper.
- `src/lib/savings-data.ts` — savings type definitions (name + min/max),
  the `findSavingsTypeRange` lookup shared by the table and export
  columns, and seed records for the member/admin's own personal savings.
- `src/lib/coop-data.ts` — `CoopSavingsRecord.receiptUrl`, the
  `SavingsRequest` type, seed `savingsRequests` per co-operative, and
  `coopMemberSavingsBalance` (a member's running balance for one savings
  type, used to compute `balanceAfter` for both Upload Teller and
  request approval).
- `src/lib/file-to-data-url.ts` — reused as-is from Notice Board for the
  receipt upload (`readFileAsDataUrl`, `MAX_ATTACHMENT_BYTES`).
- `src/lib/table-export.ts` — generic CSV/Excel/PDF export (`xlsx`,
  `jspdf` + `jspdf-autotable`).
- `src/lib/savings-import.ts` — import template generation + parsing/
  validation for `<ExportImportMenu>`'s Import flow.
- `src/store/savings.store.ts` — the reactive record store for the
  member/admin's own personal savings, now also holding `requests` +
  `addRequest`/`resolveRequest` for personal withdrawal requests.
- `src/store/coop.store.ts` — `addSavingsRecord` (Upload Teller) and
  `resolveSavingsRequest` (Approve/Decline) mutators.
- `src/lib/paystack-transfer.ts` — `initiateTransfer`, called by both
  request-resolution paths on Approve; see
  [payments-and-payouts.md](./payments-and-payouts.md).
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

Approving a withdrawal request needs the separate `PAYSTACK_SECRET_KEY`
(server-only) — see
[payments-and-payouts.md](./payments-and-payouts.md#setup) for that
setup and why it's a genuinely different Paystack capability than the
public key above.

## Animations

Follows the same "lighter touch on data-dense screens" rule established in
[dashboard.md](./dashboard.md#animations) and
[profile-page.md](./profile-page.md#animations) — no per-field stagger on
the table or forms. The two dialogs use the shared `Dialog` primitive's
scale+fade open/close (matching `dropdown-menu.tsx`'s existing animation
language).

## Future Improvements

- **No member-facing "submit a deposit request" UI yet** — only
  withdrawal requests are member-submittable today (see Design
  Decisions); a deposit-request equivalent would follow the same
  pattern if ever needed, though a deposit is arguably better served by
  just using "+ New Savings" directly.
- **A dedicated super-admin `/savings` view**, if ever requested — today
  super admin's oversight equivalent lives per-co-operative under
  `/co-operatives/[id]/savings/...` (see
  [co-operatives-page.md](./co-operatives-page.md)) rather than at a
  cross-co-op `/savings` route.
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
