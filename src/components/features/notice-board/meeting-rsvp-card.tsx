"use client";

import { useId, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  CalendarCheck,
  Loader2,
  MapPin,
  MonitorSmartphone,
  Video,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useCheckIn,
  useMyMeetingResponse,
  useRespondToMeeting,
} from "@/hooks/use-notices";
import {
  formatClock,
  formatMeetingWhen,
  meetingPhase,
  responseLabel,
  useNow,
} from "@/lib/meeting";
import { cn } from "@/lib/utils";
import {
  MEETING_RESPONSE_LABELS,
  type CheckInMode,
  type MeetingResponse,
  type MyMeetingResponse,
} from "@/types/notice";

const EASE = [0.16, 1, 0.3, 1] as const;

const RSVP_OPTIONS: { value: MeetingResponse; icon: typeof MapPin }[] = [
  { value: "Physical", icon: MapPin },
  { value: "Online", icon: Video },
  { value: "NotAttending", icon: XCircle },
];

/** A toggle button in the style of the RSVP and check-in rows. */
function ChoiceButton({
  pressed,
  disabled,
  icon: Icon,
  children,
  onClick,
}: {
  pressed: boolean;
  disabled?: boolean;
  icon: typeof MapPin;
  children: React.ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex h-11 items-center gap-2 rounded-xl border px-4 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-60",
        pressed
          ? "border-primary/50 bg-primary/10 text-primary shadow-card dark:text-emerald-300"
          : "border-border bg-card text-foreground hover:border-foreground/20 hover:bg-muted/60",
      )}
    >
      <Icon className="size-4" aria-hidden="true" />
      {children}
    </button>
  );
}

/**
 * "Will you attend?" for a member a meeting notice reached. Before the meeting they answer (in
 * person / online / not attending with a reason) and can change it until it starts. Once it starts
 * they check themselves in — in person or online — until 30 minutes before it ends. An officer
 * approves the check-in; only then does it count as attendance.
 */
export function MeetingRsvpCard({
  noticeId,
  meetingDate,
  meetingTime,
}: {
  noticeId: string;
  meetingDate?: string | null;
  meetingTime?: string | null;
}) {
  const { data } = useMyMeetingResponse(noticeId);
  const now = useNow();
  if (!data?.entry) return null;
  const phase = meetingPhase(data.window, now);
  const entry = data.entry;

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h3 className="flex items-center gap-2.5 text-base font-semibold tracking-tight text-foreground">
            <CalendarCheck
              className="size-5 text-primary dark:text-emerald-300"
              aria-hidden="true"
            />
            Will you attend?
          </h3>
          {entry.response ? (
            <span
              className={cn(
                "rounded-full px-3 py-1 text-xs font-semibold",
                entry.response === "NotAttending"
                  ? "bg-muted text-muted-foreground"
                  : "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
              )}
            >
              {responseLabel(entry.response)}
            </span>
          ) : null}
        </div>

        {phase === "before" && data.canRespond ? (
          <RsvpChoices
            key={entry.respondedAt ?? "unanswered"}
            noticeId={noticeId}
            data={data}
            when={formatMeetingWhen(meetingDate, meetingTime)}
          />
        ) : (
          <div className="space-y-1.5">
            <p className="text-sm text-foreground">
              {entry.response ? (
                <>
                  You said:{" "}
                  <span className="font-semibold">
                    {responseLabel(entry.response)}
                  </span>
                </>
              ) : (
                "You didn't respond."
              )}
            </p>
            <p className="text-sm text-muted-foreground">
              This meeting has started, so responses are closed.
            </p>
          </div>
        )}

        {phase !== "before" ? (
          <CheckInSection noticeId={noticeId} data={data} phase={phase} />
        ) : null}
      </CardContent>
    </Card>
  );
}

