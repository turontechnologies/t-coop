# Password Recovery (Forgot Password → OTP → New Password)

## Overview

Three routes under a shared `(password-recovery)` route group, all sharing
`<CenteredAuthLayout>` (full-bleed brand-green background, centered white
card, logo top-left, footer) rather than the split-screen `<AuthLayout>`
used by `/login` — matching the distinct, simpler treatment the reference
designs used for these secondary auth screens:

1. `/forgot-password` — enter a registered email, receive a simulated OTP.
2. `/verify-otp` — enter the code, verify identity.
3. `/create-new-password` — set a new password, redirected back to `/login`.

## Purpose

Give the demo a complete, genuinely working password-reset loop — not a
UI mockup that dead-ends. There's no real backend or email service, so the
"email" is simulated, but everything downstream of that (validation, the
OTP itself, the password change) is real: the new password actually
persists in-memory and works to log in afterward.

## Design Decisions

- **The simulated email is shown, not just claimed.** Rather than a toast
  saying "check your inbox" (which a demo audience can't verify),
  submitting a valid email swaps the form for a "Check your email" screen
  containing `<OtpEmailPreview>` — a redesigned, modern rendering of the
  OTP email with the real generated code visible in it. This directly
  satisfies "I click send and I get my OTP just like the reference email
  image" without pretending to be a real inbox — it's labeled a preview.
- **The reference OTP-email screenshot's content was kept, its visual
  design was not.** Same structure (header banner, greeting, OTP display,
  expiry note, support line) as the reference image, redesigned: the OTP
  renders as individually boxed digits rather than a single string, using
  the app's actual brand gradient instead of the reference's flat green.
  See [theming-and-motion.md](./theming-and-motion.md#theme-tokens) for why
  this component intentionally does _not_ use theme tokens — it's meant to
  represent what a recipient's email client would render, which doesn't
  follow the sender's app theme.
- **OTP verification doubles as re-authentication**, not just a step before
  a password field. Rather than requiring the correct _current_ password
  before showing "enter new password" (a step the reference design doesn't
  actually show), a verified OTP is treated as sufficient proof of identity
  to reach `/create-new-password` — a legitimate, common passwordless-style
  pattern. The current password is still asked for and checked on that
  final screen (matching the reference image), so an old-password check
  exists too, just at the point the reference design put it.
- **Non-persisted session store, on purpose.** `usePasswordResetStore`
  (Zustand, `src/store/password-reset.store.ts`) holds `email` / `otp` /
  `member` in plain memory, not `localStorage`. A real password-reset OTP
  shouldn't survive a browser close any more than it should here; the
  in-memory store means a hard refresh mid-flow correctly drops the session
  and the guarded pages below bounce back to `/forgot-password`.
- **A hard-won ordering bug: don't clear session state before a pending
  navigation completes.** The original `/create-new-password` success
  handler cleared `usePasswordResetStore` immediately, then queued the
  `<RouteTransition>` before navigating to `/login`. But
  `/create-new-password`'s own guard effect watches `member` and redirects
  to `/forgot-password` the instant it goes `null` — so clearing the
  session while still on that page raced the transition and bounced the
  user back to `/forgot-password` mid-animation, right before the intended
  `/login` redirect. Fixed by moving the session clear to `/login`'s own
  mount effect instead (`login-form.tsx`), so it only ever fires once
  we've actually left the guarded page — no shared timing to race. Caught
  by driving the full flow end-to-end in a real browser, not by reading the
  code.

## Flow

```
/forgot-password
  ├─ email not registered → inline field error, stay on page
  └─ email registered → generates a 6-digit OTP, shows <OtpEmailPreview>
        └─ "Continue to verification" → /verify-otp
              ├─ wrong code → shake animation + inline error, stay
              └─ correct code → <RouteTransition> → /create-new-password
                    ├─ wrong current password → inline field error, stay
                    └─ correct current password → password updated
                          in-memory (src/lib/mock-users.ts) →
                          <RouteTransition> → /login
```

`/verify-otp` and `/create-new-password` both guard against direct access:
if there's no active reset session (no `otp` / no `member` in the store),
they redirect to `/forgot-password` rather than rendering a broken form.

"Resend OTP" on `/verify-otp` re-calls the same mock request, generates a
fresh code, and updates the store — it does not re-show the email preview
screen, just a toast confirmation, to keep that secondary action lightweight.

## Components

- `src/app/(password-recovery)/layout.tsx` — wraps every route here in
  `<AppLaunchGate>` (cold-load splash) + `<CenteredAuthLayout>`.
- `src/components/layouts/centered-auth-layout.tsx` — the shared green
  background / centered card / footer shell for all three pages (and
  `/register`).
- `src/components/features/auth/forgot-password-form.tsx` — the email step.
- `src/components/features/auth/otp-email-preview.tsx` — the simulated
  email rendering.
- `src/components/features/auth/verify-otp-form.tsx` — the OTP input step,
  including the shake-on-wrong-code animation and "Resend OTP."
- `src/components/features/auth/create-new-password-form.tsx` — the final
  password-change step; `<PasswordField>` (local to this file) handles the
  show/hide toggle for all three password inputs.
- `src/store/password-reset.store.ts` — the in-memory session.
- `src/hooks/use-forgot-password.ts` — TanStack Query mutation wrapping
  `authService.requestPasswordReset`.
- `src/lib/mock-users.ts` — `verifyMockUserPassword` /
  `updateMockUserPassword`, the two functions that make the reset
  genuinely functional against the three hardcoded demo accounts.

## Animations

Every form in this flow shares the same staggered field-entrance pattern as
`/login` (`src/lib/animations.ts`'s `fieldVariants`), and every hand-off
between steps uses the shared `<RouteTransition>` — see
[theming-and-motion.md](./theming-and-motion.md#route-transitions) for the
shared mechanics. The one addition specific to this flow: a wrong OTP
triggers a horizontal shake on the form (`animate={{ x: [0, -8, 8, -6, 6, 0] }}`,
keyed by an incrementing `shakeKey` so repeated wrong attempts each
re-trigger the shake).

## Future Improvements

- Real email delivery once a backend/mail service exists — the "Demo
  preview" framing and `<OtpEmailPreview>` component can be deleted
  wholesale at that point; everything else in the flow already behaves
  like the real thing.
- Rate-limit OTP requests/attempts once there's a backend to enforce it.
- OTP expiry is stated in the email copy ("expires in 10 minutes") but not
  actually enforced client-side — there's no backend clock to check against
  yet, so this is currently just copy, not a real constraint.
