"use client";

import { useId, useState } from "react";
import { CalendarCheck, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMyMeetingResponse, useRespondToMeeting } from "@/hooks/use-notices";
import { responseBadgeClass, responseLabel } from "@/lib/meeting";
import { cn } from "@/lib/utils";
import {
  MEETING_RESPONSE_LABELS,
  type MeetingAttendanceEntry,
  type MeetingResponse,
} from "@/types/notice";

const OPTIONS: { value: MeetingResponse; description: string }[] = [
  { value: "Physical", description: "I'll be at the venue." },
  { value: "Online", description: "I'll join the meeting online." },
  { value: "NotAttending", description: "I can't make it — tell us why." },
];

/**
 * "Will you attend?" for a member a meeting notice reached. Optional — a member can answer, change
 * their answer until the meeting starts, or ignore it. "Not attending" needs a reason, and it goes
 * straight onto the meeting's attendance register.
 */
export function MeetingRsvpCard({ noticeId }: { noticeId: string }) {
  const { data } = useMyMeetingResponse(noticeId);
  if (!data?.entry) return null;
  return (
    <RsvpCardBody
      // Re-seed the form whenever the saved answer changes.
      key={data.entry.respondedAt ?? "unanswered"}
      noticeId={noticeId}
      entry={data.entry}
      canRespond={data.canRespond}
    />
  );
}

function RsvpCardBody({
  noticeId,
  entry,
  canRespond,
}: {
  noticeId: string;
  entry: MeetingAttendanceEntry;
  canRespond: boolean;
}) {
  const reasonId = useId();
  const respond = useRespondToMeeting(noticeId);
  const [editing, setEditing] = useState(entry.response === null);
  const [choice, setChoice] = useState<MeetingResponse | null>(entry.response);
  const [reason, setReason] = useState(entry.responseReason ?? "");

  const needsReason = choice === "NotAttending";
  const canSubmit = !!choice && (!needsReason || reason.trim().length > 0);

  const handleSubmit = async () => {
    if (!choice || !canSubmit) return;
    try {
      await respond.mutateAsync({
        response: choice,
        reason: needsReason ? reason.trim() : undefined,
      });
      toast.success("Thanks — your response has been saved");
      setEditing(false);
    } catch (error) {
      toast.error("Couldn't save your response", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <CalendarCheck
              className="size-4.5 text-primary"
              aria-hidden="true"
            />
            Will you attend?
          </CardTitle>
          {entry.response ? (
            <Badge
              variant="secondary"
              className={responseBadgeClass(entry.response)}
            >
              {responseLabel(entry.response)}
            </Badge>
          ) : null}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {!editing || !canRespond ? (
          <div className="space-y-3">
            {entry.response ? (
              <p className="text-sm text-foreground">
                You said:{" "}
                <span className="font-medium">
                  {responseLabel(entry.response)}
                </span>
                {entry.responseReason ? (
                  <span className="block pt-1 text-muted-foreground">
                    Reason: {entry.responseReason}
                  </span>
                ) : null}
              </p>
            ) : (
              <p className="text-sm text-muted-foreground">
                You didn&apos;t respond to this meeting.
              </p>
            )}
            {canRespond ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setEditing(true)}
              >
                Change my response
              </Button>
            ) : (
              <p className="text-xs text-muted-foreground">
                This meeting has started, so responses are closed.
              </p>
            )}
          </div>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">
              Optional — let the co-operative know if you&apos;ll be there.
            </p>
            <div
              className="grid gap-3 sm:grid-cols-3"
              role="radiogroup"
              aria-label="Your response"
            >
              {OPTIONS.map((option) => {
                const active = choice === option.value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    role="radio"
                    aria-checked={active}
                    onClick={() => setChoice(option.value)}
                    disabled={respond.isPending}
                    className={cn(
                      "flex items-start gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-muted/50 disabled:opacity-60",
                      active &&
                        "border-primary bg-accent/40 hover:bg-accent/40",
                    )}
                  >
                    <span
                      className={cn(
                        "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-full border border-input",
                        active && "border-primary",
                      )}
                    >
                      {active ? (
                        <span className="size-2 rounded-full bg-primary" />
                      ) : null}
                    </span>
                    <span className="space-y-0.5">
                      <span className="block text-sm font-medium text-foreground">
                        {MEETING_RESPONSE_LABELS[option.value]}
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        {option.description}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>

            {needsReason ? (
              <div className="space-y-2">
                <Label htmlFor={reasonId}>Reason for not attending</Label>
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
              </div>
            ) : null}

            <div className="flex flex-wrap justify-end gap-2">
              {entry.response ? (
                <Button
                  variant="ghost"
                  onClick={() => {
                    setChoice(entry.response);
                    setReason(entry.responseReason ?? "");
                    setEditing(false);
                  }}
                  disabled={respond.isPending}
                >
                  Cancel
                </Button>
              ) : null}
              <Button
                onClick={handleSubmit}
                disabled={!canSubmit || respond.isPending}
              >
                {respond.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Save response
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
