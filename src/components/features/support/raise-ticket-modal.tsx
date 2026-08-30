"use client";

import { useId, useState } from "react";
import { Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TICKET_CATEGORIES, type TicketCategory } from "@/lib/support-data";

export interface RaiseTicketPayload {
  subject: string;
  category: TicketCategory;
  description: string;
}

interface RaiseTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Who this ticket goes to first — just changes the modal's copy, not its behavior. */
  recipientLabel: string;
  busy: boolean;
  onSubmit: (payload: RaiseTicketPayload) => void;
}

export function RaiseTicketModal({
  open,
  onOpenChange,
  recipientLabel,
  busy,
  onSubmit,
}: RaiseTicketModalProps) {
  const subjectId = useId();
  const categoryId = useId();
  const descriptionId = useId();

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory | "">("");
  const [description, setDescription] = useState("");

  const isValid =
    subject.trim().length > 0 && !!category && description.trim().length > 0;

  const reset = () => {
    setSubject("");
    setCategory("");
    setDescription("");
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleSubmit = () => {
    if (!isValid || !category) return;
    onSubmit({
      subject: subject.trim(),
      category,
      description: description.trim(),
    });
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Raise an Issue</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            This goes to {recipientLabel} — they&apos;ll see it here and reply
            or resolve it, and you&apos;ll be notified either way.
          </p>

          <div className="space-y-2">
            <Label htmlFor={subjectId}>Subject</Label>
            <Input
              id={subjectId}
              placeholder="Briefly describe the issue"
              value={subject}
              onChange={(event) => setSubject(event.target.value)}
              disabled={busy}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={categoryId}>Category</Label>
            <Select
              value={category}
              onValueChange={(value) =>
                setCategory((value ?? "") as TicketCategory)
              }
              disabled={busy}
            >
              <SelectTrigger id={categoryId} className="h-11 w-full">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                {TICKET_CATEGORIES.map((option) => (
                  <SelectItem key={option} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={descriptionId}>What&apos;s going on?</Label>
            <Textarea
              id={descriptionId}
              rows={4}
              placeholder="Give as much detail as you can"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              disabled={busy}
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!isValid || busy}
            onClick={handleSubmit}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Submitting…
              </>
            ) : (
              "Submit"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
