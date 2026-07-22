# Co-operatives

## Overview

`/co-operatives` and its sub-routes are a super-admin-only oversight area
inside the `(dashboard)` route group, sharing its auth guard, shell, and
loading gate with every other dashboard page. This is where "Register
Co-operative" moved to — see [Why this replaced `/register`](#why-this-replaced-register)
below — plus a full drill-down hierarchy for inspecting any co-operative's
members, savings, and loans, mirroring the [Savings & Contributions](./savings-page.md)
and [Loans](./loans-page.md) modules but scoped per co-operative instead of
"the signed-in member."

## Purpose

Give a super admin one place to: see every co-operative on the platform at
a glance, add a new one, drill into any single co-op's members/savings/loans,
open an individual member's own record, and open an individual savings or
loan transaction's full detail — reusing the same visual language already
established for the member-facing Savings and Loans pages rather than
inventing a parallel design system for the admin side.

## Why this replaced `/register`

Registering a new co-operative used to be a public, unauthenticated
`/register` route sharing `/login`'s split-screen shell (see the old
"login / register side swap" mechanic, now removed — see
[theming-and-motion.md](./theming-and-motion.md)). That framing didn't
match how the rest of the app treats co-operatives: everywhere else, a
co-operative is something a super admin manages, not something the public
signs itself up for. Moved to `/co-operatives/new` — an "Add New
Co-operative" button on the co-operatives list, dashboard-shell styled
like every other admin form (Card-sectioned, not the branded auth split
panel) — and:

- `AuthModeSwitch` (the segmented Login/Register control) was deleted
  entirely, along with `/register`'s page, form, and the `reversed`/
  `formClassName` plumbing in `AuthLayout` — nothing else needs it now that
  there's only one route in that shell.
- `registerCooperativeSchema`, `authService.registerCooperative`, and
  `RegisterCooperativeRequest`/`Response` were removed from the auth stack;
  the new flow uses its own `addCooperativeSchema`
  (`src/lib/validations/coop.schema.ts`) and writes straight to
  `useCoopStore`, matching how Savings/Loans mutate their own stores rather
  than going through `authService`.
- Two dangling "New to T-Coop? Register/Create Account" links on the
  forgot-password and create-new-password screens were removed — they
  pointed at a route that no longer exists.
- **The submission behavior changed on purpose, not just the location.**
  The old `/register` ended with "registration received" messaging and no
  usable login — a deliberate simulation of a review queue for a
  self-service public signup. That framing doesn't fit a super admin
  creating a co-op directly: there's no queue to review since the admin
  _is_ the authority creating it. `/co-operatives/new` instead adds the
  co-operative immediately (after a duplicate-ID check) and redirects
  straight to its new detail page with a success toast.

## Design Decisions

- **Self-contained mock dataset, not bolted onto the existing single-org
  data.** The app's existing member/savings/loan data (`mock-users.ts`,
  `savings-data.ts`, `loans-data.ts`) models one implicit co-operative — the
  one the three demo accounts belong to. Rather than retrofit multi-tenancy
  onto that, `src/lib/coop-data.ts` defines its own `Cooperative` type with
  its own nested `members`/`savings`/`loans`, seeded with three co-operatives
  independent of the demo accounts. This keeps the existing Savings/Loans
  pages' behavior for MB-0001/AD-0001/SA-0001 completely unchanged while
  giving the admin oversight pages real, structurally-consistent data to
  browse.
- **Loan eligibility is per-type, not a flat multiplier — a genuine
  improvement carried back into `/loans`.** The co-operative's Loans tab
  needed a real "Eligibility %" column per loan product. Rather than invent
  a separate number just for this table, `LoanTypeDef` (`src/lib/loans-data.ts`)
  gained an `eligibilityPercent` field (Emergency 300%, Education 200%,
  Business 100% — smaller/shorter loans get a more lenient multiplier),
  and `computeEligibleAmount` now uses it instead of a flat ×2 for every
  loan type. The member-facing "Take a Loan" modal on `/loans` picked up
  this improvement automatically since it calls the same function.
