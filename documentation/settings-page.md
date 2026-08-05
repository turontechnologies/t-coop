# Settings (Super Admin)

## Overview

`/settings` is a new super-admin-only area with five tabs: Profile,
Payment Settings, Integrations, User Management, Logs. Same
`(dashboard)` route group, auth guard, and shell as every other
super-admin page. Scoped to `super_admin` only for now, per the request
that started this — `admin`/`member` still have a "Settings" nav item
with no `href`, same inert state it was in before.

## Purpose

Give a super admin one place to manage their own account (profile +
password), the platform's fee structure and collections account, its
payment-gateway integrations, the platform's own staff accounts and
roles (distinct from co-operative members), and a read-only activity
log.

## Design Decisions

- **Profile tab reuses the real `ProfileRecord` store, not a new one.**
  `getProfileData`/`updateProfileData` (`src/lib/profile-data.ts`) — the
  same functions `/profile` uses — back this tab's First Name, Last
  Name, Email, Address (→ `homeAddress`), Phone, Country fields, and the
  avatar upload is the exact same Cloudinary flow as
  `ProfileHeaderCard`. Two different screens editing two different
  copies of the same person's data would drift out of sync; this
  doesn't.
- **Password change is inline, not a separate flow.** Reuses
  `verifyMockUserPassword`/`updateMockUserPassword`
  (`src/lib/mock-users.ts`) — the same functions the
  `/create-new-password` recovery flow uses — but the three password
  fields are optional here: leaving them blank just saves the profile
  fields. They're plain component state rather than part of the
  react-hook-form/zod-resolved form (which only covers the always-
  required profile fields), validated manually on submit the same way
  `create-new-password-form.tsx` manually `setError`s for an incorrect
  current password.
- **Country is a live, keyless dropdown** via a new `useCountries()`
  hook (`src/hooks/use-countries.ts`) — same module-level-cache pattern
  as `useBankList()`, wrapping the same `countriesnow.space` source
  already used by `LocationFields`. This tab only needed the country
  (no state/city), so it's a lighter hook rather than reusing the full
  `LocationFields` component.
- **Fees & Charges and Account Details are genuinely new settings**,
  not wired into any live calculation yet. `feeSettings` (charge type +
  amount for savings and loans) and `collectionAccount` (the
  platform's own bank account — bank picker + account number + the same
  real Paystack "Verify" flow used everywhere else bank details are
  captured) live in a new `useSettingsStore`
  (`src/store/settings.store.ts`). Saving them doesn't currently change
  the illustrative `PLATFORM_SAVINGS_FEE_RATE` used on the Savings
  oversight page — flagged honestly below rather than silently
  pretending they're connected.
- **Integrations tab is a settings _record_, not a live credential
  switch.** Toggling Paystack and typing keys here saves to
  `useSettingsStore`, but the actually-active Paystack integration
  still reads `PAYSTACK_SECRET_KEY`/`NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY`
  from the server environment, same as before this page existed — a
  real secret key must never live in client-observable Zustand state.
  The form says so directly under the key fields rather than implying
  otherwise.
