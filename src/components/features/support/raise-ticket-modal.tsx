"use client";

import { useId, useRef, useState } from "react";
import { Loader2, Paperclip, X } from "lucide-react";
import { toast } from "sonner";
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
import { MAX_ATTACHMENT_BYTES } from "@/lib/file-to-data-url";
import { TICKET_CATEGORIES, type TicketCategory } from "@/lib/support-data";
import { uploadService } from "@/services/upload.service";

export interface RaiseTicketPayload {
  subject: string;
  category: TicketCategory;
  description: string;
  attachmentUrl?: string;
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState<TicketCategory | "">("");
  const [description, setDescription] = useState("");
  const [attachmentFile, setAttachmentFile] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const isValid =
    subject.trim().length > 0 && !!category && description.trim().length > 0;

  const reset = () => {
    setSubject("");
    setCategory("");
    setDescription("");
    setAttachmentFile(null);
    setAttachmentError(null);
  };

  const handleOpenChange = (next: boolean) => {
    if (!next) reset();
    onOpenChange(next);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError(
        `"${file.name}" is too large — attachments are limited to ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)}MB.`,
      );
      return;
    }
    setAttachmentError(null);
    setAttachmentFile(file);
  };

  const handleSubmit = async () => {
    if (!isValid || !category) return;
    try {
      let attachmentUrl: string | undefined;
      if (attachmentFile) {
        setUploading(true);
        attachmentUrl = await uploadService.uploadAttachment(attachmentFile);
      }
      onSubmit({
        subject: subject.trim(),
        category,
        description: description.trim(),
        attachmentUrl,
      });
    } catch (error) {
      toast.error("Couldn't upload attachment", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const isBusy = busy || uploading;

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
              disabled={isBusy}
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
              disabled={isBusy}
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
              disabled={isBusy}
            />
          </div>

          <div className="space-y-2">
            <Label>Attachment (optional)</Label>
            {attachmentFile ? (
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="truncate">{attachmentFile.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setAttachmentFile(null)}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Remove file"
                  disabled={isBusy}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isBusy}
              >
                <Paperclip className="size-3.5" aria-hidden="true" />
                Choose file
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
              className="hidden"
              onChange={handleFileChange}
            />
            {attachmentError ? (
              <p className="text-sm text-destructive">{attachmentError}</p>
            ) : null}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={isBusy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={!isValid || isBusy}
            onClick={handleSubmit}
          >
            {isBusy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                {uploading ? "Uploading…" : "Submitting…"}
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
