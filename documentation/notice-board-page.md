# Notice Board

## Overview

`/notice-board` and its sub-routes are a nav item across all three roles: a place for
admins/super admins to broadcast announcements, meeting notices, and meeting minutes to members
and/or admins, and for the people receiving them to read and reply. **As of 2026-08-24 this is a
real, backend-driven feature** (`t-coop-backend`'s `notice` module — `Notice`/`NoticeReply`
entities, `NoticeController`, migration `V20__notices.sql`), replacing an earlier version that
lived entirely in a per-browser `localStorage` Zustand store. That earlier version never actually
reached a second user or device — see [Design Decisions](#design-decisions) below for why that
mattered enough to rebuild.

## Purpose

Let an admin or super admin create a notice (general announcement, meeting notice with a date, or
meeting minutes with a PDF/image attachment), choose who gets it (All Members / All Admins / All
Members & Admins) and how (Email / SMS / both — every recipient always gets a real in-app
notification regardless of medium, and Email/SMS trigger real delivery on top of that, see below),
send it now or schedule it, and manage what's already been sent (filter, resend, delete). Let
anyone who receives a notice read it, download its attachment, and reply — with admins able to see
every reply as member feedback.

## Design Decisions

- **Tenant isolation is structural, not a client-side filter.** Every notice explicitly names the
  co-op(s) it targets (`targetCoopIds`, a required, non-empty field with no "empty means everyone"
  fallback). An admin can only ever target their own co-op — `NoticeController` ignores/overrides
  whatever the request body claims for a non-super-admin caller, so this can't be bypassed by a
  crafted request, only a real super admin can address more than one co-op. `Notice#targetsCoop`
  plus the server-side `isVisible` check (mirroring the old `isNoticeVisibleToRole` +
  `noticeTargetsCoop` pair, now enforced once server-side instead of duplicated across pages) is
  the single gate every read/reply/resend/delete goes through.
- **A real, downloadable attachment, hosted, not inlined.** The old base64-in-record approach
  (`dataUrl` field, capped at 2MB by `localStorage`'s own quota) is gone. Attachments now upload
  via a real endpoint (`POST /api/v1/uploads/attachment`, Cloudinary-backed, `folder:
  t-coop/notice-attachments`, `resource_type: auto` so PDFs/Word docs work, not just images) and
  the notice stores a real hosted URL. Same 2MB cap, now enforced server-side (not because of a
  browser storage quota, but as a deliberate limit) — see `UploadController.uploadAttachment`.
- **Email and SMS medium selections trigger real delivery, on top of the always-real in-app
  notification** (built 2026-08-24, after Notifications/Notice Board itself). Email reuses the
  existing Gmail SMTP infra (`EmailService.sendNoticeEmail` — same pattern as OTP/welcome/receipt
  emails). SMS is a new integration, Termii (`SmsService`), chosen for its free trial credit and
  Nigeria-first fit alongside Paystack/OPay; both read their credentials live from Settings →
  Integrations, same convention as the payment gateways, never a static env var. Both are
  best-effort: a delivery failure (or SMS simply not being configured/approved yet) is logged and
  never blocks the notice or its in-app notification — see `NoticeController.fanOutNotifications`.
- **Every notice feeds the real Notifications system, not a bespoke unread-tracking scheme.** The
  old per-notice `readMarkers` (`Record<"memberId:noticeId", true>`, local to one browser) is gone
  entirely. Creating (or resending) a notice fans out through `NotificationService` — "All Admins"
  notifies just the co-op's admin, "All Members" notifies everyone except the admin, "All Members
  & Admins" notifies everyone — and read/unread state lives on those notification rows instead
  (see [Notifications](#see-also)). This also means notification delivery and Notice Board content
  are two independently-readable things: the notification says "you have a new notice" and links
  to it; the notice itself doesn't carry its own separate read state anymore.
- **Notice status is still derived, never stored as a mutable flag** — `Notice#isSent()` compares
  `sendAt` to now, same idea as the old frontend-only `getNoticeStatus`, just computed server-side
  now and returned as `status` in the API response so the frontend doesn't need to re-derive it.
  "Resend" is still just `sendAt = now`.
- **A notice created for "now" notifies immediately; a scheduled one only notifies once resent.**
  There's no minute-granularity dispatcher watching for a scheduled notice's exact moment to
  arrive — matching the honest limitation the original mock design had (no real timer either). If
  this becomes a real complaint, the fix is a scheduled job similar to
  `SubscriptionExpiryReminderJob`, just on a much tighter interval.
- **Recipient and Medium are still both real three-way choices** (`All Members` / `All Admins` /
  `All Members & Admins`, and `Email` / `SMS` / `Email & SMS`) — unchanged from the original
  design, just now validated server-side too (`NoticeCreateRequest`'s `@Pattern` constraints).
- **Feedback replies resolve the author live from the real `Member` table**, not a snapshot —
  `NoticeReplyDto.from(reply, author)` looks up the current name/role/avatar at read time. This is
  a deliberate change from the old snapshot-at-post-time approach: replies are a live conversation
  view, not a historical record, so showing someone's current name/photo is more correct than
  freezing it.
- **Bulk actions on the management list, matching the reference's toolbar layout** — unchanged:
  checkboxes select rows, Resend/Delete operate on the selection via `Promise.all` over the real
  mutations, Delete opens a real confirmation dialog first.

## Routes

| Route                | Purpose                                                                                                                                                          |
| --------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `/notice-board`      | Admin/super admin: full management list (filters, bulk Resend/Delete) + "+ Create Notice." Member: a read list of notices addressed to them.                     |
| `/notice-board/new`  | Create a notice — type, title, message, optional meeting date, optional attachment, recipient, medium, send now/later. Admin/super admin only.                   |
| `/notice-board/[id]` | Full notice + attachment download + the reply/feedback thread. Everyone who can see the notice can reply; only admin/super admin see Resend/Delete.              |
| `/notifications`     | The real notification feed (all types, not just Notice Board) — see [Notifications](#see-also).                                                                  |

## Components

- `src/types/notice.ts` — `Notice`/`NoticeReply`/`NoticeAttachment` types (matching the backend
  DTOs exactly), `noticeExcerpt`.
- `src/services/notice.service.ts` — real backend calls only, no mock fallback (see file comment
  for why: a feature about reaching the right people across devices can't be meaningfully
  simulated offline).
- `src/hooks/use-notices.ts` — `useNotices`, `useNotice`, `useNoticeReplies`,
  `useNoticeMutations` (create/resend/remove/addReply/uploadAttachment).
- `src/lib/validations/notice.schema.ts` — `createNoticeSchema` (conditional requirements for
  meeting date and scheduled send date/time), `replySchema`.
- `src/components/features/notice-board/create-notice-form.tsx`, `notice-list-table.tsx`,
  `member-notice-list.tsx`, `reply-thread.tsx`.

## Navigation

`dashboard-nav.ts` — `href: "/notice-board"`, reachable by all three roles; only admin/super_admin
get the management actions.

## See also

[Notifications](./project-overview.md#backend-integration) — the real, tenant-isolated
notification feed Notice Board posts (and subscription/member/co-op/staff events) all fan into.
Backend: `NotificationController`/`NotificationService` (`com.turontechnologies.tcoop.notification`).

## Future Improvements

- **SMS delivery is built but blocked on a Termii-side step, not code** — the platform's Termii
  account needs an approved Sender ID (Termii dashboard → Sender ID) before texts will actually
  send; until then, SMS/Email & SMS notices still deliver the in-app notification (and the email
  half, for the combined option), the SMS attempt just fails with `SENDER_ID_NOT_APPROVED` and is
  logged, never blocking the rest. See `t-coop-backend/documentation/flows.md`'s Notifications
  section for the full story.
- Scheduled notices aren't cancellable independently of Delete.
- A scheduled notice's notification doesn't fire automatically at its exact scheduled time (see
  Design Decisions) — only on manual resend.
