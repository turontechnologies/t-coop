# Payments & Payouts

## Overview

Money moves in two directions, through two different gateway features:

1. **Collections (inline checkout)** — a member pays _in_ with a card or
   bank transfer in a popup. Needs only a **public** key in the browser;
   every payment is verified server-side with the matching **secret** key
   before anything is recorded.
2. **Payouts (Paystack Transfers)** — money goes _out_ of a Paystack
   balance to someone's bank account. Needs the **secret** key and the
   recipient's verified bank details.

Inline checkout can't pay anyone out; payouts need the separate Transfers
API.

## Collections

| What                       | Gateway used                                                                                | Code                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Member savings deposit     | The co-op's own Paystack, else its own Flutterwave, else the platform's Paystack            | `SavingsSelfServiceController`, `member-savings-view.tsx` |
| Loan installment repayment | Same rule as deposits                                                                       | `LoanRepaymentController`, `loan-repayment-panel.tsx`     |
| Co-op subscription         | The platform's gateways (Paystack, Flutterwave, OPay — whichever the super admin turned on) | `SubscriptionController`, `admin-support-view.tsx`        |

Every collection is **initialize → pay → confirm**: the backend fixes the
amount and returns `{ reference, gateway, publicKey }`, the browser opens
that gateway's widget (`src/lib/coop-checkout.ts` picks Paystack or
Flutterwave), and `confirm` verifies the reference against the gateway's
API with the secret key that belongs to the same account. The gateway and
key owner are stored on the payment intent, so verification still hits the
right account even if the admin changes their settings mid-payment.

A co-op connects its own gateway in its admin's **Settings → Integrations**
(see [admin-settings-page.md](./admin-settings-page.md)); the platform's
keys live in the super admin's Settings → Integrations
(see [settings-page.md](./settings-page.md)).

## Payouts

- **Loan disbursement — server-side, automatic.** The Secretary's approval
  (the last step of the loan approval chain, see
  [loans-page.md](./loans-page.md)) makes the backend register the
  borrower as a Paystack transfer recipient and send principal minus loan
  charges. It pays from the co-op's own Paystack if connected, else the
  platform's. The reference is fixed per loan (`loan-<loanId>`), so a retry
  can't pay twice. The loan only becomes Active if Paystack accepts the
  transfer.
- **Savings withdrawal approval — still from the web app.** The admin's
  approval calls the Next.js route `POST /api/paystack/transfer`
  (`src/lib/paystack-transfer.ts`), which reads `PAYSTACK_SECRET_KEY` from
  the server environment. It runs the transfer first and only marks the
  request Approved if it succeeds. Moving this to the backend like loans is
  a sensible next step.

### Paystack account requirements

These are Paystack account settings, not code — payouts fail with
Paystack's own message until they're met:

- **The business must be past "Starter" tier.** Otherwise Paystack answers
  _"You cannot initiate third party payouts as a starter business"_, even
  in test mode with a valid recipient.
- **"Confirm transfers with OTP" must be off** (Paystack Settings →
  Preferences). An automated payout can't type an OTP; the backend reports
  this clearly instead of leaving a half-finished transfer. The web app's
  `POST /api/paystack/transfer/finalize` + `finalizeTransfer()` exist for a
  manual OTP step but nothing calls them.

## Bank details and lookups

- Bank details live on the member record (`bankCode`, `accountNumber`,
  `accountName`), captured on Profile, Add Member and Edit Member.
- **Bank list and account-name lookup go through the backend** —
  `GET /api/v1/paystack/banks` and `POST /api/v1/paystack/resolve-account`
  (`PaystackUtilityController`), using the platform's Paystack secret from
  the super admin's Settings → Integrations. Web (`src/lib/bank-lookup.ts`)
  and mobile share them. The list is filtered to active, transfer-capable
  NGN banks (commercial, microfinance, and payment-service banks).
- Paystack's test mode allows only **3 real-bank account lookups per day**.
- "Verify" on Add Member fills the account name and splits it into a first
  and last name (`splitResolvedName`); phone and email are typed in.

## Addresses

The country/state/city cascade uses countriesnow.space directly from the
browser (keyless, CORS-open) via `src/lib/geo-lookup.ts`, shared by every
address form through `src/components/features/shared/location-fields.tsx`.

## Key files

- Backend: `subscription/PaymentGatewayService.java` (verify, transfer, bank
  list/resolve), `coopgateway/CoopGatewayResolver.java` (whose keys a co-op
  payment or payout uses).
- Web: `src/lib/coop-checkout.ts`, `src/lib/paystack.ts`,
  `src/lib/flutterwave.ts`, `src/lib/bank-lookup.ts`,
  `src/lib/paystack-transfer.ts`, `src/app/api/paystack/transfer*`.

## Future improvements

- Move savings-withdrawal payouts to the backend, matching loans.
- Confirm transfers and payments by Paystack webhook rather than only the
  synchronous response.
