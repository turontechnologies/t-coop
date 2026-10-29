# Settings (Co-op admin)

## Overview

`/settings` branches by role in `src/app/(dashboard)/settings/page.tsx`:
`super_admin` gets the platform tabs in [settings-page.md](./settings-page.md);
members and support staff get a single Account tab; a **co-op admin** (and
co-op staff) gets the co-operative's own settings:

| Tab                       | What it manages                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Profile**               | User (own profile, photo, optional password change) · Bank Accounts (own personal payout account)                              |
| **Savings Settings**      | The co-op's savings types — create, edit, enable/disable                                                                       |
| **Loan Settings**         | The co-op's loan types (every co-op starts with a Household Loan) — full-page editor at `/settings/loans/new` (`?id=` to edit) |
| **Co-operative Settings** | Co-operative (details, logo, currency, member ID format, charges, withdrawal fee) · Bank Accounts · Transfer Admin             |
| **Integrations**          | The co-op's own payment gateways (Paystack, Flutterwave)                                                                       |
| **User Management**       | Co-op staff: assign existing members to roles, including the four officer roles                                                |

Everything reads and writes the real backend. Co-op staff only see the tabs
their role grants (`useTabAccess("Settings", "<tab>")`), and a read-only
grant shows the tab without save buttons.

## Integrations

The co-op's own Paystack and/or Flutterwave account
(`admin-integrations-tab.tsx` → `GET/PATCH /cooperatives/{id}/integrations`).
When one is on, members' **savings deposits and loan repayments are paid
into it**, and **loan and withdrawal payouts are sent from it** (Paystack only). With
nothing on, the platform's Paystack is used. If both are on, Paystack wins.

- Secret keys are write-only: the page shows "Saved — leave blank to keep
  it", and the backend never returns them.
- Saving checks the key format (`pk_`/`sk_`, `FLWPUBK`/`FLWSECK`), that both
  keys are present to turn a gateway on, and that test and live keys
  aren't mixed.
- Only the co-op admin, or co-op staff granted Settings → Integrations, can
  open it. Super admins can't — these keys move the co-op's money.
- OPay and SMS aren't offered here: deposits/repayments use in-page
  checkout widgets, which OPay doesn't support, and SMS is a platform
  setting.

## User Management and officer roles

Co-op staff are existing members given a co-op role (they keep their own
member account). Roles are named sets of module/tab permissions with read or
write access.

Every co-op also has four **officer roles** — President, Vice President,
Treasurer, Secretary — created automatically. They drive loan approval (see
[loans-page.md](./loans-page.md)):

- Each office is held by **one member at a time**; assigning a second
  person is refused until the first is removed.
- They can't be renamed, deactivated, or deleted; their permissions can be
  edited like any role. By default they can work the loan Requests queue and
  read the financial report (Reports module — see [reports-page.md](./reports-page.md)). The roles table marks them "Officer" and shows who
  holds each one (or "Vacant — admin covers it").

## Design decisions

- **Two bank-account screens, two different accounts.** Profile → Bank
  Accounts is the admin's own personal account (the member record);
  Co-operative Settings → Bank Accounts is the co-operative's account. Both
  use the same live bank list and "Verify" lookup.
- **No guarantor rule for joining.** The old "Minimum Guarantors"
  membership rule is gone — members don't need a guarantor to join, only to
  take a loan.
- **A loan type no longer has an "eligibility %".** How much a member can
  borrow comes from the mode they pick (Times two: half their savings;
  Within: their savings), capped by the type's maximum — see
  [loans-page.md](./loans-page.md). Interest can be a percentage, a fixed
  amount, or none.
- **Loan Type is a full page, not a modal** — it has too many fields for a
  dialog. "No. of installments" is computed from duration and repayment
  interval.

## Key files

- `src/app/(dashboard)/settings/page.tsx`, `settings/loans/new/page.tsx`
- `src/components/features/admin-settings/*` — one component per tab/form,
  including `admin-integrations-tab.tsx`
- `src/components/features/settings/settings-user-management-tab.tsx`,
  `coop-roles-table.tsx`, `create-coop-role-modal.tsx`
- `src/hooks/use-coop-integrations.ts`, `src/services/coop-integrations.service.ts`,
  `src/services/coop-staff.service.ts`
