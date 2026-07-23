# My Profile

## Overview

`/profile` lives inside the `(dashboard)` route group, sharing its auth
guard, shell, and loading gate with `/dashboard` (see
[dashboard.md](./dashboard.md)) — it's the second real page in that group,
not a one-off. Reachable by every role, not just members.

## Purpose

Let the signed-in user view their own KYC-style member details by default
as plain read-only text — not a form waiting to be filled in — and only
switch into an editable form when they deliberately choose to, via an
Edit button. Matches the fields and density of the reference "Member
Details" design, redesigned to look and behave like a real product screen
rather than a static mockup — sectioned, validated, with every field
(including Bank Account and NIN) genuinely editable once in edit mode.

## Design Decisions

- **No stock photo banner.** The reference design had a large decorative
  landscape photo above the card. Modern SaaS profile/settings screens
  (Linear, Notion, Stripe) don't do this — it's decorative weight with no
  information value, and a random stock photo reads as a template, not a
  real product. Dropped in favor of a clean profile header card (avatar,
  name, role badge, email, membership ID) directly above the form
  sections. This is the literal "better presented than the reference"
  request.
- **Sectioned, not one giant grid.** The reference crammed ~13 fields into
  a single undifferentiated two-column grid. Split into four `<Card>`
  sections with headings — Personal Information, Address, Social Links,
  Membership — so the form is scannable rather than a wall of inputs. Same
  fields, same data, better information hierarchy.
- **Read-only by default, an explicit Edit action to change anything.**
  The page loads as plain text — label above value, no inputs anywhere —
  and an "Edit" button (`CardAction` in the Personal Information card
  header) is the only way in. This isn't just visual: `<input>`/`<select>`
  elements literally don't exist in the DOM until edit mode is entered —
  verified in a real browser, not just by reading the JSX, since it's
  easy to accidentally leave a disabled input in place instead of a true
  read-only element. A member landing on this page to check their details
  shouldn't see a wall of editable-looking fields and wonder whether
  typing in one commits anything.
- **The BVN field is now a real Bank Account field, genuinely verified,
  not a cosmetic badge.** Every BVN field in this app was replaced with
  Bank + Account Number + a real "Verify" step — see
  [payments-and-payouts.md](./payments-and-payouts.md) for the full
  design reasoning (bank list, resolve flow, why it exists at all: this
  is where the member's own loan disbursement and savings-withdrawal
  payouts get sent). Unlike the old BVN field's permanent, hardcoded
  "Verified" badge, this one is real: it only shows once "Verify" has
  actually resolved an account name via Paystack, and editing the
  account number/bank afterward clears it, requiring re-verification.
  NIN keeps its original cosmetic "Verified" badge unchanged — only BVN
  was in scope for this change. Membership ID stays
  genuinely read-only in both modes (system-assigned, shown as plain
  `<Input disabled>` even inside the edit form) since a member changing
  their own membership ID isn't realistic in either state. "User Access"
  from the reference (a permission level) was dropped entirely rather
  than faked as an editable field — a user editing their own permission
  level isn't realistic, and the mock has nowhere legitimate to enforce
  that boundary; it's represented instead as the read-only role badge in
  the header card.
- **Gender uses the shadcn `Select`, not a native `<select>`.** This page
  originally shipped with a hand-styled native `<select>` (an older
  pattern than the `/savings` and `/loans` builds that established the
  shadcn-everywhere standard). Brought in line with the rest of the app
  when this page was reworked — wired through RHF's `Controller` since
  Base UI's `Select` isn't an uncontrolled native element `register()`
  can attach to directly.
