# My Profile

## Overview

`/profile` lives inside the `(dashboard)` route group, sharing its auth
guard, shell, and loading gate with `/dashboard` (see
[dashboard.md](./dashboard.md)) — it's the second real page in that group,
not a one-off. Reachable by every role, not just members.

## Purpose

Let the signed-in user view and edit their own KYC-style member details,
matching the fields and density of the reference "Member Details" design,
redesigned to look and behave like a real product screen rather than a
static mockup — sectioned, validated, with fields that are realistically
editable (or not).

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
- **Two fields are realistically read-only, not just styled to look
  editable.** The reference showed every field, including BVN and
  Membership ID, in identical editable-looking inputs. In a real product
  neither would be user-editable: a BVN is bank-verified once and locked
  (shown here with a "Verified" badge next to the label, disabled input);
  a Membership ID is system-assigned. Everything else — name, contact,
  address, social links, guarantor — stays editable. "User Access" from
  the reference (a permission level) was dropped entirely rather than
  faked as an editable field — a user editing their own permission level
  isn't realistic, and the mock has nowhere legitimate to enforce that
  boundary; it's represented instead as the read-only role badge in the
  header card.
- **Avatar is generated initials, not a photo.** Consistent with every
  other avatar in the app (topbar, recent activities) — see
  [theming-and-motion.md](./theming-and-motion.md#wordmark-asset) for the
  broader "one visual language, no ad-hoc assets" pattern this follows.
  The camera/edit-photo button is present (matching the affordance a real
  profile page would have) but surfaces a "coming soon" toast — see
  [Future Improvements](#future-improvements) for the real-upload plan.
- **Save is genuinely gated on having unsaved changes.** Both "Cancel" and
  "Update Details" are disabled until the form is dirty
  (`formState.isDirty`) — a save button that's always clickable even with
  nothing changed is a small but real tell that a form isn't fully wired
  up. "Cancel" resets to the last-saved values via RHF's `reset(profile)`
  rather than navigating away, so the user doesn't lose their place.
  Saving calls `reset(values)` on success too, so the button correctly
  goes back to disabled until the _next_ edit.
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
- `src/components/features/profile/profile-details-form.tsx` — the four
  sectioned cards, RHF + Zod validation (`profileSchema`), Cancel/Save.
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
- Membership ID and BVN are hardcoded read-only; once there's a real KYC
  provider, BVN verification status should come from that provider rather
  than being permanently `true`.
- No confirmation prompt before "Cancel" discards edits — fine for a demo,
  worth adding once real users could lose meaningful unsaved work.