- **`CoopLoanRecord` deliberately mirrors `LoanRecord`'s exact shape.** Same
  fields, same status union (`"Active" | "Awaiting Approval" | "Completed" |
"Rejected"`). This isn't a coincidence — it means `generateRepaymentSchedule`
  and `generateLoanTransactions` (`src/lib/loans-data.ts`) work unmodified on
  co-op loan records, so the loan record detail page
  (`/co-operatives/[id]/loans/record/[recordId]`) reuses the exact same
  schedule/transaction generation the member-facing `/loans/[id]` page uses,
  instead of a second parallel implementation.
- **The drill-down hierarchy matches the reference flow exactly:** co-op
  list → co-op detail (Members / Savings / Loans tabs) → either a member's
  own detail page (Savings / Loans tabs) or a savings/loan **type**
  drill-down (all transactions of that one product across the co-op) →
  an individual record's detail page. Both drill-down paths — from a
  member's own tab, or from a type's transaction list — land on the _same_
  record detail route, so there's one canonical "Savings Details" /
  "Loan Details" page regardless of how an admin navigated there.
- **No stock photo banner on the member detail page**, even though the
  reference mockup had one. Same reasoning already established for
  `/profile` (see [profile-page.md](./profile-page.md#design-decisions)) —
  a decorative landscape photo is template weight with no information
  value. The member header card reuses the same avatar-initials + name +
  role-badge pattern as `/profile`'s header card instead.
- **"View Full Profile" on the member detail page is an honest dead end,
  not a broken link.** These co-op members aren't real logged-in accounts —
  they don't correspond to any of the three demo users, so there's no
  actual "full KYC profile" route to send an admin to. Rather than link to
  a 404 or fake one, the button surfaces a "Coming soon" toast, the same
  honesty pattern used for photo upload and the terms/privacy links
  elsewhere in the app.
- **"Earnings on Savings" is an illustrative dividend figure, not a real
  accrual engine.** The reference's co-op Savings tab shows an "Earnings on
  Savings" column that doesn't correspond to anything the rest of the app
  models (savings don't currently pay interest anywhere else in the app).
  `coopSavingsBySummaryType` (`src/lib/coop-data.ts`) computes it as a flat
  2% of each type's total — clearly labeled as a mock simplification here
  rather than left unexplained.
- **Activate/Deactivate requires an explicit confirmation, not an
  instant toggle — via one shared component, not three near-duplicate
  implementations.** Both the co-operative level (`CoopHeaderCard`'s
  "Disable Co-operative" / "Activate Co-operative" button) and the
  individual member level (the power-icon toggle on each row in the
  Members tab) now go through `ConfirmToggleDialog`
  (`src/components/features/coop/confirm-toggle-dialog.tsx`), built on
  the shadcn `AlertDialog` — added via
  `pnpm dlx shadcn@latest add alert-dialog`. It standardizes the copy to
  "Disable {entityLabel}" / "Activate {entityLabel}" with
  `Are you sure you want to disable "{name}"?`, and is reused by a third
  call site too — the Members Directory page's member toggle (see
  [members-directory-page.md](./members-directory-page.md)) — after the
  user asked that this exact confirmation pattern apply everywhere in the
  app, not just wherever it was first built. This isn't a stock "are you
  sure?" wrapper: `AlertDialogAction` in this Base UI port is a plain
  `Button`, not an auto-closing primitive, so `ConfirmToggleDialog`
  controls `open`/`busy` state itself — the dialog stays open with a
  spinner through the (simulated) mutation and only closes on success,
  the same real-busy-state discipline used for every other async action
  in the app (Add to Savings, Take a Loan, etc.). Confirmed in a real
  browser that Cancel leaves the status genuinely unchanged and only the
  confirm action mutates it. Neither toggle is
  wired to a cascading real-world effect (e.g. disabling a co-op doesn't
  currently block its members from anything else in the mock) — a fair
  simplification for a demo but called out here rather than implied.
- **The Members tab's edit (pencil) action opens a real form, not a
  placeholder toast.** `EditMemberModal`
  (`src/components/features/coop/edit-member-modal.tsx`) is a full
  RHF + Zod (`editMemberSchema`) form — First/Last Name, Email, Role
  (shadcn `Select`, Member/Admin), Guarantor, Country, State — pre-filled
  from the member's current data via `defaultValues`, saving through the
  store's `updateMember` action. One modal instance is mounted per
  "currently editing" member (`useState<CoopMember | null>`) rather than
  one static instance reused across rows, so it always opens fresh with
  the clicked row's data instead of needing a `values`-sync workaround.
- **Every table on this page follows the shadcn-everywhere convention**
  established on `/savings` and `/loans`: `Select` for status filters and
  page size, `Popover` + `Calendar` for date ranges, shadcn `Button` for
  pagination — never a native `<select>`/`<input type="date">`/hand-rolled
  button. See [loans-page.md](./loans-page.md) for where that convention
  was first fully established in this app.

## Routes

| Route                                           | Purpose                                                                                                                                     |
| ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| `/co-operatives`                                | List every co-operative — search, pagination, "+ Add New Co-operative."                                                                     |
| `/co-operatives/new`                            | Create a co-operative (the old `/register` flow, moved and re-scoped).                                                                      |
| `/co-operatives/[id]`                           | One co-op's header (contact info, totals, Disable/Activate) + Members/Savings/Loans tabs.                                                   |
| `/co-operatives/[id]/members/[memberId]`        | One member's own header + Savings/Loans record tabs.                                                                                        |
| `/co-operatives/[id]/savings/[type]`            | All transactions of one savings product across the co-op ("Basic Savings," etc.), with the Export/Import menu, filters, and pagination.     |
| `/co-operatives/[id]/savings/record/[recordId]` | A single savings transaction's full detail — reached from either the type drill-down or a member's Savings tab.                             |
| `/co-operatives/[id]/loans/[type]`              | All loan applications of one loan product across the co-op, symmetric to the savings type drill-down.                                       |
| `/co-operatives/[id]/loans/record/[recordId]`   | A single loan's full detail, with Repayment Schedule / Transactions tabs — reached from either the type drill-down or a member's Loans tab. |

## Components

- `src/lib/coop-data.ts` — `Cooperative`/`CoopMember`/`CoopSavingsRecord`/
  `CoopLoanRecord` types, seed data, and derived-summary helpers
  (`coopSavingsBySummaryType`, `coopLoansBySummaryType`, totals).
- `src/store/coop.store.ts` — Zustand store: `cooperatives`, `addCooperative`,
  `setCooperativeStatus`, `setMemberStatus`, `updateMember`, `addMember`.
- `src/lib/validations/coop.schema.ts` — `addCooperativeSchema` for the
  "Add New Co-operative" form, `editMemberSchema` for the Members tab's
  edit dialog.
- `src/components/ui/alert-dialog.tsx` — shadcn `AlertDialog` primitive,
  added specifically for the Disable/Activate and member status
  confirmations (first use of this primitive in the app).
- `src/components/features/coop/confirm-toggle-dialog.tsx` —
  `ConfirmToggleDialog`, the shared standardized confirmation dialog built
  on `alert-dialog.tsx`; used by both call sites on this page and by the
  Members Directory page.
- `src/components/features/coop/` — `coop-list-table.tsx`,
  `add-cooperative-form.tsx`, `coop-header-card.tsx`,
  `coop-members-table.tsx`, `edit-member-modal.tsx`,
  `coop-savings-summary-table.tsx`, `coop-loans-summary-table.tsx`,
  `coop-savings-type-records-table.tsx`, `coop-loan-type-records-table.tsx`,
  `coop-member-header-card.tsx`, `coop-member-savings-table.tsx`,
  `coop-member-loans-table.tsx`.
- Reuses `src/components/features/savings/export-import-menu.tsx` (export
  only — no bulk import here, since this is oversight data, not a place an
  admin should be adding transactions in bulk) and
  `generateRepaymentSchedule`/`generateLoanTransactions` from
  `src/lib/loans-data.ts`.

## Navigation

`dashboard-nav.ts`'s super-admin-only "Co-operatives" item now has
`href: "/co-operatives"` (previously inert, showed a "coming soon" toast
like every unbuilt nav item). The sidebar's existing
`pathname.startsWith(`${item.href}/`)` active-highlight check needs no
changes — it already correctly highlights "Co-operatives" for every
nested route under it.

## Future Improvements

- "View Full Profile" on the member detail page is still an honest
  placeholder (see Design Decisions) — a real implementation would need
  its own KYC route, not a quick addition to this page.
- "Earnings on Savings" is a flat illustrative rate; a real product would
  need an actual dividend/interest accrual model shared with a real
  savings ledger.
- Disabling a co-operative or deactivating a member currently only flips a
  status badge — no cascading effect (blocking logins, freezing
  transactions, etc.) is modeled, since there's no real backend to enforce
  it against yet.
