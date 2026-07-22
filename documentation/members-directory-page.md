# Members Directory

## Overview

`/members` and its sub-routes are the admin role's own member-management
area — the "Members Directory" nav item that previously had no `href` and
showed a "coming soon" toast. Lives in the `(dashboard)` route group like
every other feature. Distinct from, but built on the same data as, the
super admin's [Co-operatives](./co-operatives-page.md) oversight area.

## Purpose

Let an admin see and manage the members of the one co-operative they run:
list them, add a new one (with a real BVN-verification-style auto-fill
step), open an individual member's own details, and see that member's
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
- **A real, if small, mock BVN-lookup service — not a fake that always
  succeeds.** The reference's "Bank Verification Number (BVN)" field with
  a "Proceed" button that auto-fills First Name/Last Name/Phone/Email
  implies a genuine identity-verification step, so
  `src/lib/bvn-lookup.ts` ships a small hardcoded BVN → identity table
  (three demo BVNs, listed as a hint under the field, the same
  click-to-help pattern as the login page's demo-account picker) rather
  than accepting any 11-digit string. An unrecognized BVN surfaces a real
  inline error, matching the honesty-about-mocks convention used for
  duplicate membership/co-op IDs elsewhere. First Name/Last Name/Phone/
  Email stay disabled (placeholder "Auto filled") until verification
  succeeds, then populate and become editable — verified, not locked
  forever, since the admin may need to correct a value.
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
- **Export only, no bulk import, on the list page** — same reasoning as
  the co-operatives module's savings/loan tables: this is a place an
  admin reviews and manages members one at a time (edit dialog, add-member
  form), not a CSV-ingestion pipeline. `ExportImportMenu` is used without
  an `onImport` prop.
- **The "+ Add New Members" list-page button hit the same Base UI
  footgun** already documented for `/co-operatives`: `Button` rendered as
  a `Link` via the `render` prop needs `nativeButton={false}`, or Base UI
  warns and the trigger loses native button semantics. Applied from the
  start here since it was already a known issue.

## Routes

| Route                 | Purpose                                                                                                                   |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `/members`            | List every member of the admin's co-operative — search, Export, pagination, responsive mobile cards, "+ Add New Members." |
| `/members/new`        | Add a member, with the BVN-verification auto-fill step.                                                                   |
| `/members/[memberId]` | One member's own header (Membership ID, Full Name, Email, Access, Guarantor, Country, State) + Savings/Loans tabs.        |

## Components

- `src/lib/member-directory.ts` — `ADMIN_DIRECTORY_COOP_ID` and the
  directory-scoped data helpers.
- `src/lib/bvn-lookup.ts` — the mock BVN → identity lookup service and
  `DEMO_BVNS`.
- `src/lib/validations/member-directory.schema.ts` — `addMemberSchema`.
- `src/components/features/coop/confirm-toggle-dialog.tsx` —
  `ConfirmToggleDialog`, the shared standardized confirmation dialog (new
  in this change, used by three different features now).
- `src/components/features/members-directory/members-directory-table.tsx` —
  the list, including the responsive mobile card view.
- `src/components/features/members-directory/add-member-form.tsx` — the
  Add New Member form.
- Reuses `src/components/features/coop/edit-member-modal.tsx`,
  `coop-member-header-card.tsx`, `coop-member-savings-table.tsx`,
  `coop-member-loans-table.tsx`, and
  `src/components/features/savings/export-import-menu.tsx` unmodified.

## Navigation

`dashboard-nav.ts`'s admin-only "Members Directory" item now has
`href: "/members"`.

## Future Improvements

- If admins ever need to manage a co-operative _they_ choose (rather than
  a hardcoded one), `ADMIN_DIRECTORY_COOP_ID` is the one place that
  decision needs to become a real lookup (e.g. tied to the logged-in
  admin's own membership record).
- The BVN lookup only recognizes three demo values — fine for a mock, but
  a real integration would call an actual verification provider and
  handle partial matches / rate limiting.
- Bulk member import isn't wired (see Design Decisions) — worth
  reconsidering once there's a real need to onboard many members at once.
