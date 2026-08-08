# Currency & Live Conversion

## Overview

Each co-operative now has a real `currency` field (ISO 4217 code, e.g.
`NGN`, `USD`, `GHS`) — set only by that co-operative's own admin, in
`/settings` → Co-operative Settings → Co-operative. Every other role
(including super admin) sees it read-only, with a genuinely live
conversion rate against the platform's base currency (NGN).

## Purpose

Let each co-operative operate in whatever currency its members actually
use, while giving the super admin a way to understand, at a glance and
without doing the math themselves, what that's worth in the platform's
own currency — updating on its own as real exchange rates move, not a
number someone has to remember to refresh.

## Design Decisions

- **Currency lives on the real `Cooperative` record, not an illustrative
  settings sandbox.** Every other new admin-settings screen this session
  (Fees & Charges, Loan Type Settings, etc.) deliberately writes to a
  separate, illustrative store that doesn't affect the rest of the app —
  documented that way on purpose. Currency is different: the whole point
  is that a super admin looking at a _different_ screen (`/co-operatives`)
  needs to see what an admin set on _their_ screen, live. That only
  works if it's the same underlying record, so `currency: string` was
  added directly to `Cooperative` (`src/lib/coop-data.ts`, default
  `"NGN"` on all three seeded co-ops — Turon stays NGN, Harbor Light
  seeded as USD, Northbridge as GHS, so the feature demos real variety
  immediately) and a `setCoopCurrency(coopId, currency)` action added to
  `useCoopStore`. The store itself doesn't enforce who's allowed to call
  it — the UI does, by only ever exposing the control inside the admin's
  own Co-operative Settings screen, never in any super-admin view.
- **Live rates come from a real, free, keyless API** —
  `open.er-api.com` (`src/lib/exchange-rate.ts`), same "call a real
  public API directly from the browser" pattern already used for
  country/state/city (`geo-lookup.ts`) and IP geolocation
  (`ip-location.ts`). Its CORS header is `*`, and it covers essentially
  every real ISO 4217 currency, so no proxying or key management is
  needed.
- **"Real-time" is honestly scoped.** The provider itself only refreshes
  its rates roughly once every 24 hours (that's its own documented
  behavior, not a limitation introduced here) — there's no free, keyless
  service that streams sub-second FX ticks. `useExchangeRate`
  (`src/hooks/use-exchange-rate.ts`) polls every 5 minutes and exposes a
  manual refresh button, so the UI always shows whatever the latest rate
  the provider has — and displays exactly how stale that rate is
  ("Live rate — refreshed 13h ago") rather than implying it's more
  current than it is. This is the same honesty pattern already used for
  the audit log's best-effort IP location.
- **Currency list is (almost) the full real ISO 4217 set**, not a
  handful of majors — `src/lib/currency-data.ts` has ~160 real,
  circulating currencies. Picking one out of that many needed a real
  search, not a 160-item native dropdown, so a small searchable
  combobox was built (`currency-combobox.tsx`, Popover + Input +
  ScrollArea) rather than forcing the existing plain `Select` primitive
  to do a job it isn't suited for.
- **This only sets the label, not a global currency switch (yet).**
  Choosing GHS changes what shows on the currency card and in the
  Super Admin co-op list/detail — it does **not** currently reformat
  every Naira amount displayed elsewhere in the app (savings/loans
  tables, dashboard, etc. still show `formatNaira` everywhere). Actually
  converting every displayed amount app-wide would mean touching dozens
  of call sites and deciding a conversion-at-write-time vs.
  conversion-at-display-time model — a materially bigger, separate
  effort, flagged honestly below rather than silently half-done.

## Components

- `src/lib/coop-data.ts` — `Cooperative.currency`.
- `src/store/coop.store.ts` — `setCoopCurrency`.
- `src/lib/currency-data.ts` — `SUPPORTED_CURRENCIES` (~160 ISO 4217
  currencies), `findCurrency`.
- `src/lib/exchange-rate.ts` — `fetchExchangeRate(from, to)`.
- `src/hooks/use-exchange-rate.ts` — polling hook with manual refresh.
- `src/components/features/coop/coop-currency-display.tsx` —
  `CoopCurrencyDisplay`, `compact` (table cell) and `full` (card)
  variants; used in `CoopListTable` and `CoopHeaderCard` (so it also
  shows up on `/subscriptions/[id]`, which reuses `CoopHeaderCard`).
- `src/components/features/admin-settings/coop-currency-form.tsx` —
  the admin-only setter, in Co-operative Settings → Co-operative.
- `src/components/features/admin-settings/currency-combobox.tsx` — the
  searchable currency picker.

## Future Improvements

- Amounts elsewhere in the app aren't reformatted into the co-op's
  chosen currency yet — only the currency label + conversion-rate
  display are live.
- No historical rate chart — only the current rate.
- If a co-op's currency changes, existing savings/loan records don't
  get relabeled or converted — they stay in whatever currency they were
  recorded in.
