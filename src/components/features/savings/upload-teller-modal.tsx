"use client";

import { useId, useMemo, useRef, useState } from "react";
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
import { coopMemberFullName, type CoopMember } from "@/lib/coop-data";
import { MAX_ATTACHMENT_BYTES } from "@/lib/file-to-data-url";
import { useCoopSavingsTypes } from "@/hooks/use-coop-savings";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatMoney } from "@/lib/format";
import { uploadService } from "@/services/upload.service";

export interface UploadTellerPayload {
  memberId: string;
  savingsTypeId: string;
  amount: number;
  receiptUrl?: string;
}

interface UploadTellerModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coopId: string | undefined;
  members: CoopMember[];
  busy: boolean;
  onUpload: (payload: UploadTellerPayload) => void;
}

export function UploadTellerModal({
  open,
  onOpenChange,
  coopId,
  members,
  busy,
  onUpload,
}: UploadTellerModalProps) {
  const memberId_ = useId();
  const amountId = useId();
  const typeId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [memberId, setMemberId] = useState("");
  const [amount, setAmount] = useState("");
  const [savingsTypeId, setSavingsTypeId] = useState("");
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptError, setReceiptError] = useState<string | null>(null);
  const currency = useCurrency();

  const { data: types } = useCoopSavingsTypes(coopId);
  const savingsTypes = useMemo(
    () => (types ?? []).filter((type) => type.status === "Active"),
    [types],
  );
  const selectedType = savingsTypes.find((type) => type.id === savingsTypeId);
  const amountNumber = Number(amount);
  const isValid =
    !!memberId &&
    !!selectedType &&
    amountNumber > 0 &&
    amountNumber >= selectedType.min &&
    amountNumber <= selectedType.max;

  const reset = () => {
    setMemberId("");
    setAmount("");
    setSavingsTypeId("");
    setReceiptFile(null);
    setReceiptError(null);
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
      setReceiptError(
        `"${file.name}" is too large — teller uploads are limited to ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)}MB.`,
      );
      return;
    }
    setReceiptError(null);
    setReceiptFile(file);
  };

  const handleUpload = async () => {
    try {
      let receiptUrl: string | undefined;
      if (receiptFile) {
        receiptUrl = await uploadService.uploadAttachment(receiptFile);
      }
      onUpload({ memberId, savingsTypeId, amount: amountNumber, receiptUrl });
    } catch (error) {
      toast.error("Couldn't upload receipt", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload Teller</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={memberId_}>Member</Label>
            <Select
              value={memberId}
              onValueChange={(value) => setMemberId(value ?? "")}
              disabled={busy}
            >
              <SelectTrigger id={memberId_} className="h-11 w-full">
                <SelectValue placeholder="Select member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((member) => (
                  <SelectItem key={member.id} value={member.id}>
                    {coopMemberFullName(member)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor={amountId}>Savings Amount</Label>
            <Input
              id={amountId}
              type="number"
              inputMode="numeric"
              placeholder="Enter amount"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              disabled={busy}
              className="h-11"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor={typeId}>Savings Type</Label>
            <Select
              value={savingsTypeId}
              onValueChange={(value) => setSavingsTypeId(value ?? "")}
              disabled={busy}
            >
              <SelectTrigger id={typeId} className="h-11 w-full">
                <SelectValue placeholder="Select savings type" />
              </SelectTrigger>
              <SelectContent>
                {savingsTypes.map((type) => (
                  <SelectItem key={type.id} value={type.id}>
                    {type.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedType ? (
              <p className="text-xs text-muted-foreground">
                Save between {formatMoney(selectedType.min, currency)} and{" "}
                {formatMoney(selectedType.max, currency)}
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Upload (teller/receipt, optional)</Label>
            {receiptFile ? (
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="truncate">{receiptFile.name}</span>
                </span>
                <button
                  type="button"
                  onClick={() => setReceiptFile(null)}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Remove file"
                  disabled={busy}
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
                disabled={busy}
              >
                <Paperclip className="size-3.5" aria-hidden="true" />
                Choose file
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
            {receiptError ? (
              <p className="text-sm text-destructive">{receiptError}</p>
            ) : null}
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
            onClick={handleUpload}
          >
            {busy ? (
              <>
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                Uploading…
              </>
            ) : (
              "Upload"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