- **Paystack and Flutterwave are independent toggles, not a choice
  between the two** — either can be on, both can be on, both can be
  off. `GatewayCard` (`settings-integrations-tab.tsx`) renders both
  gateways from the same shape (name, description, enable switch,
  credential fields, caveat text) rather than special-casing one as
  primary. Flutterwave gets its own three fields (Public Key, Secret
  Key, Encryption Key — Flutterwave's actual credential set, not
  Paystack's) in `IntegrationSettings`
  (`src/lib/settings-data.ts`). Its caveat is more direct than
  Paystack's: there's no Flutterwave route handler anywhere in this
  app, so enabling it here is purely a settings record for now, not a
  second live payment path — building that would mean duplicating the
  whole `/api/paystack/*` effort (checkout, resolve, transfer) for a
  second provider, out of scope for the settings screen alone.
- **User Management is platform staff, not co-operative members.**
  `PlatformUser`/`PlatformRole` (`src/lib/settings-data.ts`) are a new,
  separate concept from `CoopMember` — people who help operate T-Coop
  itself (support staff), not people who belong to a co-operative.
  "Invite User" doesn't send a real email (no backend) — it adds the
  user as `Active` immediately, consistent with how this app's other
  "invite/create" actions already work without a real notification
  layer.
- **Both Users and Roles are fully actionable, not just listed.** Each
  row gets the same Edit/Disable-Activate/Remove pattern already
  established by `coop-members-table.tsx` (pencil-icon edit, a
  `ConfirmToggleDialog` status toggle, a destructive `AlertDialog`
  remove) — reused rather than reinvented, down to the exact
  "Disable"/"Activate" wording. Editing a user only changes their role
  (name/email aren't editable here, same reasoning real systems use:
  identity fields aren't casually reassignable). Editing a role reuses
  `CreateRoleModal` in an edit mode (`editingRole` prop) instead of a
  second near-identical modal. **Removing a role is blocked** if any
  user is still assigned to it — checked against `platformUsers` before
  calling the store action, with a toast explaining why, rather than
  silently orphaning a user's role.
- **Permissions are a fixed module list** (`PERMISSION_MODULES` —
  Dashboard, Co-operatives, Savings & Contributions, Loans,
  Subscriptions, Members Directory, Notice Board, Support, Settings),
  picked via a checkbox multi-select built on the existing
  `DropdownMenuCheckboxItem` primitive (new `Switch` UI primitive was
  also added for the Integrations toggles — Base UI has a
  `@base-ui/react/switch` export, just no shadcn wrapper existed yet).
  A role with every module checked displays as "All access" in the
  table, matching the mockup, rather than listing all nine.
- **Logs is a genuine, structured, app-wide audit trail, not a static
  list.** Moved out of `useSettingsStore` into its own persisted
  `useAuditLogStore` (`src/store/audit-log.store.ts`, localStorage-
  backed like the notice board store — key bumped to `tcoop-audit-log-v2`
  when the entry shape changed mid-session, so stale pre-shape data in a
  browser's storage doesn't crash the UI) and a `logActivity({ module,
action, resource, status? })` utility (`src/lib/audit-log.ts`) that
  reads the signed-in member via `useAuthStore.getState()` — callable
  from anywhere, including inside other Zustand stores' actions, since
  it isn't a React hook. Each entry has a real `module`
  (`Authentication`, `Co-operatives`, `Members`, `Savings`, `Loans`,
  `Subscriptions`, `Notices`, `Settings`, `Users`), `action` (`Login`,
  `Create`, `Update`, `Delete`, `Approve`, `Decline`, `Payment`), and
  `status` (`Success`/`Info`/`Warning`/`Failed`) — not a free-text
  sentence — derived honestly from what actually happened (e.g. a
  decline or disable logs `Warning`; the one place removal is genuinely
  blocked — deleting a role still assigned to a user — logs a real
  `Failed`, not a fabricated one). Wired into every mutating action
  across the app: login, co-op create/disable/member add/edit/status,
  savings records/requests/approvals, loan requests/guarantor
  decisions/admin decisions, subscription payments, notices (create/
  delete/resend/reply), and every Settings action (fees, integrations,
  invite/edit/disable/remove user, create/edit/disable/remove role,
  profile/password/photo changes).
  Each entry also resolves an **approximate IP-based location**
  (`src/lib/ip-location.ts`, via `ipwho.is` — free, keyless, CORS-open,
  same pattern as `geo-lookup.ts`'s countriesnow.space) in the
  background: the entry is written immediately with `location:
"Locating…"`, then patched in place once the lookup resolves (or
  `"Unknown"` if it fails). This is genuinely live and was verified
  end-to-end — disabling a user in this session produced a real
  "Just now" / real resolved-city entry, not a canned one. The same
  `ipwho.is` response also returns the caller's public IP, so the same
  lookup fills both the Location and IP Address columns (`ip-location.ts`
  now returns `{ location, ipAddress }` instead of a bare string).
- **Row click or "More" opens a details side panel**, not another modal
  — a new `Sheet` primitive (`src/components/ui/sheet.tsx`) reuses
  `Dialog`'s exact structure/Base UI plumbing but slides in from the
  right edge instead of centering, matching the reference's "comes in
  by the side" request without introducing a different interaction
  pattern. `ActivityDetailsPanel` shows every real field on the entry
  (Event ID with copy-to-clipboard, Time, User, Role, Action, Module,
  Resource, Status, IP Address, Location) plus a colored status banner
  — deliberately **not** the reference's Device/Browser/Session
  ID/File Size/Metadata fields, since this app doesn't track any of
  those and fabricating them would misrepresent what's actually logged.

## Components

- `src/app/(dashboard)/settings/page.tsx` — the 5-tab shell, super_admin
  guarded.
- `src/components/features/settings/settings-profile-tab.tsx` — avatar
  - User Details + Password Details, one shared Reset/Save Changes.
- `src/components/features/settings/fees-charges-form.tsx`,
  `collection-account-form.tsx` — the two Payment Settings sub-tabs.
- `src/components/features/settings/settings-payment-tab.tsx` — wraps
  the two above in a nested `Tabs`.
- `src/components/features/settings/settings-integrations-tab.tsx` —
  Paystack and Flutterwave, both independently togglable via a shared
  `GatewayCard`, each showing its own credential fields when enabled.
- `src/components/features/settings/platform-users-table.tsx`,
  `platform-roles-table.tsx` — the two tables, each with per-row
  Edit/Disable-Activate/Remove actions.
- `src/components/features/settings/invite-user-modal.tsx`,
  `edit-user-modal.tsx`, `create-role-modal.tsx` (create + edit mode),
  `settings-user-management-tab.tsx` — the modals and wiring.
- `src/components/features/settings/settings-logs-tab.tsx` — searchable
  audit-log table (Time/User/Role/Module/Action/Resource/Status/IP
  Address/More), each Module and Action rendered with its own icon,
  each Status as a colored badge.
- `src/components/features/settings/activity-details-panel.tsx` — the
  slide-in detail view for one entry.
- `src/lib/audit-log.ts`, `src/lib/audit-log-data.ts`,
  `src/lib/audit-log-ui.ts`, `src/lib/ip-location.ts` — the logging
  utility, its entry type/seed data, the shared module/action/status
  icon and color maps (used by both the table and the panel), and the
  IP-geolocation lookup.
- `src/store/audit-log.store.ts` — persisted audit-log entries.
- `src/hooks/use-countries.ts` — cached country list hook.
- `src/components/ui/switch.tsx`, `src/components/ui/sheet.tsx` — new
  shadcn-style primitives (toggle switch; right-edge slide-in panel).
- `src/store/settings.store.ts` — fee settings, collection account,
  integrations, platform users, platform roles (no longer holds the
  activity log — see `audit-log.store.ts`).

## Future Improvements

- Fee settings aren't wired into the actual savings/loan fee
  calculations used elsewhere (`PLATFORM_SAVINGS_FEE_RATE` in
  `coop-data.ts` stays hardcoded).
- No real email is sent on "Invite User" — the account just appears as
  Active.
- IP-based location is approximate (city/region-level, from the public
  IP) and meaningless for requests from a local/dev network — a real
  deployment would see this improve automatically once traffic comes
  from real client IPs.
- Not yet extended to `admin`/`member` roles — those two still show a
  Settings nav item with no destination.
- Integration keys typed here aren't validated against either gateway
  (no "test this key" action) — purely stored.
- Flutterwave has no live route handler behind it (unlike Paystack's
  `/api/paystack/*`) — enabling it here doesn't add a second real
  payment path yet. Building that would mean a parallel checkout/
  resolve/transfer integration the same size as the existing Paystack
  one.
