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
(including BVN and NIN) genuinely editable once in edit mode.

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
- **BVN and NIN are both editable in edit mode, not permanently locked.**
  An earlier version of this page kept BVN hard-`disabled` to simulate a
  bank-verified, locked field. That's been reversed: the member can now
  edit BVN and NIN like every other field once "Edit" is clicked — both
  still carry a "Verified" badge next to the label as a visual cue, but
  it's cosmetic, not a real block. NIN (National Identification Number)
  is a new field alongside BVN, added to `profileSchema` and
  `ProfileRecord` with the same 11-digit validation. Membership ID stays
  genuinely read-only in both modes (system-assigned, shown as plain
  `<Input disabled>` even inside the edit form) since a member changing
  their own membership ID isn't realistic in either state. "User Access"
  from the reference (a permission level) was dropped entirely rather
  than faked as an editable field — a user editing their own permission
  level isn't realistic, and the mock has nowhere legitimate to enforce
  that boundary; it's represented instead as the read-only role badge in
  the header card.
- **Gender and Country use the shadcn `Select`, not a native `<select>`.**
  This page originally shipped with a hand-styled native `<select>` (an
  older pattern than the `/savings` and `/loans` builds that established
  the shadcn-everywhere standard). Brought in line with the rest of the
  app when this page was reworked — both fields are wired through RHF's
  `Controller` since Base UI's `Select` isn't an uncontrolled native
  element `register()` can attach to directly.
- **Avatar is generated initials, not a photo.** Consistent with every
  other avatar in the app (topbar, recent activities) — see
  [theming-and-motion.md](./theming-and-motion.md#wordmark-asset) for the
  broader "one visual language, no ad-hoc assets" pattern this follows.
  The camera/edit-photo button is present (matching the affordance a real
  profile page would have) but surfaces a "coming soon" toast — see
  [Future Improvements](#future-improvements) for the real-upload plan.
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

## Animations

Deliberately lighter than the auth forms: one gentle fade+slide on the
whole form on mount, not a per-field stagger (documented reasoning already
covered in [dashboard.md](./dashboard.md#animations) — a dense, data-heavy
screen shouldn't make the user wait through a choreographed reveal before
they can start typing). Page-level entrance still comes from the root
`template.tsx` like every route.

## Future Improvements

- **Real photo upload via Cloudinary** is the next planned step — the
  camera button already sits in the right place, it just needs a real
  unsigned upload wired to it instead of the "coming soon" toast.
- BVN/NIN "Verified" badges are hardcoded permanently `true`; once there's
  a real KYC provider, that status (and whether the field should even be
  user-editable after verification) should come from that provider
  instead.
- No confirmation prompt before "Cancel" discards edits — fine for a demo,
  worth adding once real users could lose meaningful unsaved work.
