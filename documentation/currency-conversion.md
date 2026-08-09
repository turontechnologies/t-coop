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
- **Currency now formats every amount app-wide, not just the label.**
  `formatMoney(amount, currencyCode)` (`src/lib/format.ts`) replaced
  `formatNaira` at every call site that displays a co-op-scoped amount —
  savings tables, loans tables, member/admin summary cards, modals,
  and record detail pages. `formatNaira` itself still exists as a
  thin NGN-only wrapper, kept deliberately for the platform-level
  contexts that must never vary by co-op currency (Subscriptions
  revenue, audit-log text — see below).
- **Resolving "which currency" without prop-drilling through ~40
  files**: `CurrencyProvider`/`useCurrency()`
  (`src/components/providers/currency-provider.tsx`) is a small React
  Context. Components that already receive a full `coop: Cooperative`
  object use `coop.currency` directly (most robust). Components that
  only receive raw records (no `coop` reference) call `useCurrency()`,
  which resolves from the nearest `CurrencyProvider` ancestor.
  `(dashboard)/layout.tsx` provides the outer default: an admin's whole
  area resolves to their own co-op's currency; a member's or super
  admin's default is NGN.
- **Per-co-op isolation on the Super Admin side.** Every
  `/co-operatives/[id]/**` page (details, savings/loans type & record
  drill-downs, member detail) wraps its content in its own
  `<CurrencyProvider currency={coop.currency}>`, nested inside the
  layout's default. This is what keeps one co-op's currency from ever
  leaking into another's — Turon (NGN), Harbor Light (USD), and
  Northbridge (GHS) each render entirely in their own currency with no
  cross-contamination, confirmed in a real headless-browser pass.
- **Cross-co-op aggregates use real conversion, not raw summation.**
  The Super Admin's `/savings` oversight "Total Savings" card can't
  just add up amounts in different currencies, so it uses
  `useAggregateInCurrency` (`src/hooks/use-aggregate-in-currency.ts`):
  it fetches a live rate per unique currency present, then converts
  and sums into NGN. Each co-op's own row in the oversight table still
  shows in that co-op's own currency.

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
- `src/lib/format.ts` — `formatMoney(amount, currencyCode)`.
- `src/components/providers/currency-provider.tsx` — `CurrencyProvider`,
  `useCurrency()`.
- `src/hooks/use-aggregate-in-currency.ts` — cross-currency sum with
  live conversion, used by the Super Admin savings oversight aggregate.

## Deliberately still NGN-only

- `formatNaira` (platform-level, not co-op-scoped): audit-log
  `resource` text in `coop.store.ts`/`savings.store.ts`/`loans.store.ts`,
  and everything under Subscriptions (`super-admin-subscriptions-view.tsx`,
  `super-admin-subscriptions-table.tsx`, `subscription-history-table.tsx`,
  `/subscriptions/[id]`) — subscription fees are what co-ops pay _to_
  the platform, conceptually always in the platform's own currency,
  not the co-op's member-facing one.

## Future Improvements

- No historical rate chart — only the current rate.
- If a co-op's currency changes, existing savings/loan records don't
  get relabeled or converted — they stay in whatever currency they were
  recorded in.
