# Dashboard

## Overview

The `/dashboard` route (`src/app/(dashboard)/dashboard/page.tsx`) is a
single page shared by all three roles — super admin, admin, and member —
rather than three separate route trees. The shell (sidebar, topbar,
breadcrumb) and the content (quick-summary cards, activity chart, recent
activities) both read the signed-in member's `role` and reconfigure
accordingly. One route, one layout, three personas.

## Purpose

Give each role a landing page that matches what the original design
references showed (same content, same actions, same information
architecture per role) without literally cloning their dated visual style.
The user explicitly asked for this distinction — see
[Design Decisions](#design-decisions).

## Design Decisions

- **Redesigned, not cloned.** The reference mockups (see the project's
  original design brief) used flat, saturated stat-card blocks and a dense,
  slightly dated admin-panel aesthetic. The brief for this rebuild was
  explicit: same content and functionality, modern and professional
  execution. Quick-summary cards use soft tinted icon chips instead of
  solid color blocks; the chart is a redesigned, accessibility-checked
  area chart (see [Activity Chart](#activity-chart)) rather than a literal
  recreation of the reference screenshot.
- **One route, role-driven config**, not three near-duplicate pages.
  `src/config/dashboard-nav.ts` maps `UserRole` → nav items + breadcrumb
  label; `src/lib/dashboard-data.ts` maps `UserRole` → quick-summary cards,
  chart series, and whether recent-activity rows show a "Success" status
  badge. Adding a fourth role means extending these two config files, not
  building a fourth page.
- **Only "Dashboard" is a real link.** The reference nav includes items like
  "Co-operatives," "Loans," "Settings" that have no page behind them yet.
  Rather than ship dead links that 404, non-dashboard nav items
  (`src/components/layouts/dashboard-sidebar.tsx`) are inert buttons that
  surface a "coming soon" toast — honest about what's actually built.
- **Auth guard, not middleware.** `src/app/(dashboard)/layout.tsx` is a
  client component that reads `useAuthStore` and redirects to `/login` if
  there's no member once the store has finished hydrating from
  `localStorage`. See
  [theming-and-motion.md](./theming-and-motion.md#loading--splash-system)
  for why the loading state in front of that check is timed the way it is.

## Role Configuration

| Role          | Breadcrumb label    | Nav items (beyond Dashboard)                                                    | Quick-summary cards                                                    | Chart series              |
| ------------- | ------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ------------------------- |
| `super_admin` | Super Administrator | Co-operatives, Savings & Contributions, Loans, Subscriptions, Support, Settings | Total Co-operatives, Total Members, Total Savings, Total Loans         | Savings, Loans            |
| `admin`       | Administrator       | Members Directory, Savings & Contributions, Loans, Support, Settings            | Total Savings, Total Loans, Total Dividends (each with an action pill) | Savings, Loans, Dividends |
| `member`      | Member              | My Profile, Savings & Contributions, Loans, Support, Settings                   | My Savings, My Loans, My Dividends (each with an action pill)          | Savings, Loans, Dividends |

Recent activities are the same four mock entries for every role
(`src/lib/dashboard-data.ts`); only `super_admin` hides the per-row
"Success" status badge, matching the reference designs.

## Components

- `src/app/(dashboard)/layout.tsx` — auth guard + loading gate, wraps
  content in `<DashboardShell>`.
- `src/app/(dashboard)/loading.tsx` — Next.js route-segment loading
  boundary, also rendering `<AnimatedLogo>` for consistency.
- `src/components/layouts/dashboard-shell.tsx` — composes sidebar, topbar,
  breadcrumb, and content; owns the mobile sidebar's open/closed state.
- `src/components/layouts/dashboard-sidebar.tsx` — role-driven nav, fixed
  off-canvas drawer on mobile (`lg:sticky` in-flow on desktop), Logout
  pinned at the bottom.
- `src/components/layouts/dashboard-topbar.tsx` — today's date, the
  notification bell, theme toggle, and the profile dropdown (name, email,
  Logout).
- `src/components/layouts/notification-menu.tsx` — bell icon with an
  unread-count badge; a dropdown lists mock notifications
  (`src/lib/notifications-data.ts`) with working "mark as read" /
  "mark all as read" (local `useState`, resets on reload — there's no
  backend to persist read-state against).
- `src/components/layouts/dashboard-breadcrumb.tsx` — role label / "Dashboard"
  plus the "Showing: Last N days" period filter (functional dropdown,
  updates local state; doesn't refetch anything since the data is static
  mock data).
- `src/components/features/dashboard/quick-summary-cards.tsx` — the stat
  card grid; tone (`brand` / `violet` / `sky` / `amber`) maps to a soft
  tinted icon-chip background via Tailwind utility classes, not new CSS
  variables.
- `src/components/features/dashboard/activity-chart.tsx` — see below.
- `src/components/features/dashboard/recent-activities.tsx` — the activity
  list card.

## Activity Chart

Built using this repo's `dataviz` design skill rather than eyeballed
colors. The chart plots 2–3 series (Savings always; Loans always; Dividends
for admin/member) as a Recharts `AreaChart`.

- **Palette:** picked from the skill's validated categorical set — aqua/green
  for Savings (`#1baf7a` light / `#199e70` dark, chosen because it reads as
  an extension of the brand green), orange for Loans (`#eb6834` /
  `#d95926`), violet for Dividends (`#4a3aa7` / `#9085e9`, matching the
  Dividends stat card's tone for visual consistency). Both the light-mode
  and dark-mode triples were run through the skill's
  `validate_palette.js` against this app's actual card surface colors
  (`#ffffff` light, `#111827` dark) — light mode passed with a contrast
  **warning** on the aqua slot (2.82:1, below the 3:1 floor), which is why
  the chart ships a legend with visible text labels and a full tooltip
  rather than relying on the line color alone to carry meaning (the skill's
  "relief rule" for a borderline-contrast categorical color).
- **Marks:** 2px lines, ~10% opacity area fill (a wash, not a block),
  horizontal-only hairline gridlines, no dashed strokes.
- **Interaction:** a real hover tooltip (not decorative) — crosshair
  cursor, one row per series, value bold, series name secondary, a short
  line-key swatch instead of a filled box.
- Colors are wired through CSS custom properties using `light-dark()`
  (`--chart-series-savings: light-dark(#1baf7a, #199e70)`), which resolves
  correctly because `next-themes` sets `document.documentElement.style
.colorScheme` — see
  [theming-and-motion.md](./theming-and-motion.md#theme-tokens).

## Animations

- Page-level entrance: the root `template.tsx` fade/slide applies here like
  every route (see theming-and-motion.md).
- Cards, chart, and activity list don't have their own extra stagger beyond
  the page-level transition — a dashboard with live, frequently-changing
  data is not the place for a slow choreographed reveal every time a stat
  updates.
- Sidebar nav items and dropdown menus use the global button press-feedback
  and the existing shadcn open/close transitions (`tw-animate-css`).
- The mobile sidebar (the off-canvas drawer below `lg:`) has two coordinated
  motions: the backdrop is a Framer Motion `<AnimatePresence>` fade (it used
  to be conditionally rendered with no transition at all — it just popped
  in/out), and the drawer itself slides via a Tailwind transform transition
  tuned to a smoother ease-out-expo-style curve (`duration-300
ease-[cubic-bezier(0.22,1,0.36,1)]`) rather than the default. The drawer
  stays CSS-driven rather than also moving to Framer Motion because it needs
  to respect the `lg:` breakpoint (always open, in-flow, on desktop) —
  Framer Motion's `animate` prop has no way to say "unless the viewport is
  wide," but a static `lg:translate-x-0` Tailwind class handles that for
  free.
- Logging out plays the same `<RouteTransition>` used elsewhere in the app
  rather than an instant redirect — see
  [theming-and-motion.md](./theming-and-motion.md#route-transitions).

## State Management

- **Auth/session:** `useAuthStore` (Zustand, persisted) — the single source
  of truth for `member`/`role` that both the layout guard and every child
  component read.
- **UI-only state:** mobile sidebar open/closed
  (`dashboard-shell.tsx`), notification read/unread
  (`notification-menu.tsx`), selected period filter
  (`dashboard-breadcrumb.tsx`) — all local `useState`, none persisted,
  since none of it represents real backend state yet.
- **Mock data:** `src/lib/dashboard-data.ts` and
  `src/lib/notifications-data.ts` are pure functions/constants, no network
  layer — there's nothing to fetch yet, so no TanStack Query usage here
  (unlike the auth flows, which do go through the mock `authService` +
  `useMutation` to keep that seam realistic).

## Files Created

```
src/app/(dashboard)/layout.tsx
src/app/(dashboard)/loading.tsx
src/app/(dashboard)/dashboard/page.tsx
src/components/layouts/dashboard-shell.tsx
src/components/layouts/dashboard-sidebar.tsx
src/components/layouts/dashboard-topbar.tsx
src/components/layouts/dashboard-breadcrumb.tsx
src/components/layouts/notification-menu.tsx
src/components/features/dashboard/quick-summary-cards.tsx
src/components/features/dashboard/activity-chart.tsx
src/components/features/dashboard/recent-activities.tsx
src/config/dashboard-nav.ts
src/lib/dashboard-data.ts
src/lib/notifications-data.ts
src/lib/format.ts
src/hooks/use-minimum-duration.ts
```

## Future Improvements

- Wire the currently-inert nav items (Co-operatives, Loans, Settings, etc.)
  to real pages as they're built, replacing the "coming soon" toast.
- The period filter (`Showing: Last N days`) doesn't actually refetch
  anything — once there's a real data source, it should scope the chart
  and quick-summary cards to the selected range.
- Notification read-state and the mobile sidebar's open state are
  client-only; neither survives a refresh. Worth revisiting once there's a
  backend to persist notification read-state against.