function RsvpChoices({
  noticeId,
  data,
  when,
}: {
  noticeId: string;
  data: MyMeetingResponse;
  when: string;
}) {
  const entry = data.entry!;
  const reasonId = useId();
  const respond = useRespondToMeeting(noticeId);
  const [apologising, setApologising] = useState(false);
  const [reason, setReason] = useState(entry.responseReason ?? "");

  const save = async (response: MeetingResponse, why?: string) => {
    try {
      await respond.mutateAsync({ response, reason: why });
      toast.success(`Saved: ${MEETING_RESPONSE_LABELS[response]}`);
      setApologising(false);
    } catch (error) {
      toast.error("Couldn't save your answer", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <div className="space-y-3">
      <div
        className="flex flex-wrap gap-2.5"
        role="group"
        aria-label="Your answer"
      >
        {RSVP_OPTIONS.map((option) => (
          <ChoiceButton
            key={option.value}
            icon={option.icon}
            pressed={
              option.value === "NotAttending"
                ? apologising || entry.response === "NotAttending"
                : !apologising && entry.response === option.value
            }
            disabled={respond.isPending}
            onClick={() =>
              option.value === "NotAttending"
                ? setApologising(true)
                : save(option.value)
            }
          >
            {MEETING_RESPONSE_LABELS[option.value]}
          </ChoiceButton>
        ))}
      </div>

      <AnimatePresence initial={false}>
        {apologising ? (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.25, ease: EASE }}
            className="overflow-hidden"
          >
            <div className="space-y-2 pt-1">
              <Label htmlFor={reasonId}>Why can&apos;t you attend?</Label>
              <Textarea
                id={reasonId}
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                maxLength={500}
                rows={3}
                placeholder="e.g. I'll be travelling that day"
                disabled={respond.isPending}
              />
              <p className="text-xs text-muted-foreground">
                This is recorded on the meeting&apos;s attendance as your
                apology.
              </p>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  onClick={() => setApologising(false)}
                  disabled={respond.isPending}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => save("NotAttending", reason.trim())}
                  disabled={!reason.trim() || respond.isPending}
                >
                  {respond.isPending ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : null}
                  Send apology
                </Button>
              </div>
            </div>
          </motion.div>
        ) : null}
      </AnimatePresence>

      <p className="text-sm text-muted-foreground">
        Optional. You can change your answer until the meeting starts on {when}.
      </p>
    </div>
  );
}

function CheckInSection({
  noticeId,
  data,
  phase,
}: {
  noticeId: string;
  data: MyMeetingResponse;
  phase: "checkin" | "approvals" | "after";
}) {
  const entry = data.entry!;
  const checkIn = useCheckIn(noticeId);
  const reviewed = entry.attendance !== null && !entry.attendanceAuto;
  const canCheckIn = data.canCheckIn && phase === "checkin" && !reviewed;

  const submit = async (mode: CheckInMode) => {
    try {
      await checkIn.mutateAsync(mode);
      toast.success(
        `Checked in ${mode === "Online" ? "online" : "in person"}. An admin will confirm it.`,
      );
    } catch (error) {
      toast.error("Couldn't check you in", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const approved =
    reviewed &&
    entry.checkInMode !== null &&
    entry.attendance ===
      (entry.checkInMode === "Online" ? "PresentOnline" : "Present");

  let note: string;
  if (canCheckIn) {
    note = `Check-in closes at ${formatClock(data.window.checkInClosesAt)}. ${
      entry.checkInMode
        ? "You can change this until an admin confirms it."
        : "An admin confirms your check-in."
    }`;
  } else if (reviewed) {
    note =
      "An admin has recorded your attendance. Speak to them if something's wrong.";
  } else if (entry.checkInMode) {
    note = "Check-in has closed. An admin will confirm your attendance.";
  } else {
    note =
      phase === "after"
        ? "Check-in closed before the meeting ended. Speak to an admin if you attended."
        : "Check-in closed 30 minutes before the end of the meeting. Speak to an admin if you're here.";
  }

  return (
    <div className="space-y-3 border-t border-border pt-5">
      <p className="text-sm font-semibold text-foreground">
        Mark your attendance
      </p>

      {entry.checkInMode ? (
        <p className="flex flex-wrap items-center gap-2 text-sm text-foreground">
          <span>
            You checked in{" "}
            <span className="font-semibold">
              {entry.checkInMode === "Online" ? "online" : "in person"}
            </span>{" "}
            at {formatClock(entry.checkedInAt)}.
          </span>
          <span
            className={cn(
              "rounded-full px-2.5 py-0.5 text-xs font-semibold",
              approved
                ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300"
                : reviewed
                  ? "bg-rose-100 text-rose-700 dark:bg-rose-500/15 dark:text-rose-300"
                  : "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
            )}
          >
            {approved
              ? "Confirmed"
              : reviewed
                ? "Not approved"
                : "Awaiting confirmation"}
          </span>
        </p>
      ) : null}

      {canCheckIn ? (
        <div
          className="flex flex-wrap gap-2.5"
          role="group"
          aria-label="Check in"
        >
          <ChoiceButton
            icon={MapPin}
            pressed={entry.checkInMode === "InPerson"}
            disabled={checkIn.isPending}
            onClick={() => submit("InPerson")}
          >
            I&apos;m here in person
          </ChoiceButton>
          <ChoiceButton
            icon={MonitorSmartphone}
            pressed={entry.checkInMode === "Online"}
            disabled={checkIn.isPending}
            onClick={() => submit("Online")}
          >
            I&apos;m here online
          </ChoiceButton>
        </div>
      ) : null}

      <p className="text-sm text-muted-foreground">{note}</p>
    </div>
  );
}
