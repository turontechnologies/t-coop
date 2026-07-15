# Theming, Motion & Loading System

## Overview

This doc covers the cross-cutting systems that touch every screen rather
than one route: the light/dark theme pipeline, the font pipeline, the
global interaction/animation conventions, and the branded loading system.
It also documents two real, non-obvious bugs found and fixed during this
build — worth reading before touching theme or menu code, since both bugs
were invisible to TypeScript, ESLint, and casual code review, and were only
caught by actually clicking through the running app.

## The `onSelect` vs `onClick` bug

**Symptom:** the theme toggle did nothing. Clicking "Dark" in the dropdown
closed the menu but never changed anything — no class change, no
`localStorage` write, nothing.

**Root cause:** this project's shadcn components are generated against
[Base UI](https://base-ui.com) (`@base-ui/react`), not Radix. Radix's
`DropdownMenu.Item` accepts an `onSelect` callback — a very common shadcn
pattern copied across countless tutorials. Base UI's `Menu.Item` has no such
prop; it only accepts `onClick`. Critically, **`onSelect` is still a real,
valid prop on any DOM element** — it's the native "text selection changed"
event, part of React's generic `DOMAttributes<T>` typing — so passing
`onSelect={() => setTheme(value)}` to a Base UI menu item type-checks
cleanly and produces zero ESLint warnings. It just never fires on a click,
because a click isn't a text-selection event.

This single mistake was silently breaking three separate features at once:

- `src/components/theme/theme-toggle.tsx` — the Light/Dark/System switcher.
- `src/components/layouts/dashboard-breadcrumb.tsx` — the "Showing: Last 30
  days" period filter.
- `src/components/layouts/dashboard-topbar.tsx` — the profile menu's Logout
  item.

**Fix:** every `<DropdownMenuItem onSelect={...}>` became
`<DropdownMenuItem onClick={...}>`. **How it was actually caught:** not by
reading the code again, but by driving a real, running instance of the app
with headless Chrome over the DevTools protocol — genuine synthesized mouse
events (`Input.dispatchMouseEvent`, not a bare DOM `.click()`, which can
behave differently for some component libraries) clicking the actual
rendered menu items and asserting on the resulting `document.documentElement`
class and `localStorage` state. If you're debugging a Base UI menu/select
and the item's callback "just doesn't fire," check the prop name first.

## The font pipeline (`--font-sans`)

The font also silently fell back to the browser default for a while. The
setup follows shadcn's convention: `next/font/google` loads a font with a
`variable` option, and `globals.css` re-exposes that CSS variable into
Tailwind's theme scope:

```ts
// src/app/layout.tsx
const fontSans = Inter({ variable: "--font-sans", subsets: ["latin"] });
```

```css
/* src/app/globals.css */
@theme inline {
  --font-sans: var(--font-sans); /* re-exposes the variable set on <html> */
}
```

This only works if the font loader's `variable` **name** is literally
`--font-sans`. The project originally loaded Geist under the name
`--font-geist-sans` — a reasonable, descriptive name, but one that broke the
handoff: `globals.css` was looking for a variable called `--font-sans` that
never existed, so `--font-sans: var(--font-sans)` resolved to nothing and
`font-family: var(--font-sans)` fell through to the browser's default
UA stylesheet font. Confirmed by inspecting the compiled CSS output
directly rather than guessing. Fixed by loading Inter under the exact name
`--font-sans`. If you ever swap the font again, the loader's `variable`
option **must** be `--font-sans` — not a descriptive name — for this
indirection to resolve.

## Theme tokens

Standard shadcn two-file convention in `src/app/globals.css`: `:root` holds
light-mode values, `.dark` holds dark-mode overrides, both exposed as CSS
custom properties and re-mapped into Tailwind's `@theme inline` block.
`next-themes` (`src/components/theme/theme-provider.tsx`) toggles the `.dark`
class on `<html>` and also sets `document.documentElement.style.colorScheme`,
which is what lets `light-dark()` CSS values (used in the dashboard's chart
series colors) resolve correctly without a second set of Tailwind classes.

**Deliberately non-reactive surfaces:** the auth hero panel
(`auth-brand-panel.tsx`), the centered auth layout's green backdrop
(`centered-auth-layout.tsx`), and the simulated OTP email preview
(`otp-email-preview.tsx`) all use hardcoded brand-green/white colors instead
of theme tokens. This is intentional, not an oversight:

- The two brand panels are meant to always read as "the brand," the same
  way a product's marketing hero doesn't flip to dark mode with the rest of
  the UI.
- The email preview represents content a **recipient's email client** would
  render — real emails don't respect the sender's app theme, so styling it
  with light-mode-only colors is the more honest simulation.

Everywhere else — dashboard, forms, cards, the sidebar, notifications — uses
semantic tokens (`bg-card`, `text-foreground`, `bg-muted`, etc.) specifically
so dark mode doesn't need to be re-verified screen by screen.

## Global interaction conventions

Rather than set cursor/press-feedback styles per component, two rules live
once in `globals.css`'s `@layer base` and apply everywhere:

```css
button:not(:disabled, [role="menuitem"], [data-disabled="true"]),
[role="button"]:not([aria-disabled="true"]),
a[href],
label[for],
select {
  cursor: pointer;
}

button:not(:disabled, [role="menuitem"]):active {
  transform: scale(0.97);
}
```

Menu items are excluded from the press-scale (a scaling dropdown row reads
as broken, not tactile — background highlight is the correct affordance
there). The shared `Button` component (`src/components/ui/button.tsx`)
already had its own subtle `translate-y-px` press effect from the original
shadcn generation; Tailwind's utilities layer outranks this file's `@layer
base` rule in the cascade, so `Button` keeps its original feel and every
other raw `<button>` in the app (sidebar items, card action pills, dropdown
triggers) picks up the new scale effect — one rule, no per-component work.

## Toasts

`src/components/ui/sonner.tsx` wraps `sonner`; the app-wide config lives in
`src/app/layout.tsx`: `position="top-center"` (moved from the library
default of top-right), plus a `gap` and `duration` tuned for readability.
`globals.css` adds shadow/radius/blur polish on top of Sonner's own
transition — the library's built-in slide+fade is already smooth, so no
custom animation was reinvented, just the visual chrome.

## Route transitions

`src/components/brand/route-transition.tsx` is a full-screen (`fixed
inset-0 z-50`) takeover used at every major auth hand-off:

- Login success → dashboard (`login-form.tsx`)
- OTP verified → create-new-password (`verify-otp-form.tsx`)
- Password reset → login (`create-new-password-form.tsx`)
- Registration submitted → login (`register-form.tsx`)
- Logout → login (`dashboard-shell.tsx`) — copy is exit-flavored ("Signing
  you out," "Redirecting to login"), deliberately not reusing the login
  transition's "Welcome back" copy, which reads backwards on the way out.
  Same session-clearing-order lesson as the password-reset flow applies
  here too: `logout()` (which nulls the auth store's `member`) only fires
  inside `onComplete`, after the transition has already played — clearing
  it earlier would trip `(dashboard)/layout.tsx`'s own guard effect and
  redirect away before the transition finishes, the same bug documented in
  [password-recovery.md](./password-recovery.md#design-decisions).

It renders `<AnimatedLogo>` for a fixed `duration` (default 2200ms) and then
calls `onComplete`, which the caller uses to navigate. The delay is
deliberate, not a spinner-while-waiting: these mutations resolve in under a
second, so without an artificial floor the transition would flash and feel
broken rather than intentional. `duration` is read into a `ref` on mount
(`onCompleteRef`) precisely so a parent re-render with a fresh inline
`onComplete` closure doesn't reset the timer.

`src/hooks/use-minimum-duration.ts` is the analogous primitive for gates
that aren't a fixed one-shot animation but a `ready` boolean that might
already be `true` on mount (e.g. "has the auth store finished hydrating
localStorage") — it holds `false` for at least `minMs` regardless of how
fast `ready` actually resolves.

### `<AnimatedLogo>`

`src/components/brand/animated-logo.tsx` is the shared branded loading
visual — deliberately not a spinner, not dots, and not the word "Loading."
Three concentric diamond paths (the T-Coop mark) draw themselves in via
Framer Motion's `pathLength` animation, staggered, looping; a soft pulsing
glow sits behind it; a status message crossfades between a short rotating
list of phrases ("Preparing your workspace," "Securing your session," …)
passed in via the `messages` prop.

## Loading / splash system

Two separate problems, two separate mechanisms — worth keeping distinct:

**1. "I refreshed the dashboard and the loading state flashed by too fast
to see."** `src/app/(dashboard)/layout.tsx`'s auth guard already needs to
wait for the Zustand store to finish reading `localStorage`
(`hasHydrated`) before it can safely decide "redirect to login" vs. "show
the dashboard" — that wait is usually near-instant, which is the problem:
`useMinimumDuration` floors it, but flooring it at a fixed value everywhere
would double up with the login `<RouteTransition>` (2.2s) that already just
played on the arrival from login, stacking two branded waits back to back.

**2. "The login page's own cold load / refresh has no loading state at
all."** — `src/app/(auth)/layout.tsx` and `src/app/(password-recovery)/layout.tsx`
had nothing playing before the form appeared.

Both are solved by one shared, deliberately simple signal:
`src/lib/app-intro.ts` exports a **plain module-level boolean** —

```ts
let introShown = false;
export function markAppIntroShown() {
  introShown = true;
}
export function hasAppIntroShown() {
  return introShown;
}
```

A plain module variable is the right tool here specifically _because_ of
how it resets: a full page reload re-evaluates every JS module from
scratch, so `introShown` goes back to `false` — exactly the "was this a
real reload?" signal needed. Client-side SPA navigation (`router.push`)
never reloads the document, so the module — and the flag — stays alive
across screens within the same tab session.

- `AppLaunchGate` (`src/components/brand/app-launch-gate.tsx`) wraps the
  `(auth)` and `(password-recovery)` route group layouts. On mount, if
  `!hasAppIntroShown()`, it shows `<AnimatedLogo>` full-screen for a fixed
  2600ms, then reveals children and marks the flag. Any later client-side
  navigation between public auth screens in the same tab sees the flag
  already `true` and renders instantly — confirmed via a real timed browser
  test (~300ms for a second navigation vs. the full ~2.6s+ on cold load).
- The dashboard layout reads `hasAppIntroShown()` **once**, via a
  `useState` initializer, into `needsFullIntro`. If the flag is already
  `true` (the user just came from the login `<RouteTransition>`, which
  calls `markAppIntroShown()` itself right before navigating), the
  dashboard's own gate uses a near-instant 300ms floor. If the flag is
  `false` (a hard reload or a fresh tab landing directly on `/dashboard`
  with a persisted session), it uses a full 5000ms floor — long enough to
  actually register as a deliberate branded loading moment rather than a
  flicker. Measured at ~5.4s end-to-end in a real browser test, matching
  the intent.

If you add a new protected route or a new public entry point, decide which
of these two patterns it needs — don't invent a third timing mechanism.

## Wordmark asset

`<Logo>` (`src/components/brand/logo.tsx`) originally rendered the local
`public/logo-full.svg`. It now points at a hosted PNG on Cloudinary
(`next.config.ts` whitelists `res.cloudinary.com` under
`images.remotePatterns`) after the local SVG was reported to render
incompletely. Both assets share the same design: a green diamond mark plus
a **white** wordmark — meaning `<Logo>` on its own is only safe on
permanently dark/green surfaces.

**Used consistently everywhere now, not just the two brand panels**, by
following one rule: any surface that's already permanently dark/green gets
`<Logo>` as-is; any surface that's theme-reactive (would go white-on-white
in light mode) gets `<Logo>` wrapped in a small `bg-sidebar` chip — the
`--sidebar` token is dark green in both light and dark mode (see
[Theme tokens](#theme-tokens)), so the chip itself never needs to react to
the toggle.

| Location                          | Surface                                 | Treatment                           |
| --------------------------------- | --------------------------------------- | ----------------------------------- |
| `auth-brand-panel.tsx`            | Always brand-green                      | `<Logo>` directly                   |
| `centered-auth-layout.tsx` header | Always brand-green                      | `<Logo>` directly                   |
| `dashboard-sidebar.tsx` header    | Always dark (`bg-sidebar`, both themes) | `<Logo>` directly                   |
| `auth-layout.tsx` mobile header   | Theme-reactive (the form pane)          | `<Logo>` inside a `bg-sidebar` chip |

`<LogoMark>` (the standalone diamond, recolored via `currentColor`) is
still the right choice anywhere only the mark — not the wordmark — belongs,
e.g. the favicon.