- **Country/State/City are now a live, cascading `<LocationFields>`, not
  a static country list plus a free-text state input.** Picking a
  country fetches its real states; picking a state fetches its real
  cities — both from a live, keyless API. Shared across every form in
  this app that captures an address, so it's documented once in
  [payments-and-payouts.md](./payments-and-payouts.md#design-decisions)
  rather than repeated per page. `city` is a new required field on
  `profileSchema`/`ProfileRecord` that didn't exist before.
- **Avatar photo upload is real, via Cloudinary — not a "coming soon"
  toast.** The camera button opens a hidden `<input type="file">`
  (PNG/JPEG/WEBP, capped at 5MB client-side), which posts the file as
  `multipart/form-data` to `src/app/api/upload/route.ts`, a Next.js route
  handler that signs and uploads to Cloudinary server-side via the
  `cloudinary` Node SDK (`cloudinary.uploader.upload_stream`, folder
  `t-coop/avatars`) and returns the resulting `secure_url`. The upload
  credentials (`CLOUDINARY_CLOUD_NAME`/`CLOUDINARY_API_KEY`/
  `CLOUDINARY_API_SECRET`) live only in `.env.local` (server-only, no
  `NEXT_PUBLIC_` prefix) — the API secret never reaches the browser,
  unlike an unsigned client-side upload preset. The returned URL is
  stored as `avatarUrl` on `AuthenticatedMember` in the already-persisted
  `useAuthStore`, so both the profile header and the topbar dropdown
  avatar (two independent components reading the same store) update
  immediately and the photo survives a full page reload — this is a real
  upload to a real CDN, not a local object URL or base64 placeholder.
  Falls back to generated initials whenever no `avatarUrl` is set yet,
  consistent with every other avatar in the app until a photo exists — see
  [theming-and-motion.md](./theming-and-motion.md#wordmark-asset) for the
  broader "one visual language, no ad-hoc assets" pattern.
- **Clicking the photo opens it full-size, like tapping a profile picture
  on TikTok or Instagram.** The 80px header avatar is a fixed-size
  thumbnail — once a real photo exists, there was no way to actually see
  it clearly. The avatar is now a real `<button>` (only rendered once
  `avatarUrl` exists; initials aren't clickable, since there's nothing to
  view yet) that opens a shadcn `Dialog` styled as a lightbox: transparent
  popup chrome, a large square `next/image`, and a custom translucent
  close button positioned over the photo itself rather than the default
  dialog chrome, since the usual card background/border would fight with
  an edge-to-edge image. Verified in a real browser that the enlarged
  image is meaningfully bigger than the thumbnail (~380px vs. 80px) and
  that Close actually dismisses it.
- **Save is gated on having unsaved changes; leaving edit mode isn't.**
  "Update Details" stays disabled until the form is dirty
  (`formState.isDirty`) — a save button that's always clickable even with
  nothing changed is a small but real tell that a form isn't fully wired
  up. "Cancel" is only gated on the in-flight save (`busy`), not
  `isDirty`, since — now that edit mode is a distinct state the member
  opted into — "Cancel" is also how they back out of edit mode entirely
  with nothing changed, not only how they discard a change; it resets to
  the last-saved values via RHF's `reset(displayProfile)` and returns to
  the read-only view. Saving does the equivalent: `reset(values)` plus
  updating local `displayProfile` state so the read-only view immediately
  reflects the save without needing a page reload (the mock service
  mutates a module-level object, which isn't itself reactive).
- **Persists in-memory, same honesty as the rest of the mock.** `authService`'s
  sibling here is `src/services/profile.service.ts` —
  `updateProfileData()` (`src/lib/profile-data.ts`) mutates the same kind
  of module-level object `mock-users.ts` uses for password resets, so a
  saved edit is visible if you navigate away and back, but resets on a
  full page reload. No new persistence pattern invented for this page.

## Every place "profile" navigates to

Per the request to make sure this is "completely settled" everywhere it's
referenced:

| Entry point                                      | File                                          | Behavior before this change                     | Behavior now                                                                                         |
| ------------------------------------------------ | --------------------------------------------- | ----------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Sidebar "My Profile" (member role only)          | `src/config/dashboard-nav.ts`                 | No `href` — inert, showed a "coming soon" toast | Real link to `/profile`, highlights active via the sidebar's existing `pathname === item.href` check |
| Topbar profile dropdown "My Profile" (all roles) | `src/components/layouts/dashboard-topbar.tsx` | No `onClick` at all — did nothing               | `onClick={() => router.push("/profile")}`                                                            |

Super admin and admin have no sidebar shortcut to their own profile — that
matches the original nav design (their sidebar item is an org-level view:
"Co-operatives" / "Members Directory"), but they can still reach `/profile`
via the topbar dropdown like everyone else. Confirmed in a real browser for
all three roles: the sidebar link, the topbar dropdown, and direct URL
access.

## Components

- `src/app/(dashboard)/profile/page.tsx` — reads the signed-in `member`
  from `useAuthStore`, loads their mock profile record, renders the two
  pieces below.
- `src/components/features/profile/profile-header-card.tsx` — avatar,
  name, role badge, email, membership ID.
- `src/components/features/profile/profile-details-form.tsx` — renders
  either `ProfileReadOnlyView` (default; plain label/value pairs via
  `ProfileViewField`, four sectioned cards, an "Edit" `CardAction`) or the
  editable form (same four sections, RHF + Zod validation via
  `profileSchema`, `ProfileField`/`ProfileSelect`, Cancel/Update Details),
  toggled by local `editing` state in one component.
- `src/hooks/use-update-profile.ts` — TanStack Query mutation wrapping
  `profileService.updateProfile`.
- `src/lib/profile-data.ts` — mock profile records, one per demo account,
  plus the in-memory update function.
- `src/app/api/upload/route.ts` — server-side route handler that validates
  and signs uploads to Cloudinary for the avatar photo.
- `src/components/features/shared/location-fields.tsx`,
  `src/hooks/use-bank-list.ts`, `src/lib/bank-lookup.ts` — the live
  bank/geo pieces used by the Bank Account and Address fields; see
  [payments-and-payouts.md](./payments-and-payouts.md).

## Animations

Deliberately lighter than the auth forms: one gentle fade+slide on the
whole form on mount, not a per-field stagger (documented reasoning already
covered in [dashboard.md](./dashboard.md#animations) — a dense, data-heavy
screen shouldn't make the user wait through a choreographed reveal before
they can start typing). Page-level entrance still comes from the root
`template.tsx` like every route.

## Future Improvements

- The avatar upload endpoint has no rate limiting or per-user storage
  quota — fine for a demo, worth adding (plus deleting the previous
  Cloudinary asset on re-upload, rather than leaving orphaned images) once
  this is backed by real user accounts.
- NIN's "Verified" badge is still hardcoded permanently `true`; once
  there's a real KYC provider, that status (and whether the field should
  even be user-editable after verification) should come from that
  provider instead. Bank Account's badge is no longer in this category —
  it's real now, see [payments-and-payouts.md](./payments-and-payouts.md).
- No confirmation prompt before "Cancel" discards edits — fine for a demo,
  worth adding once real users could lose meaningful unsaved work.
