# Notice Board

## Overview

`/notice-board` and its sub-routes are a new nav item across all three
roles, filling a gap the design didn't cover but the project brief called
for: a place for admins/super admins to broadcast announcements, meeting
notices, and meeting minutes to members and/or admins, and for the people
receiving them to read and reply — genuinely in real time, not just on
refresh.

## Purpose

Let an admin or super admin create a notice (general announcement,
meeting notice with a date, or meeting minutes with a PDF attachment),
choose who gets it (All Members / All Admins / All Members & Admins) and
how (Email / SMS / both — simulated), send it now or schedule it, and
manage what's already been sent (filter, resend, delete). Let anyone who
receives a notice read it, download its attachment, and reply — with
admins able to see every reply as member feedback. And let all of this
update live across open tabs, the way the request specifically asked for
("like a group chat").

## Design Decisions

- **Real-time via the native `storage` event, not a fake poll or a
  claimed-but-unbuilt WebSocket.** This app has no backend — there is
  nowhere to run a WebSocket or Firebase-style server, and inventing one
  would mean a dependency and infrastructure the project doesn't have.
  What it _can_ do honestly is real, browser-native cross-tab sync:
  `useNoticeStore` persists to `localStorage` via zustand's `persist`
  middleware, and every browser fires a `storage` event in every **other**
  open tab (never the tab that made the change) whenever that key is
  written. `src/hooks/use-cross-tab-sync.ts` listens for that event and
  calls `useNoticeStore.persist.rehydrate()`, which re-reads the latest
  state from `localStorage` into that tab's store — no polling, no delay
  beyond the browser's own event dispatch. This is a genuinely real
  mechanism, not a simulation, and it's exactly the shape of "real-time"
  this app can honestly deliver: verified with two real headless-browser
  tabs, in both directions — Tab A creates a notice and Tab B sees it
  appear without any reload or navigation, then Tab B posts a reply and
  Tab A sees it live. See [Known limitation](#known-limitation-single-session-per-browser)
  for the one honest boundary of this approach.
- **This store breaks the "resets on reload" convention every other mock
  store in this app follows — on purpose.** Savings, Loans, and
  Co-operatives all deliberately reset on a full page reload, matching
  the rest of the app's honesty about being a mock. A notice board that
  vanished on refresh, or that couldn't sync across tabs, would directly
  undermine the one thing this feature was asked to prove — so
  `notice.store.ts` is the one store in the app that persists to
  `localStorage` and stays there across reloads. Called out explicitly
  here so it doesn't read as an inconsistency.
- **Notice status is derived, never stored.** A notice doesn't have a
  `status` field that gets mutated by a timer — `getNoticeStatus(notice)`
  simply compares `notice.sendAt` to `Date.now()` on every render. A
  "Send Later" notice is `"Scheduled"` for as long as `sendAt` is in the
  future and becomes `"Sent"` the instant it isn't, with no polling loop
  needed to flip a flag. "Resend" is just `sendAt = now`, which — because
  status is derived — simultaneously re-marks it "Sent" and (via the same
  `storage` event) re-surfaces it as unread for every open recipient tab.
  Members never see a notice before its `sendAt` passes, even if it's
  already sitting in the shared store (`isNoticeVisibleToRole` returns
  `false` for a member on anything still `"Scheduled"`), so scheduling a
  notice doesn't leak the announcement early.
- **Recipient and Medium are both real three-way choices, not two radios
  plus an awkward gap.** The reference showed "All Members" / "All
  Admins" for who receives a notice, and separately "Email" / "SMS" /
  "Both" for how — but the request was explicit that admins should be
  able to send to members only, admins only, _or_ both. Rather than bolt
  a checkbox onto a radio group, both fields are modeled the same way:
  three mutually-exclusive `RadioGroup` options each (`All Members` /
  `All Admins` / `All Members & Admins`, and `Email` / `SMS` / `Email &
SMS`), added via `pnpm dlx shadcn@latest add radio-group` since no
  radio primitive existed in this app yet. Consistent UI for both
  questions, and "send to both" is a first-class option, not an
  afterthought.
- **A real, downloadable attachment — not a filename with no file
  behind it.** "Attach a PDF" implies someone can actually retrieve it
  later, so `src/lib/file-to-data-url.ts` reads the selected file into a
  base64 data URL via `FileReader`, stored on the notice
  (`NoticeAttachment.dataUrl`). The detail page's download link is a
  plain `<a href={dataUrl} download={name}>` — a real, working download,
  since the file's actual bytes live in the URL itself. The honest limit
  that comes with this approach: `localStorage` has a shared ~5-10MB
  per-origin quota, so attachments are capped at 2MB
  (`MAX_ATTACHMENT_BYTES`) with a clear inline error if exceeded, rather
  than silently failing or corrupting the store once the quota is hit.
- **Feedback replies carry the real uploaded profile photo, not just
  initials.** `NoticeReply` gained an optional `authorAvatarUrl`, set from
  `member.avatarUrl` (see [profile-page.md](./profile-page.md) for the
  real Cloudinary upload it comes from) at the moment a reply is posted —
  a snapshot, not a live join, so a reply always shows the photo the
  author had when they wrote it. `ReplyThread` renders a real `next/image`
  avatar whenever one is present, in both the composer and every reply
  bubble, falling back to generated initials only when the author never
  uploaded a photo (seeded demo replies, for instance).
- **The topbar notification bell went from a static, disconnected list to
  the real thing.** `NotificationMenu` previously rendered hardcoded
  `INITIAL_NOTIFICATIONS` from a local `useState` — not wired to anything,
  reset on every reload, identical for every role. It now reads
  `useNoticeStore`, filters through the same `isNoticeVisibleToRole` the
  Notice Board page itself uses, computes unread count from the store's
  `readMarkers`, and subscribes to the same cross-tab sync — so the badge
  count updates live in every open tab the moment a new notice arrives or
  gets read, for every role. `src/lib/notifications-data.ts` (the old
  static seed) was deleted rather than left as dead code once nothing
  imported it anymore.
- **Read state is tracked per signed-in identity, not globally.**
  `readMarkers` is a flat `Record<string, true>` keyed
  `${memberId}:${noticeId}`, so the same shared notice list can show
  "unread" independently for different people (as far as this app's
  single-shared-session architecture allows — see the limitation below).
- **Bulk actions on the management list, matching the reference's
  toolbar layout — not per-row buttons.** The reference's Resend/Delete
  icons sit in the toolbar above the table, next to the Month/Year/Filters
  controls, implying they act on whatever's checked rather than one row
  at a time. `NoticeListTable` follows that: checkboxes select rows,
  Resend/Delete operate on the selection, and Delete opens a real
  confirmation (`AlertDialog`, describing exactly how many notices will
  be removed) before anything happens — following the same
  ask-before-destructive-action standard already established for
  Disable/Activate elsewhere in the app (see
  [co-operatives-page.md](./co-operatives-page.md#design-decisions)).
- **Email/SMS delivery is explicitly labeled as simulated, right in the
  form**, not left for the user to assume — a small line under the Media
  Type options says so directly, matching this app's running honesty
  convention (no backend exists to actually send anything).
- **The "Send Later" time field is a real shadcn time picker, not a
  native `<input type="time">`.** The Date field next to it already opens
  a styled `Calendar` inside a `Popover`; the browser's native time input
  renders completely differently per OS/browser and breaks that visual
  consistency. `src/components/ui/time-picker.tsx` is a new shadcn-style
  primitive — two independently scrollable hour/minute columns
  (`ScrollArea` + `Button`, added via `pnpm dlx shadcn@latest add
scroll-area`) inside the same rounded popover panel as `Calendar`, with
  the same selected-state styling (`bg-primary`/`text-primary-foreground`)
  and auto-scroll-into-view on open. Used the same way `Calendar` is: a
  `Popover`/`PopoverTrigger` button showing the formatted value
  (`formatTimeLabel`, e.g. "2:30 PM") or a placeholder, with the picker
  itself in `PopoverContent`.

## Known limitation: single session per browser

This app's auth session (`useAuthStore`) is persisted to `localStorage`
under one shared key per browser — there is no per-tab session. That
means genuinely testing "an admin's tab and a different member's tab, at
the same time, on two independent logins" isn't something this app's
existing architecture supports: logging into a second identity in one tab
overwrites the session every other tab reads on its next interaction.
This is a pre-existing constraint of the whole app, not something the
Notice Board introduced. The real-time mechanism itself is verified and
works correctly for what the architecture _does_ support: multiple tabs
open under the _same_ signed-in identity (e.g. the Notice Board open in
two tabs at once), which is exactly how the two-tab verification above
was run. Proving true concurrent multi-role sessions live would require a
real backend with per-session auth — out of scope for a backend-less mock.

## Routes

| Route                | Purpose                                                                                                                                                          |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/notice-board`      | Admin/super admin: full management list (filters, bulk Resend/Delete) + "+ Create Notice." Member: a read list of notices addressed to them, unread-highlighted. |
| `/notice-board/new`  | Create a notice — type, title, message, optional meeting date, optional attachment, recipient, medium, send now/later. Admin/super admin only.                   |
| `/notice-board/[id]` | Full notice + attachment download + the reply/feedback thread. Everyone can read and reply; only admin/super admin see Resend/Delete.                            |

## Components

- `src/lib/notice-data.ts` — `Notice`/`NoticeReply` types,
  `getNoticeStatus` (derived status), `isNoticeVisibleToRole`,
  `noticeExcerpt`, seed data.
- `src/store/notice.store.ts` — the one persisted, cross-tab-synced store
  in the app (`notices`, `replies`, `readMarkers`, `addNotice`,
  `deleteNotice`, `resendNotice`, `addReply`, `markRead`).
- `src/hooks/use-cross-tab-sync.ts` — the `storage`-event → `rehydrate()`
  real-time mechanism, reused by the Notice Board pages and the
  notification bell.
- `src/lib/file-to-data-url.ts` — `readFileAsDataUrl`,
  `MAX_ATTACHMENT_BYTES`.
- `src/lib/validations/notice.schema.ts` — `createNoticeSchema` (with
  conditional requirements for meeting date and scheduled send
  date/time), `replySchema`.
- `src/components/features/notice-board/create-notice-form.tsx`,
  `notice-list-table.tsx`, `member-notice-list.tsx`, `reply-thread.tsx`.
- `src/components/layouts/notification-menu.tsx` — rewired to real notice
  data (see Design Decisions).
- `src/components/ui/radio-group.tsx`, `textarea.tsx` — new shadcn
  primitives added for this feature.

## Navigation

Added to all three roles' nav (`dashboard-nav.ts`) with
`href: "/notice-board"` — a super admin, admin, or member can all reach
it, since all three can receive notices and only admin/super_admin get
the management actions.

## Future Improvements

- Attachments are capped at 2MB by the shared `localStorage` quota — a
  real backend with actual file storage would remove that ceiling.
- No real email/SMS delivery, by design for now — see Design Decisions.
- Scheduled notices aren't cancellable independently of Delete (deleting
  a scheduled notice is the only way to stop it going out) — a dedicated
  "Cancel schedule" action would be a reasonable follow-up.
- If this app ever gains a real backend, the cross-tab `storage` event
  mechanism should be replaced with a real subscription (WebSocket/SSE)
  so updates reach every device, not just other tabs on the same browser.
