# Members Directory

## Overview

`/members` and its sub-routes are the admin role's own member-management
area — the "Members Directory" nav item that previously had no `href` and
showed a "coming soon" toast. Lives in the `(dashboard)` route group like
every other feature. Distinct from, but built on the same data as, the
super admin's [Co-operatives](./co-operatives-page.md) oversight area.

## Purpose

Let an admin see and manage the members of the one co-operative they run:
list them, add a new one (with a real bank-account verification step),
open an individual member's own details, and see that member's
savings and loan records — the same "regular savings and loan view"
already built for the super admin's per-member drill-down, reused rather
than rebuilt.

## Design Decisions

- **Backed by the same `Cooperative`/`CoopMember` data as `/co-operatives`,
  not a second parallel dataset.** An admin manages one specific
  co-operative; rather than invent a new "admin's own org" data shape,
  `src/lib/member-directory.ts` defines `ADMIN_DIRECTORY_COOP_ID =
"COOP-0001"` and re-exports `getDirectoryMembers`/`findDirectoryMember`
  as thin wrappers around the existing `findCooperative`/`findCoopMember`
  helpers. This is the same one-line-decision pattern used elsewhere in
  the app (e.g. how `/loans`'s eligibility multiplier lives in one field)
  — if this ever needs to become genuinely tenant-aware (which admin
  manages which co-op), it's a single constant to replace with a lookup,
  not a data-model rewrite.
- **Reuses `CoopMemberHeaderCard`, `CoopMemberSavingsTable`, and
  `CoopMemberLoansTable` unmodified** for `/members/[memberId]` — the
  exact components already built for
  `/co-operatives/[id]/members/[memberId]`. The user's own framing was
  "the regular savings and loan view for each member," which is precisely
  what reuse here delivers: one implementation, two entry points (super
  admin oversight vs. admin's own management), not a fork.
- **A known, deliberate overlap: savings/loan record rows still link into
  `/co-operatives/COOP-0001/savings|loans/record/[id]`**, not a
  `/members`-scoped equivalent. Building parallel record-detail routes
  under `/members` for no data difference would have been pure
  duplication — the record is identical either way. The only visible seam
  is that the record detail page's "Member" link and "Back" button return
  to the co-operative oversight area rather than `/members`; harmless
  since no role-level route blocking exists anywhere in this app (nav
  items simply aren't shown for roles that don't have them — see
  [co-operatives-page.md](./co-operatives-page.md)).
- **The BVN field is now a real Bank Account verification step, not a
  mock identity lookup.** The original "Bank Verification Number (BVN)" +
  "Proceed" auto-fill (a small hardcoded BVN → identity table) was
  replaced app-wide with a real Paystack bank-account resolve — see
  [payments-and-payouts.md](./payments-and-payouts.md) for the full
  reasoning and the shared infrastructure behind it. A bank account
  resolve can only return an account holder's _name_, not their phone or
  email, so this form's "Verify" step now splits the resolved name into
  First/Last Name (`splitResolvedName` — a naive first-word/rest-of-name
  split, the best a name string alone can offer) and leaves Phone/Email
  as ordinary fields the admin fills in themselves, rather than
  pretending a bank lookup verified those too. This is also _why_ the
  field exists at all now, beyond identity — the account captured here is
  where this member's loan disbursements and savings-withdrawal payouts
  actually get sent.
- **Country/State/City use the same live, cascading `<LocationFields>`
  as every other address in this app** — see
  [payments-and-payouts.md](./payments-and-payouts.md#design-decisions).
  `city` is a new field on `addMemberSchema`/`editMemberSchema` and on
  `CoopMember` itself, alongside the new `bankCode`/`accountNumber`/
  `accountName` fields — every seeded `CoopMember` was given plausible
  bank details so the payout flows have real data to work against
  out of the box.
- **Edit Member can now also update a member's bank details**, not just
  name/role/guarantor/address — the same Bank + Account Number + Verify
  group from Add Member, reused in `edit-member-modal.tsx`. Necessary
  because bulk-imported members (see the Export/Import section below)
  arrive with empty bank fields — this is how an admin fills them in
  afterward.
- **Standardized confirmation-dialog copy, applied retroactively across
  the whole app, not just this new page.** The reference showed a
  specific pattern — title "Disable Member," description `Are you sure
you want to disable "Jonathan Newman"?`, gray Cancel + red Disable — and
  the request was explicit that this same pattern should apply
  everywhere, not just here. Extracted into one shared
  `ConfirmToggleDialog` (`src/components/features/coop/confirm-toggle-dialog.tsx`)
  — `entityLabel` + `name` + `isActive` + `onConfirm` — and used by:
  this page's member toggle, the existing `/co-operatives/[id]` Members
  tab's toggle, and the existing co-op-level Disable/Activate Co-operative
  button (previously three separate, slightly-differently-worded
  implementations). All three now read "Disable {Entity}" / `Are you sure
you want to disable "{name}"?`, with the same busy-state-stays-open
  behavior documented in
  [co-operatives-page.md](./co-operatives-page.md#design-decisions).
- **A genuine two-column responsive redesign, not just horizontal
  scroll.** Every other data table in this app (Savings, Loans,
  Co-operatives) handles narrow screens with `overflow-x-auto` on a
  fixed-width table — acceptable for an admin tool, but the reference
  explicitly showed a distinct stacked-card mobile layout for this page,
  so it's what got built: the table is `hidden sm:block`, and a parallel
  `sm:hidden` stacked-card list (`role="button"` rows, label/value pairs,
  the same Edit/Disable actions) renders below `sm:`. This pattern isn't
  retrofitted onto the other tables — scoped to what was actually
  requested, not a blanket redesign.
- **Bulk import is real: download the template, fill it in, upload it,
  get a specific result — not a stub.** Unlike the co-operatives module's
  savings/loan tables (still export-only, since those are transaction
  ledgers an admin shouldn't bulk-edit), a member directory is exactly
  the kind of list an admin legitimately needs to onboard several people
  into at once, so this got the same real template-gated import flow
  `/savings` already established. `src/lib/member-import.ts` exports
  `downloadMemberImportTemplate()` (an `.xlsx` with a `Template` sheet —
  Membership ID, First Name, Last Name, Email Address, Role, Guarantor,
  Country, State — plus a `Field Reference` sheet explaining each column)
  and `parseMemberImportFile(file, existingMemberIds)`. Each row is
  validated independently: a blank Membership ID skips the row silently
  (treated as a spacer), everything else produces a specific per-row
  error — duplicate Membership ID (checked against both the existing
  directory and other rows already parsed from the same file), missing
  First/Last Name, an invalid Email Address, or a Role outside
  `Member`/`Admin`. The result is a friendly, specific toast either way:
  "Import complete: N members imported," "Import finished with some rows
  skipped: N imported, N skipped — row 4: Membership ID "MEM-0988-1" is
  already in use, +1 more," or "Nothing imported" with the first error's
  exact message — never a silent failure or a generic "something went
  wrong." Verified in a real browser with a file mixing valid and invalid
  rows to confirm the counts, the specific error text, and that the
  table updates live.
- **`parseFile` takes a second argument the generic menu doesn't know
  about — solved with a closure, not a special case.** `ImportConfig.parseFile`
  is typed `(file: File) => Promise<...>`, but duplicate-checking needs
  the _current_ list of member IDs, which `ExportImportMenu` has no
  reason to know about. `/members/page.tsx` closes over `members` when
  building the `importConfig` prop
  (`parseFile: (file) => parseMemberImportFile(file, members.map((m) => m.id))`),
  so the check always uses fresh data without the shared component
  needing feature-specific knowledge.
- **The "+ Add New Members" list-page button hit the same Base UI
  footgun** already documented for `/co-operatives`: `Button` rendered as
  a `Link` via the `render` prop needs `nativeButton={false}`, or Base UI
  warns and the trigger loses native button semantics. Applied from the
  start here since it was already a known issue.
- **`ExportImportMenu` moved out of `features/savings/` and became
  genuinely generic**, rather than this page hand-rolling a second
  export/import dropdown. It was already imported by seven call sites
  across Savings, Loans, and Co-operatives despite living in a
  savings-specific folder and being hard-coded to
  `downloadSavingsImportTemplate`/`parseSavingsImportFile` — a real
  reusability gap this feature exposed. It now lives at
  `src/components/features/shared/export-import-menu.tsx` and takes an
  optional `importConfig: { templateStorageKey, downloadTemplate,
parseFile, onImport }` instead of a hard-coded savings import, plus an
  `entityLabel` prop (defaults to `"record"`) so toast copy reads "3
  members imported" here and "3 savings records imported" on `/savings`,
  not a generic "3 records" everywhere. `ImportRowError` (the row-level
  error shape both `savings-import.ts` and the new `member-import.ts`
  return) moved to `src/lib/table-import.ts` for the same reason — one
  shared shape, not two structurally-identical interfaces declared twice.
  All seven existing call sites were migrated, and both the new
  member-import flow and the pre-existing `/savings` import were
  re-verified end-to-end in a real browser after the refactor, not just
  typechecked.

## Routes

| Route                 | Purpose                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `/members`            | List every member of the admin's co-operative — search, Export, pagination, responsive mobile cards, "+ Add New Members." |
| `/members/new`        | Add a member, with the bank-account verification step.                                                                    |
| `/members/[memberId]` | One member's own header (Membership ID, Full Name, Email, Access, Guarantor, Country, State) + Savings/Loans tabs.        |

## Components

- `src/lib/member-directory.ts` — `ADMIN_DIRECTORY_COOP_ID` and the
  directory-scoped data helpers.
- `src/lib/bank-lookup.ts`, `src/hooks/use-bank-list.ts`,
  `src/components/features/shared/location-fields.tsx` — the real bank
  verification and live address fields; see
  [payments-and-payouts.md](./payments-and-payouts.md).
- `src/lib/member-import.ts` — `downloadMemberImportTemplate`,
  `parseMemberImportFile`, `ImportedMemberRow`.
- `src/lib/table-import.ts` — the shared `ImportRowError`/
  `ParsedImportResult<TRow>` shapes used by both `member-import.ts` and
  `savings-import.ts`.
- `src/lib/validations/member-directory.schema.ts` — `addMemberSchema`.
- `src/components/features/shared/export-import-menu.tsx` — the
  generalized `ExportImportMenu` (moved here from `features/savings/`;
  see Design Decisions).
- `src/components/features/coop/confirm-toggle-dialog.tsx` —
  `ConfirmToggleDialog`, the shared standardized confirmation dialog (new
  in this change, used by three different features now).
- `src/components/features/members-directory/members-directory-table.tsx` —
  the list, including the responsive mobile card view.
- `src/components/features/members-directory/add-member-form.tsx` — the
  Add New Member form.
- Reuses `src/components/features/coop/coop-member-header-card.tsx`,
  `coop-member-savings-table.tsx`, and `coop-member-loans-table.tsx`
  unmodified. `edit-member-modal.tsx` gained the same Bank Account
  verification group as Add Member (see Design Decisions) — the only one
  of these that changed.

## Navigation

`dashboard-nav.ts`'s admin-only "Members Directory" item now has
`href: "/members"`.

## Future Improvements

- If admins ever need to manage a co-operative _they_ choose (rather than
  a hardcoded one), `ADMIN_DIRECTORY_COOP_ID` is the one place that
  decision needs to become a real lookup (e.g. tied to the logged-in
  admin's own membership record).
- Paystack's test-mode account-resolve quota (3 real-bank lookups/day —
  see [payments-and-payouts.md](./payments-and-payouts.md#design-decisions))
  applies here too; the sandbox "Test Bank" option in the bank list works
  around it for demoing the Verify step specifically, not for a real
  payout.
- Import only adds new members — no bulk edit/delete of existing ones,
  matching the same limitation already documented for `/savings`' import.
- A large import file would call the store's `addMember` once per row in
  a synchronous loop (one Zustand update each) rather than a single
  batched update — fine at the scale a demo needs, worth revisiting if
  bulk imports of hundreds of rows become a real use case.
