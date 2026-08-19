# T-Coop API Contracts

For the backend engineer. This app currently runs on frontend mock data — everything
below is what the real API needs to provide instead. All endpoints except **Auth**
require `Authorization: Bearer <token>`. Money amounts are in Naira (numbers, not kobo)
unless noted. Dates are ISO 8601 strings.

Three roles: `super_admin` (oversees all co-ops), `admin` (manages one co-op), `member`
(belongs to one co-op).

---

## 1. Auth

### `POST /auth/login`

```json
// Request
{ "membershipId": "COOP-0001", "password": "string", "keepLoggedIn": true }

// Response
{
  "token": "string",
  "member": { "id": "COOP-0001", "name": "string", "email": "string", "role": "admin", "avatarUrl": "string?" }
}
```

Login is by **membership ID**, not email. A co-op's admin logs in with the **co-op's own ID**
(there's no separate `AD-XXXX` admin ID — see §2). A member who is not `Active` gets a
distinct `403 { "error": "Your account is not active. Please contact Turon Technologies for
assistance." }` instead of the generic invalid-credentials message — but only once the
password has already matched, so a wrong-password guess against a disabled account still
gets the generic message and can't be used to fish for which accounts are disabled.

### `POST /auth/forgot-password`

```json
// Request
{ "email": "string" }
// Response
{ "message": "OTP sent" }
```

Sends the OTP by email/SMS server-side. **Do not return the OTP in the response** (the current mock does this — it's a known gap to close).

### `POST /auth/verify-otp`

```json
// Request
{ "email": "string", "otp": "123456" }
// Response
{ "resetToken": "string" }
```

### `POST /auth/reset-password`

```json
// Request
{ "resetToken": "string", "newPassword": "string" }
// Response
{ "message": "Password updated" }
```

### `POST /auth/change-password` (authenticated)

```json
// Request
{ "currentPassword": "string", "newPassword": "string" }
// Response
{ "message": "Password updated" }
```

### `GET /auth/me`

```json
// Response
{
  "id": "string",
  "name": "string",
  "email": "string",
  "role": "super_admin|admin|member",
  "avatarUrl": "string?"
}
```

### `POST /auth/logout`

```json
// Response
{ "message": "Logged out" }
```

---

## 2. Cooperatives (super_admin only)

**A co-op IS its admin account.** Onboarding a co-op creates exactly one `Member` row
(`role: "admin"`) whose `id` is the co-op's own `id` — not a separately generated one. That
admin logs in with the co-op ID and the platform default password (`admin123`), and is
expected to change it from Settings. This keeps "how many co-ops has super admin onboarded"
and "how many admins exist" the same number by construction, and means the co-op's members
(`Member` rows with `cooperativeId` = that co-op's id) are exactly that admin's members.

### `GET /cooperatives`

Returns list with computed totals (backend computes `totalSavings`, `totalLoans` — don't make the frontend sum records).

```json
// Response
[
  {
    "id": "COOP-0001",
    "name": "string",
    "adminName": "string",
    "contactEmail": "string",
    "contactPhone": "string",
    "address": "string",
    "country": "string",
    "state": "string",
    "city": "string",
    "status": "Active|Disabled",
    "memberCount": 12,
    "totalSavings": 960000,
    "totalLoans": 560000
  }
]
```

### `POST /cooperatives`

```json
// Request
{
  "coopId": "string",
  "coopName": "string",
  "adminFirstName": "string",
  "adminLastName": "string",
  "contactEmail": "string",
  "contactPhone": "string",
  "address": "string",
  "country": "string",
  "state": "string",
  "city": "string"
}
// Response: the created Cooperative (same shape as GET /cooperatives item)
```

### `GET /cooperatives/:id`

Same shape as one list item, plus `savingsByType` and `loansByType` breakdowns:

```json
{
  ...coop fields,
  "savingsByType": [{ "name": "Basic Savings", "min": 5000, "max": 10000, "total": 235000 }],
  "loansByType": [{ "name": "Emergency Loan", "interestRate": 5, "durationMonths": 3, "total": 150000 }]
}
```

### `PATCH /cooperatives/:id`

```json
// Request — editable fields only; id/status/currency/subscriptionFee are untouched
{
  "name": "string",
  "adminFirstName": "string",
  "adminLastName": "string",
  "contactEmail": "string",
  "contactPhone": "string",
  "address": "string",
  "country": "string",
  "state": "string",
  "city": "string"
}
// Response: the updated Cooperative (same shape as GET /cooperatives item)
```

Since the co-op's admin identity lives on the same `Member` row the admin logs in and edits
their own profile as (see above), this endpoint also writes `adminFirstName`/`adminLastName`/
`contactEmail`/`contactPhone` through to that row — a super admin's edit here is what the
admin sees reflected in their own portal, immediately, with no separate sync step.

### `PATCH /cooperatives/:id/status`

```json
{ "status": "Active|Disabled" }
```

Disabling a co-op also flips its admin `Member` row's status (mapped to `Inactive`, since
`Member.status` only allows `Active|Inactive` while `Cooperative.status` allows
`Active|Disabled`) — so a disabled co-op's admin is locked out of login immediately, with
the friendly "account not active" message from §1.

---

## 3. Members (scoped to a cooperative)

```ts
// CoopMember shape, returned by all endpoints below
{
  "id": "string", "firstName": "string", "lastName": "string", "email": "string",
  "role": "Admin|Member", "status": "Active|Inactive", "guarantor": "string",
  "country": "string", "state": "string", "city": "string",
  "bankCode": "string", "accountNumber": "string", "accountName": "string"
}
```

- `GET /cooperatives/:id/members` — list. `admin` role should only ever see their own co-op's members.
- `POST /cooperatives/:id/members` — create. Request = above shape minus `id`, plus `membershipId`.
- `POST /cooperatives/:id/members/bulk` — multipart file upload (Excel), same fields per row. Response: `{ "imported": 12, "errors": [{ "row": 3, "message": "string" }] }`.
- `GET /cooperatives/:id/members/:memberId` — detail.
- `PATCH /cooperatives/:id/members/:memberId` — update `firstName, lastName, email, role, guarantor, country, state, city, bankCode, accountNumber, accountName`.
- `PATCH /cooperatives/:id/members/:memberId/status` — `{ "status": "Active|Inactive" }`.

**Bank fields**: `accountName` is never typed by the user — it's filled in from `POST /banks/resolve` (§10) after the user picks a bank + types an account number.

---

## 4. Profile (self-service, any authenticated member)

### `GET /profile`

```json
{
  "membershipId": "string",
  "accountNumber": "string",
  "bankCode": "string",
  "accountName": "string",
  "nin": "string",
  "firstName": "string",
  "lastName": "string",
  "otherName": "string?",
  "gender": "Male|Female|Other",
  "phone": "string",
  "email": "string",
  "homeAddress": "string",
  "country": "string",
  "state": "string",
  "city": "string",
  "facebook": "string?",
  "twitter": "string?",
  "guarantor": "string?"
}
```

### `PATCH /profile`

Same shape as request body (minus `membershipId`, which is fixed). Returns the updated record.

### `POST /profile/password`

```json
// Request
{ "currentPassword": "string", "newPassword": "string" }
// Response
{ "message": "Password updated" }
```

**Built.** 400 `"Current password is incorrect"` if `currentPassword` doesn't match; `newPassword` must be at least 6 characters. Used by Settings' Profile tab (`useChangePassword` / `change-password.service.ts`) — the profile fields save first, then the password change, so if only the password step fails the profile edits aren't lost (the form shows "Profile details saved" plus an inline error on the password field, not a generic failure toast).

---

## 5. Savings

### `GET /savings/types`

```json
[{ "name": "Basic Savings", "min": 5000, "max": 10000 }]
```

Static catalog (3 types today) — fine as a hardcoded config endpoint or DB table.

### `GET /cooperatives/:id/savings`

List savings records. Supports query params `?memberId=&savingsType=&status=&from=&to=`.

```json
[
  {
    "id": "string",
    "memberId": "string",
    "memberName": "string",
    "savingsType": "string",
    "amount": 90000,
    "balanceAfter": 90000,
    "method": "Paystack|Manual Upload",
    "transactionId": "string",
    "date": "2025-07-09",
    "status": "Success|Pending|Failed",
    "receiptUrl": "string?"
  }
]
```

### `GET /savings/:recordId`

Single record, same shape.

### `POST /cooperatives/:id/savings` (admin manual/teller upload)

```json
// Request
{
  "memberId": "string",
  "savingsType": "string",
  "amount": 90000,
  "receiptFile": "multipart file?"
}
// Response: the created record (balanceAfter computed server-side)
```

### `POST /savings/requests` (member self-service)

```json
// Request
{ "savingsType": "string", "type": "Deposit|Withdrawal", "amount": 90000, "note": "string?" }
// Response
{
  "id": "string", "memberId": "string", "memberName": "string",
  "type": "Deposit|Withdrawal", "savingsType": "string", "amount": 90000,
  "note": "string?", "status": "Pending", "requestedAt": "iso-datetime"
}
```

### `GET /cooperatives/:id/savings/requests`

List, same shape as above plus `resolvedAt`. `admin` sees their own co-op's; `super_admin` can pass no `:id` filter to see all.

### `PATCH /savings/requests/:id`

```json
// Request
{ "status": "Approved|Declined" }
```

On `Approved` + `type: Withdrawal`: backend must trigger a real payout via §10 (`/payouts/transfer`) to the member's saved bank details before marking it Approved. If the transfer fails, the request must stay `Pending` and the error surfaced back to the client — don't mark Approved if money didn't move.

### `GET /savings/summary?coopId=`

```json
[{ "name": "Basic Savings", "min": 5000, "max": 10000, "total": 235000 }]
```

Used for the "Members Savings" breakdown table.

---

## 6. Loans

### `GET /loans/types`

```json
[
  {
    "name": "Emergency Loan",
    "interestRate": 5,
    "maxAmount": 50000,
    "durationMonths": 3,
    "eligibilityPercent": 300
  }
]
```

### `GET /loans/eligibility?memberId=&loanType=`

```json
{ "eligibleAmount": 150000 }
```

Computed as `min(maxAmount, totalSavings * eligibilityPercent / 100)`.

### `POST /cooperatives/:id/loans` (member requests a loan)

```json
// Request
{ "loanType": "string", "amount": 50000, "guarantorId": "string" }
// Response — status starts "Awaiting Guarantor"
{
  "id": "string", "memberId": "string", "memberName": "string", "loanType": "string",
  "amount": 50000, "interestRate": 5, "durationMonths": 3, "numberOfRepayments": 3,
  "monthlyRepayment": 17500, "totalRepayment": 52500, "guarantorName": "string",
  "date": "iso-date", "status": "Awaiting Guarantor|Awaiting Admin|Active|Completed|Rejected",
  "repaymentsMade": 0
}
```

### `PATCH /loans/:id/guarantor-response`

```json
// Request
{ "decision": "Accepted|Rejected", "documentFile": "multipart file?" }
```

`Accepted` → status moves to `Awaiting Admin`. `Rejected` → status moves to `Rejected`.

### `PATCH /loans/:id/decision` (admin)

```json
// Request
{ "decision": "Approved|Rejected", "rejectionReason": "string?" }
```

On `Approved`: trigger a real payout via §10 to the member's bank details, same "don't mark Approved unless the transfer succeeded" rule as savings withdrawals. Moves status to `Active` (or `Rejected`).

### `GET /cooperatives/:id/loans`

List, same shape as the request response above.

### `GET /loans/:id`

Single record detail.

### `GET /loans/:id/repayment-schedule`

```json
[
  {
    "installment": 1,
    "amount": 16666,
    "interest": 833,
    "totalAmount": 17500,
    "dueDate": "iso-date",
    "status": "Paid|Upcoming|Overdue|Pending"
  }
]
```

**Note**: the current frontend only _displays_ a computed schedule and never records an actual repayment — there's no "make a repayment" action anywhere in the UI today. Flagging this as a real gap: decide with product whether repayments are auto-deducted (wallet), manually recorded by admin, or out of scope for this phase, then add a `POST /loans/:id/repayments` endpoint accordingly.

---

## 7. Notices

```ts
// Notice shape
{
  "id": "string", "type": "General|Meeting Notice|Meeting Minutes",
  "title": "string", "message": "string",
  "recipient": "All Members|All Admins|All Members & Admins",
  "medium": "Email|SMS|Email & SMS",
  "meetingDate": "iso-date?",           // only for "Meeting Notice"
  "attachment": { "name": "string", "url": "string", "size": 12345 } | null,
  "sendAt": "iso-datetime",             // future = scheduled, not yet sent
  "createdByName": "string", "createdByRole": "super_admin|admin|member",
  "createdAt": "iso-datetime"
}
```

- `GET /notices` — list. `member` role should only receive notices already sent (`sendAt <= now`) and addressed to them (`recipient` includes their role).
- `POST /notices` — create. Request = above minus `id/createdByName/createdByRole/createdAt`. Attachment as multipart file, not base64.
- `GET /notices/:id` — detail.
- `DELETE /notices/:id` — also deletes its replies.
- `POST /notices/:id/resend` — sets `sendAt` to now.
- `GET /notices/:id/replies` — `[{ "id", "noticeId", "authorId", "authorName", "authorRole", "authorAvatarUrl", "message", "createdAt" }]`.
- `POST /notices/:id/replies` — `{ "message": "string" }`.
- `POST /notices/:id/read` — marks read for the current user (for read-receipt tracking across devices).

---

## 8. Subscriptions

**No co-op can act on the platform (any non-GET request, anywhere) without an active
subscription** — a co-op that has never paid is treated identically to one that lapsed, enforced
once centrally by the backend's `SubscriptionGateFilter`.

Pricing is a super-admin-managed catalog (**Subscription Plans**, §8a) — every duration
(Weekly/Monthly/custom) and price is something the super admin added, not a fixed formula, and
New Subscription / Renewal are priced independently.

```ts
// SubscriptionPayment shape
{
  "id": "string", "paymentRef": "string", "amountPaid": 300000,
  "method": "Manual|Paystack|Flutterwave", "date": "iso-date",
  "type": "New Subscription|Renewal", // auto-detected server-side — never client-supplied
  "cycle": "string", // snapshot of the plan's label at the time — free text, not an enum
  "status": "Active|Overdue",
  "resultingExpiresAt": "iso-date" // what THIS payment extended the subscription to, for accurate historical receipts
}
```

### 8a. Subscription Plans (`super_admin` only) — Settings → Payment Settings → Subscription Plans

The editable price list everything else in this section reads from. Freely
addable/editable/deletable — `durationInDays` is the flexible unit (not a fixed enum), so a plan
can be any length ("Weekly", "6 Months", "18 Months", whatever). Deleting a plan never corrupts
payment history — `SubscriptionPayment.cycle` is a label snapshot, not a foreign key.

```ts
// SubscriptionPlan shape
{
  "id": "uuid", "type": "New Subscription|Renewal", "label": "string",
  "durationInDays": 30, "amount": 12500, "status": "Active|Inactive"
}
```

- `GET /settings/subscription-plans` — list all.
- `POST /settings/subscription-plans` — `{ type, label, durationInDays, amount }` → creates
  (`status` always starts `"Active"`).
- `PATCH /settings/subscription-plans/:id` — `{ label, durationInDays, amount, status }`. `type`
  is never editable — delete and re-add to move a plan between New Subscription and Renewal.
- `DELETE /settings/subscription-plans/:id` — hard delete.

An `Inactive` plan stays visible in past payment history but can no longer be picked for a new
payment (filtered out of both `GET /subscriptions/me` and the super admin's manual-recording
picker).

### Super admin — manual recording (`super_admin` only)

### `GET /subscriptions`

```json
[
  {
    "coopId": "string",
    "coopName": "string",
    "revenueEarned": 900000,
    "subscriptionFee": 300000,
    "subscriptionCycle": "string|null",
    "lastPaymentDate": "iso-date|null",
    "subscriptionExpiresAt": "iso-date|null",
    "status": "Active|Overdue"
  }
]
```

`subscriptionFee` is the co-op's own onboarding-time figure — informational only. It's not what
self-service/manual pricing is computed from; that's entirely the Subscription Plans catalog.

### `GET /subscriptions/summary`

```json
{ "mgtFeesReceived": 1200000 }
```

### `GET /cooperatives/:id/subscriptions`

Full payment history for one co-op, newest first — array of `SubscriptionPayment`.

### `POST /cooperatives/:id/subscriptions`

A manual record of money already received (bank transfer, cheque, etc.) — not a gateway call.
`planId` picks the label/duration from the Subscription Plans catalog; `amountPaid` stays
free-typed since a real external payment can legitimately differ from the catalog's listed
price.

```json
// Request
{ "amountPaid": 75000, "planId": "uuid" }
// Response: { "payment": SubscriptionPayment, "nextRenewalDate": "iso-date" }
```

### Self-service (`admin`, the caller's own co-op only) — powers `/support`

The one path exempted from the platform-wide subscription lock. Real checkout via whichever
gateway(s) the super admin enabled and entered real keys for in Settings → Integrations.

#### `GET /subscriptions/me`

```json
{
  "coopId": "string",
  "coopName": "string",
  "adminName": "string",
  "status": "Active|Overdue",
  "subscriptionCycle": "string|null",
  "subscriptionExpiresAt": "iso-date|null",
  "availablePlans": [SubscriptionPlan, ...],
  "availableGateways": [
    { "gateway": "Paystack|Flutterwave|Opay", "publicKey": "string" }
  ]
}
```

`availablePlans` is auto-scoped: `New Subscription` plans if never subscribed, `Renewal` plans
otherwise — matching what a payment against this co-op would actually be classified as.

#### `GET /subscriptions/me/history`

Same shape as `GET /cooperatives/:id/subscriptions`, scoped to the caller's own co-op.

#### `POST /subscriptions/me/initialize`

```json
// Request
{ "planId": "uuid", "gateway": "Paystack|Flutterwave|Opay" }
// Response
{ "reference": "string", "amount": 25000, "gateway": "Paystack", "publicKey": "string", "checkoutUrl": "string|null" }
```

`amount` comes straight from the plan — never client-supplied. `409` if the plan's type doesn't
match what this co-op can currently buy, or if the chosen gateway isn't fully configured.

Paystack/Flutterwave are **client-side inline widgets**: `publicKey` is set, `checkoutUrl` is
`null`; open the gateway's own Inline checkout with `reference`/`amount`/`publicKey`.

OPay is **server-initiated and redirect-based**, unlike the other two: this call has the backend
hit OPay's real `cashier/create` API server-side (HMAC-SHA512-signed with the platform's OPay
secret key) and returns a hosted `checkoutUrl` — `publicKey` is `null`. Just navigate the browser
to `checkoutUrl`; OPay redirects back to `returnUrl` (`{FRONTEND_URL}/support?opay_reference=...`)
once the payer finishes, at which point the frontend picks the reference back up from the URL and
calls `confirm` the same way the other two gateways' success callback does. `502` if OPay's
`cashier/create` call itself fails (bad credentials, OPay outage, etc).

**Note:** this platform's live OPay merchant account is provisioned for **Egypt** — OPay's own
API rejects `country: "NG"` for this merchant ID ("request forbidden(request domain error.)").
`PaymentGatewayService.createOpayCheckout`/`verifyOpay` hardcode `country: "EG"` /
`currency: "EGP"` as a result. Subscription plan amounts are priced in Naira by the super admin
and passed straight through with **no currency conversion** — confirm the intended NGN-to-EGP
handling (a Nigeria-provisioned OPay merchant account, or real FX conversion) before relying on
OPay for live subscription charges.

#### `POST /subscriptions/me/confirm`

```json
// Request
{ "reference": "string" }
// Response: SubscriptionReceipt — { coopId, coopName, adminName, paymentRef, amountPaid, method,
//   date, type, cycle, status, nextRenewalDate }
```

Call this from the gateway's client-side success callback (Paystack/Flutterwave) or after
picking the reference back up from the OPay return redirect. `402` if the backend's own
server-side verification against the real gateway API fails or the amount is short; `409` if
that reference was already confirmed.

---

## 9. Dashboard summary

### `GET /dashboard/summary`

Role-aware; scope to the caller's co-op for `admin`/`member`, platform-wide for `super_admin`.

```json
{
  "cards": [{ "label": "Total Savings", "value": 209000000 }, ...],
  "chart": [{ "hour": "9am", "savings": 12000, "loans": 4000, "dividends": 800 }, ...],
  "recentActivity": [{ "title": "string", "subtitle": "string", "amount": 90000, "date": "iso-datetime", "status": "string?" }]
}
```

**Built.** Cards and `recentActivity` are real aggregation queries over `savings_records`/`loan_records` on the backend. The `chart` and any `Dividends` figure have no dedicated table behind them, so they're derived from the real totals rather than invented outright — see `t-coop-backend/documentation/flows.md` for exactly what's real vs. illustrative.

---

## 10. Bank & Payouts (already built — Paystack-backed)

These four already work today as real Next.js API routes proxying Paystack. Decide with the backend engineer whether Next.js keeps owning them or they move server-side — the contract stays the same either way.

### `GET /banks`

```json
{ "banks": [{ "name": "Access Bank", "code": "044" }] }
```

### `POST /banks/resolve`

```json
// Request
{ "accountNumber": "string", "bankCode": "string" }
// Response
{ "accountName": "string" }
```

### `POST /payouts/transfer`

```json
// Request
{ "accountNumber": "string", "bankCode": "string", "accountName": "string", "amount": 50000, "reason": "string?" }
// Response
{ "status": "string", "transferCode": "string", "reference": "string" }
```

### `POST /payouts/transfer/finalize`

```json
// Request
{ "transferCode": "string", "otp": "string" }
// Response
{ "status": "string" }
```

Only needed if Paystack comes back requiring OTP confirmation (live mode); not exercised in test mode.

---

## 11. File upload

### `POST /uploads`

```
Content-Type: multipart/form-data
field: file (png/jpeg/webp, max 5MB)
```

```json
// Response
{ "url": "string" }
```

Currently only used for avatars — should also replace the base64 storage used today for savings receipts, loan-guarantor documents, and notice attachments (all currently stored as base64 data URLs directly in records, which won't scale).

---

## 12. Audit log (super admin only)

### `GET /audit-log`

```json
[
  {
    "id": "string",
    "date": "iso-datetime",
    "activityBy": "string",
    "role": "Super Administrator|Administrator|Member",
    "module": "Authentication|Co-operatives|Members|Savings|Loans|Subscriptions|Notices|Settings|Users",
    "action": "Login|Logout|Create|Update|Delete|Approve|Decline|Payment",
    "resource": "string",
    "status": "Success|Info|Warning|Failed",
    "location": "string",
    "ipAddress": "string"
  }
]
```

**Built.** Latest 200 entries platform-wide, newest first; 403s for any non-`super_admin` caller. `module`/`action` values are validated against `src/lib/audit-log-data.ts`'s fixed `AuditModule`/`AuditAction` enums server-side — an unrecognized value has no icon mapping here and used to crash the whole Logs tab (fixed by adding `getModuleIcon`/`getActionIcon`/`getStatusStyle` fallbacks in `src/lib/audit-log-ui.ts`, plus a migration to correct historical rows). Only logins/logouts, profile updates, and now platform-settings updates are wired to this so far — Co-operatives/Members/Savings/Loans/Subscriptions/Notices actions are still mock-only and won't appear here until those features are cut over too.

---

## 13. Platform settings (super admin only)

Backs three Settings tabs: **Fees & Charges**, **Payment Settings → Account
Details**, and **Integrations**.

### `GET` / `PATCH /settings/fees`

```json
{
  "savingsChargeType": "Fixed|Percentage",
  "savingsChargeAmount": 0.25,
  "loansChargeType": "Fixed|Percentage",
  "loansChargeAmount": 1,
  "withdrawalFeePercent": 1
}
```

### `GET` / `PATCH /settings/collection-account`

```json
{ "bankCode": "string", "accountNumber": "string", "accountName": "string?" }
```

### `GET` / `PATCH /settings/integrations`

```json
{
  "paystackEnabled": true,
  "paystackPublicKey": "string?",
  "paystackSecretKey": "string?",
  "paystackWebhookSecret": "string?",
  "flutterwaveEnabled": false,
  "flutterwavePublicKey": "string?",
  "flutterwaveSecretKey": "string?",
  "flutterwaveEncryptionKey": "string?",
  "opayEnabled": false,
  "opayPublicKey": "string?",
  "opaySecretKey": "string?",
  "opayMerchantId": "string?"
}
```

**Built.** Used by `fees-charges-form.tsx`, `collection-account-form.tsx`,
and `settings-integrations-tab.tsx` via `platform-settings.service.ts` and
the `use-fee-settings`/`use-collection-account`/`use-integration-settings`
hooks. `NEXT_PUBLIC_USE_MOCK_SETTINGS=true` falls back to the old
`useSettingsStore` mock.

**Two different consumers of these same credentials:**

- The self-service subscription checkout (`POST /subscriptions/me/initialize` /
  `/confirm`, § 8b) reads all three gateways' keys **live** from this same
  `PlatformSettings` row, server-side — enabling a gateway here and saving real
  keys is exactly what makes it usable on `/support`.
- The unrelated outbound-payout Next.js route handlers under `src/app/api/paystack/*`
  (§ 10 below — bank resolution, transfers) always read from the server's own
  `PAYSTACK_SECRET_KEY` environment variable instead, never from values saved
  here. Flutterwave/OPay have no live payout route at all.

---

## Not in scope

- **Country/State/City dropdowns** — called directly from the browser against `countriesnow.space` (free, public, keyless). No backend work needed unless you want to bring it in-house later.
