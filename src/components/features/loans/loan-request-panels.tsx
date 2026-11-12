"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  BadgeCheck,
  Banknote,
  Check,
  FileText,
  Landmark,
  Loader2,
  Lock,
  Paperclip,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { useBankList } from "@/hooks/use-bank-list";
import { useAutoVerifyBankAccount } from "@/hooks/use-auto-verify-bank-account";
import { useDisburseLoan, useRespondToLoanOffer } from "@/hooks/use-loans-self";
import type { CoopLoanRecord } from "@/lib/coop-data";
import { formatDateLong, formatMoney } from "@/lib/format";
import { computeLoanTerms, type LoanTypeDef } from "@/lib/loans-data";
import type { LoanApprovalStatus } from "@/services/loan-self.service";
import { uploadService } from "@/services/upload.service";
import { cn } from "@/lib/utils";
import { useFormatMemberId } from "@/components/features/shared/member-id";

const digits = (value: string) => Number(value.replace(/[^\d]/g, "")) || 0;
const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/** Four figures in a tinted strip: monthly, period, total, interest. */
export function TermsPreview({
  amount,
  months,
  loanType,
  currency,
}: {
  amount: number;
  months: number;
  loanType: LoanTypeDef | undefined;
  currency: string;
}) {
  if (!loanType || amount <= 0 || months <= 0) return null;
  const terms = computeLoanTerms(loanType, amount, months);
  const items = [
    ["Monthly repayment", formatMoney(terms.monthlyRepayment, currency)],
    ["For", plural(months, "month")],
    ["Total to repay", formatMoney(terms.totalRepayment, currency)],
    ["Interest", formatMoney(terms.totalInterest, currency)],
  ];
  return (
    <div className="grid grid-cols-2 gap-3 rounded-xl border border-border bg-muted/40 px-4 py-3.5 sm:grid-cols-4">
      {items.map(([label, value]) => (
        <div key={label}>
          <span className="block text-xs font-semibold text-muted-foreground">
            {label}
          </span>
          <span className="text-sm font-bold text-foreground tabular-nums">
            {value}
          </span>
        </div>
      ))}
    </div>
  );
}

/* ─────────────────────────────── Steps ─────────────────────────────── */

type StepState = "done" | "current" | "rejected" | "future";

function StepDot({ state }: { state: StepState }) {
  return (
    <span
      className={cn(
        "mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full border-2",
        state === "done" && "border-emerald-600 bg-emerald-600 text-white",
        state === "rejected" &&
          "border-destructive bg-destructive text-destructive-foreground",
        state === "current" &&
          "border-primary shadow-[inset_0_0_0_4px_var(--card),inset_0_0_0_12px_var(--primary)]",
        state === "future" && "border-border",
      )}
    >
      {state === "done" ? (
        <Check className="size-3.5" strokeWidth={3} aria-hidden="true" />
      ) : state === "rejected" ? (
        <X className="size-3.5" strokeWidth={3} aria-hidden="true" />
      ) : null}
    </span>
  );
}

/**
 * Committee member 1 → … → last, then the borrower's answer, then disbursement — each with who
 * acted, when, and the terms they settled on.
 */
export function ApprovalSteps({
  approvals,
  record,
  currency,
}: {
  approvals: LoanApprovalStatus;
  record: CoopLoanRecord;
  currency: string;
}) {
  const rejection = approvals.trail.find((d) => d.decision === "Rejected");
  const decisionAt = (position: number) =>
    approvals.trail.find(
      (d) => d.position === position && d.decision === "Approved",
    );
  const terms = (amount: number | null, months: number | null) =>
    amount != null
      ? `${formatMoney(amount, currency)} over ${plural(months ?? record.durationMonths, "month")}`
      : null;

  const rows: {
    key: string;
    title: string;
    state: StepState;
    lines: (string | null)[];
    accent?: string | null;
    note?: string | null;
  }[] = approvals.chain.map((step) => {
    const done = decisionAt(step.position);
    if (done) {
      const changes: string[] = [];
      if (
        done.previousAmount != null &&
        done.suggestedAmount != null &&
        done.previousAmount !== done.suggestedAmount
      )
        changes.push(
          `amount ${formatMoney(done.previousAmount, currency)} → ${formatMoney(done.suggestedAmount, currency)}`,
        );
      if (
        done.previousMonths != null &&
        done.suggestedMonths != null &&
        done.previousMonths !== done.suggestedMonths
      )
        changes.push(
          `period ${done.previousMonths} → ${plural(done.suggestedMonths, "month")}`,
        );
      return {
        key: `s${step.position}`,
        title: step.title,
        state: "done",
        lines: [
          `Approved by ${done.memberName}${done.covering ? " (admin, covering)" : ""} · ${formatDateLong(new Date(done.actedAt))}`,
          terms(done.suggestedAmount, done.suggestedMonths),
        ],
        accent: changes.length ? `Changed ${changes.join(", ")}` : null,
        note: done.note,
      };
    }
    if (
      rejection &&
      (rejection.position === step.position ||
        (approvals.currentStep === step.position && !rejection.position))
    ) {
      return {
        key: `s${step.position}`,
        title: step.title,
        state: "rejected",
        lines: [
          `Rejected by ${rejection.memberName} · ${formatDateLong(new Date(rejection.actedAt))}`,
        ],
        note: rejection.note,
      };
    }
    const current =
      approvals.stage === "Approval" && approvals.currentStep === step.position;
    return {
      key: `s${step.position}`,
      title: step.title,
      state: current ? "current" : "future",
      lines: [
        current
          ? `Waiting for ${step.memberName}`
          : approvals.stage === "Guarantors" && step.position === 1
            ? `${step.memberName} · starts once the guarantors accept`
            : step.memberName,
      ],
    };
  });

  const accepted = record.offerRespondedAt && record.status !== "Declined";
  rows.push({
    key: "borrower",
    title: "Borrower accepts",
    state:
      record.status === "Declined"
        ? "rejected"
        : accepted
          ? "done"
          : approvals.stage === "Acceptance"
            ? "current"
            : "future",
    lines: [
      record.status === "Declined"
        ? `${record.memberName} declined the offer`
        : accepted
          ? `${record.memberName} accepted · ${formatDateLong(new Date(record.offerRespondedAt as string))}`
          : approvals.stage === "Acceptance"
            ? `Waiting for ${record.memberName} to accept ${terms(record.amount, record.durationMonths)}`
            : `${record.memberName} accepts the approved terms and picks the account to be paid into`,
      accepted && record.payoutAccountName
        ? `Pays into ${record.payoutAccountName}${record.payoutBankName ? ` · ${record.payoutBankName}` : ""}`
        : null,
    ],
  });
  rows.push({
    key: "disbursement",
    title: "Disbursement",
    state: record.disbursedAt
      ? "done"
      : approvals.stage === "Disbursement"
        ? "current"
        : "future",
    lines: [
      record.disbursedAt
        ? `Paid out${record.disbursedByName ? ` by ${record.disbursedByName}` : ""} · ${record.disbursementMethod === "Cheque" ? "Cheque" : "Online transfer"} · ${formatDateLong(new Date(record.disbursedAt))}`
        : approvals.stage === "Disbursement"
          ? `Ready to pay out ${formatMoney(record.amount, currency)} over ${plural(record.durationMonths, "month")}`
          : "An officer pays the loan out online or by cheque",
      record.disbursedAt && record.disbursedAmount != null
        ? `${formatMoney(record.disbursedAmount, currency)}${record.disbursementReference ? ` · Ref ${record.disbursementReference}` : ""}`
        : null,
    ],
  });

  return (
    <Card>
      <CardContent className="space-y-5">
        <h3 className="text-lg font-bold text-foreground">Approvals</h3>
        <ol className="space-y-5">
          {rows.map((row) => (
            <li key={row.key} className="flex items-start gap-3.5">
              <StepDot state={row.state} />
              <div className="min-w-0 space-y-0.5">
                <p className="font-bold text-foreground">{row.title}</p>
                {row.lines.filter(Boolean).map((line, i) => (
                  <p
                    key={i}
                    className={cn(
                      "text-sm",
                      i === 1
                        ? "font-semibold text-foreground"
                        : "text-muted-foreground",
                    )}
                  >
                    {line}
                  </p>
                ))}
                {row.accent ? (
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    {row.accent}
                  </p>
                ) : null}
                {row.note ? (
                  <p className="text-sm text-foreground italic">
                    &ldquo;{row.note}&rdquo;
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>
      </CardContent>
    </Card>
  );
}

/* ─────────────────────────────── Approve ─────────────────────────────── */

function LockedInput({ value, suffix }: { value: string; suffix?: string }) {
  return (
    <div className="relative">
      <Input
        value={value}
        readOnly
        tabIndex={-1}
        aria-readonly="true"
        className="cursor-not-allowed border-dashed bg-muted/60 pr-10 text-muted-foreground"
      />
      <Lock
        className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 text-muted-foreground"
        aria-hidden="true"
      />
      {suffix ? <span className="sr-only">{suffix}</span> : null}
    </div>
  );
}

/**
 * A committee member settles on an amount (never more than was asked for) and a repayment period
 * (never longer than the loan type allows). The last approver's figures become the offer.
 */
export function ApproveLoanDialog({
  open,
  onOpenChange,
  record,
  approvals,
  loanType,
  currency,
  busy,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: CoopLoanRecord;
  approvals: LoanApprovalStatus;
  loanType: LoanTypeDef | undefined;
  currency: string;
  busy: boolean;
  onConfirm: (amount: number, months: number, note: string) => void;
}) {
  const amountId = useId();
  const monthsId = useId();
  const noteId = useId();
  const requested = record.requestedAmount ?? record.amount;
  const requestedMonths = record.requestedMonths ?? record.durationMonths;
  const [amountText, setAmountText] = useState("");
  const [monthsText, setMonthsText] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    if (!open) return;
    setAmountText(record.amount.toLocaleString("en-NG"));
    setMonthsText(String(record.durationMonths));
    setNote("");
  }, [open, record.amount, record.durationMonths]);

  const amount = digits(amountText);
  const months = Number(monthsText) || 0;
  const amountError = !amount
    ? "Enter the amount you're approving."
    : amount > requested
      ? `Can't be more than the ${formatMoney(requested, currency)} requested.`
      : approvals.minAmount > 0 && amount < approvals.minAmount
        ? `The smallest loan is ${formatMoney(approvals.minAmount, currency)}.`
        : null;
  const monthsError =
    !months || months < 1
      ? "Enter a repayment period in months."
      : !Number.isInteger(months)
        ? "Use whole months."
        : months > approvals.maxMonths
          ? `The longest period for this loan type is ${plural(approvals.maxMonths, "month")}.`
          : null;
  const ok = !amountError && !monthsError;
  const step = approvals.chain.find(
    (s) => s.position === approvals.currentStep,
  );
  const earlierChange =
    record.amount !== requested || record.durationMonths !== requestedMonths;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{step?.title ?? "Committee"} approval</DialogTitle>
          <DialogDescription>
            {approvals.actingAs && approvals.actingAs !== step?.title
              ? `${approvals.actingAs} · `
              : ""}
            {record.memberName}, {record.loanType}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Requested amount</Label>
              <LockedInput value={formatMoney(requested, currency)} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={amountId}>Suggested amount</Label>
              <div className="relative">
                <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-semibold text-muted-foreground">
                  ₦
                </span>
                <Input
                  id={amountId}
                  inputMode="numeric"
                  autoComplete="off"
                  className="pl-8"
                  value={amountText}
                  aria-invalid={!!amountError}
                  onChange={(e) => setAmountText(e.target.value)}
                  onBlur={() =>
                    amount && setAmountText(amount.toLocaleString("en-NG"))
                  }
                />
              </div>
              {amountError ? (
                <p className="text-sm font-medium text-destructive">
                  {amountError}
                </p>
              ) : null}
            </div>
            <div className="space-y-2">
              <Label>Requested period</Label>
              <LockedInput value={plural(requestedMonths, "month")} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={monthsId}>Suggested period</Label>
              <div className="relative">
                <Input
                  id={monthsId}
                  type="number"
                  min={1}
                  max={approvals.maxMonths}
                  step={1}
                  inputMode="numeric"
                  className="pr-20"
                  value={monthsText}
                  aria-invalid={!!monthsError}
                  onChange={(e) => setMonthsText(e.target.value)}
                />
                <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">
                  months
                </span>
              </div>
              {monthsError ? (
                <p className="text-sm font-medium text-destructive">
                  {monthsError}
                </p>
              ) : (
                <p className="text-xs text-muted-foreground">
                  Up to {plural(approvals.maxMonths, "month")} for this loan
                  type.
                </p>
              )}
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            {earlierChange
              ? `An earlier approver suggested ${formatMoney(record.amount, currency)} over ${plural(record.durationMonths, "month")}. You can change it again.`
              : "The requested figures are what the member asked for and can't be changed."}
          </p>
          {ok ? (
            <TermsPreview
              amount={amount}
              months={months}
              loanType={loanType}
              currency={currency}
            />
          ) : null}
          <div className="space-y-2">
            <Label htmlFor={noteId}>
              Notes{" "}
              <span className="font-normal text-muted-foreground">
                (optional)
              </span>
            </Label>
            <Textarea
              id={noteId}
              rows={3}
              maxLength={1000}
              placeholder="e.g. Reduced to match their repayment capacity"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          {approvals.finalStep ? (
            <p className="flex items-start gap-2 rounded-xl bg-primary/10 px-3.5 py-3 text-sm text-foreground">
              <BadgeCheck
                className="mt-0.5 size-4 shrink-0 text-primary dark:text-emerald-300"
                aria-hidden="true"
              />
              You&apos;re the last approver. These become the approved terms,
              and {record.memberName} is asked to accept them.
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            disabled={!ok || busy}
            onClick={() => onConfirm(amount, months, note.trim())}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            {ok
              ? `Approve ${formatMoney(amount, currency)} over ${plural(months, "month")}`
              : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────── Borrower's offer ─────────────────────────────── */

/**
 * The approved terms, for the borrower to accept or decline. Accepting asks where the money goes:
 * their registered account, or another account in their own registered name.
 */
export function LoanOfferCard({
  coopId,
  record,
  approvals,
  currency,
}: {
  coopId: string;
  record: CoopLoanRecord;
  approvals: LoanApprovalStatus;
  currency: string;
}) {
  const respond = useRespondToLoanOffer(coopId);
  const [acceptOpen, setAcceptOpen] = useState(false);
  const [declineOpen, setDeclineOpen] = useState(false);
  const [reason, setReason] = useState("");
  const requested = record.requestedAmount ?? record.amount;
  const requestedMonths = record.requestedMonths ?? record.durationMonths;
  const changed =
    requested !== record.amount || requestedMonths !== record.durationMonths;

  const decline = async () => {
    try {
      await respond.mutateAsync({
        loanId: record.id,
        decision: "Declined",
        reason: reason.trim() || undefined,
      });
      setDeclineOpen(false);
      toast.success("You declined the loan offer");
    } catch (error) {
      toast.error("Couldn't decline", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const facts = [
    ["Approved amount", formatMoney(record.amount, currency)],
    ["Repayment period", plural(record.durationMonths, "month")],
    ["Monthly repayment", formatMoney(record.monthlyRepayment, currency)],
    ["Total to repay", formatMoney(record.totalRepayment, currency)],
  ];

  return (
    <Card className="border-primary/40 ring-4 ring-primary/10">
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-lg font-bold text-foreground">
              <BadgeCheck
                className="size-5 text-primary dark:text-emerald-300"
                aria-hidden="true"
              />
              Your loan was approved
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Check the terms the committee approved, then accept or decline.
            </p>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {facts.map(([label, value]) => (
            <div key={label}>
              <dt className="text-sm text-muted-foreground">{label}</dt>
              <dd className="text-lg font-bold text-foreground tabular-nums">
                {value}
              </dd>
            </div>
          ))}
        </dl>
        {changed ? (
          <p className="rounded-xl bg-amber-50 px-3.5 py-3 text-sm text-foreground dark:bg-amber-500/10">
            You asked for {formatMoney(requested, currency)} over{" "}
            {plural(requestedMonths, "month")}. The committee approved{" "}
            {formatMoney(record.amount, currency)} over{" "}
            {plural(record.durationMonths, "month")}.
          </p>
        ) : null}
        {approvals.netDisbursement != null &&
        approvals.netDisbursement !== record.amount ? (
          <p className="text-sm text-muted-foreground">
            You&apos;ll receive{" "}
            <span className="font-semibold text-foreground">
              {formatMoney(approvals.netDisbursement, currency)}
            </span>{" "}
            after loan charges, and repay the full approved amount.
          </p>
        ) : null}
        <div className="flex flex-wrap justify-end gap-2.5">
          <Button
            variant="outline"
            onClick={() => setDeclineOpen(true)}
            disabled={respond.isPending}
          >
            Decline
          </Button>
          <Button
            onClick={() => setAcceptOpen(true)}
            disabled={respond.isPending}
          >
            <Check className="size-4" aria-hidden="true" />
            Accept and choose account
          </Button>
        </div>
      </CardContent>

      <AcceptOfferDialog
        open={acceptOpen}
        onOpenChange={setAcceptOpen}
        record={record}
        approvals={approvals}
        currency={currency}
        coopId={coopId}
      />

      <Dialog open={declineOpen} onOpenChange={setDeclineOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Decline this loan?</DialogTitle>
            <DialogDescription>
              The loan won&apos;t be paid out. You can apply again later.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            rows={3}
            maxLength={1000}
            placeholder="Reason (optional)"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeclineOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={decline}
              disabled={respond.isPending}
            >
              {respond.isPending ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : null}
              Decline loan
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}

function AcceptOfferDialog({
  open,
  onOpenChange,
  record,
  approvals,
  currency,
  coopId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: CoopLoanRecord;
  approvals: LoanApprovalStatus;
  currency: string;
  coopId: string;
}) {
  const respond = useRespondToLoanOffer(coopId);
  const { banks, loading: banksLoading } = useBankList();
  const registered = approvals.registeredAccount;
  const [choice, setChoice] = useState<"Registered" | "Other">(
    registered ? "Registered" : "Other",
  );
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [verifyError, setVerifyError] = useState<string | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const bankFieldId = useId();
  const numberId = useId();
  const nameId = useId();

  const { verifying } = useAutoVerifyBankAccount({
    bankCode: choice === "Other" ? bankCode : undefined,
    accountNumber: choice === "Other" ? accountNumber : undefined,
    onVerified: (name) => {
      setAccountName(name);
      setVerifyError(null);
    },
    onError: (message) => setVerifyError(message),
  });

  const bankName = (code: string) =>
    banks.find((bank) => bank.code === code)?.name;

  const ready =
    choice === "Registered"
      ? !!registered
      : !!bankCode && accountNumber.length === 10 && !!accountName.trim();

  const submit = async () => {
    setProblem(null);
    try {
      await respond.mutateAsync({
        loanId: record.id,
        decision: "Accepted",
        accountType: choice,
        ...(choice === "Registered"
          ? { bankName: registered ? bankName(registered.bankCode) : undefined }
          : {
              bankCode,
              bankName: bankName(bankCode),
              accountNumber,
              accountName: accountName.trim(),
            }),
      });
      onOpenChange(false);
      toast.success("Loan accepted", {
        description: "It's now waiting to be paid out.",
      });
    } catch (error) {
      setProblem(
        error instanceof Error ? error.message : "Couldn't accept the loan.",
      );
    }
  };

  const option = (
    value: "Registered" | "Other",
    title: string,
    body: React.ReactNode,
    disabled = false,
  ) => (
    <label
      className={cn(
        "flex cursor-pointer items-start gap-3.5 rounded-2xl border px-4 py-3.5 transition-colors",
        choice === value
          ? "border-primary/60 bg-primary/5"
          : "border-border hover:border-foreground/20",
        disabled && "cursor-not-allowed opacity-60",
      )}
    >
      <input
        type="radio"
        name="payout-account"
        className="mt-1 size-4 accent-[var(--primary)]"
        checked={choice === value}
        disabled={disabled}
        onChange={() => setChoice(value)}
      />
      <span className="min-w-0">
        <span className="block font-bold text-foreground">{title}</span>
        <span className="mt-0.5 block text-sm text-muted-foreground">
          {body}
        </span>
      </span>
    </label>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Where should we pay your loan?</DialogTitle>
          <DialogDescription>
            {formatMoney(approvals.netDisbursement ?? record.amount, currency)}{" "}
            for your {record.loanType}, repaid over{" "}
            {plural(record.durationMonths, "month")}.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3" role="radiogroup">
          {option(
            "Registered",
            "My registered account",
            registered ? (
              <>
                {bankName(registered.bankCode) ?? "Bank"} ·{" "}
                {registered.accountNumberMasked} · {registered.accountName}
              </>
            ) : (
              "You haven't added a bank account to your profile."
            ),
            !registered,
          )}
          {option(
            "Other",
            "Another account",
            "It must be in your registered name. We check the name with your bank.",
          )}
        </div>

        {choice === "Other" ? (
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={bankFieldId}>Bank</Label>
              <Combobox
                id={bankFieldId}
                value={bankCode}
                onValueChange={(value) => {
                  setBankCode(value);
                  setAccountName("");
                  setVerifyError(null);
                }}
                options={banks.map((bank) => ({
                  value: bank.code,
                  label: bank.name,
                }))}
                placeholder="Choose your bank"
                searchPlaceholder="Search banks…"
                loading={banksLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={numberId}>Account number</Label>
              <Input
                id={numberId}
                inputMode="numeric"
                maxLength={10}
                placeholder="10 digits"
                value={accountNumber}
                onChange={(e) => {
                  setAccountNumber(
                    e.target.value.replace(/\D/g, "").slice(0, 10),
                  );
                  setAccountName("");
                  setVerifyError(null);
                }}
              />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor={nameId}>Account name</Label>
              <div className="relative">
                <Input
                  id={nameId}
                  value={accountName}
                  placeholder={
                    verifying
                      ? "Checking with your bank…"
                      : "Filled in once the bank confirms it"
                  }
                  onChange={(e) => setAccountName(e.target.value)}
                  readOnly={!verifyError}
                  className={cn(!verifyError && "bg-muted/50")}
                />
                {verifying ? (
                  <Loader2
                    className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-muted-foreground"
                    aria-hidden="true"
                  />
                ) : null}
              </div>
              {verifyError ? (
                <p className="text-xs text-muted-foreground">
                  The bank couldn&apos;t confirm the name ({verifyError}). Type
                  the name on the account. It must match your registered name.
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        {problem ? (
          <p className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-3 text-sm font-medium text-destructive">
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            {problem}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!ready || respond.isPending}>
            {respond.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Accept loan
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ─────────────────────────────── Disbursement ─────────────────────────────── */

const MAX_CHEQUE_BYTES = 5 * 1024 * 1024;

/** Check the summary, then pay out online (to the borrower's chosen account) or by cheque. */
export function DisburseLoanDialog({
  open,
  onOpenChange,
  record,
  approvals,
  currency,
  coopId,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record: CoopLoanRecord;
  approvals: LoanApprovalStatus;
  currency: string;
  coopId: string;
}) {
  const disburse = useDisburseLoan(coopId);
  const formatId = useFormatMemberId(coopId);
  const [method, setMethod] = useState<"" | "Online" | "Cheque">("");
  const [cheque, setCheque] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [chequeNumber, setChequeNumber] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const methodId = useId();

  useEffect(() => {
    if (!open) {
      setMethod("");
      setCheque(null);
      setPreview(null);
      setChequeNumber("");
      setProblem(null);
    }
  }, [open]);

  const takeCheque = (file: File | undefined) => {
    setProblem(null);
    if (!file) return;
    if (!/^image\//.test(file.type) && !/\.pdf$/i.test(file.name)) {
      setProblem("Upload a photo (JPG or PNG) or a PDF scan of the cheque.");
      return;
    }
    if (file.size > MAX_CHEQUE_BYTES) {
      setProblem("That file is over 5 MB. Try a smaller photo.");
      return;
    }
    setCheque(file);
    setPreview(/^image\//.test(file.type) ? URL.createObjectURL(file) : null);
  };

  const net = approvals.netDisbursement ?? record.amount;
  const firstDue = useMemo(() => {
    const date = new Date();
    date.setMonth(date.getMonth() + 1);
    return formatDateLong(date);
  }, []);

  const submit = async () => {
    setProblem(null);
    if (!method) {
      setProblem("Choose how the money is paid out.");
      return;
    }
    try {
      let chequeUrl: string | undefined;
      if (method === "Cheque") {
        if (!cheque) {
          setProblem("Upload the cheque before disbursing.");
          return;
        }
        setUploading(true);
        chequeUrl = await uploadService.uploadAttachment(cheque);
      }
      await disburse.mutateAsync({
        loanId: record.id,
        method,
        chequeUrl,
        chequeNumber: chequeNumber.trim() || undefined,
      });
      onOpenChange(false);
      toast.success(
        `${formatMoney(net, currency)} disbursed to ${record.memberName}${method === "Cheque" ? " by cheque" : ""}`,
        { description: "Repayments start next month." },
      );
    } catch (error) {
      setProblem(
        error instanceof Error ? error.message : "Couldn't pay the loan out.",
      );
    } finally {
      setUploading(false);
    }
  };

  const summary = [
    ["Member", `${record.memberName} · ${formatId(record.memberId)}`],
    ["Loan type", record.loanType],
    ["Amount to pay out", formatMoney(net, currency)],
    ["Repayment period", plural(record.durationMonths, "month")],
    [
      "Interest",
      `${record.interestRate}% · ${formatMoney(record.totalRepayment - record.amount, currency)}`,
    ],
    ["Monthly repayment", formatMoney(record.monthlyRepayment, currency)],
    ["Total to repay", formatMoney(record.totalRepayment, currency)],
    ["First repayment due", firstDue],
  ];
  const busy = uploading || disburse.isPending;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Disburse loan</DialogTitle>
          <DialogDescription>
            Check the summary, then choose how the money is paid out.
          </DialogDescription>
        </DialogHeader>

        <dl className="grid grid-cols-1 gap-x-5 gap-y-3 rounded-2xl border border-border bg-muted/40 px-4 py-4 sm:grid-cols-2">
          {summary.map(([label, value], index) => (
            <div key={label}>
              <dt className="text-xs font-semibold text-muted-foreground">
                {label}
              </dt>
              <dd
                className={cn(
                  "font-semibold text-foreground",
                  index === 2 && "text-lg",
                )}
              >
                {value}
              </dd>
            </div>
          ))}
        </dl>

        <div className="space-y-2">
          <Label htmlFor={methodId}>Disbursement method</Label>
          <Select
            items={[
              { value: "Online", label: "Online transfer" },
              { value: "Cheque", label: "Cheque" },
            ]}
            value={method || null}
            onValueChange={(value) =>
              setMethod((value as "Online" | "Cheque") ?? "")
            }
          >
            <SelectTrigger id={methodId} className="w-full">
              <SelectValue placeholder="Select a method" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Online">Online transfer</SelectItem>
              <SelectItem value="Cheque">Cheque</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {method === "Online" ? (
          record.payoutAccountNumber ? (
            <p className="flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-3.5 py-3 text-sm text-foreground">
              <Landmark className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              <span>
                Pays into <b>{record.payoutAccountName}</b>
                {record.payoutBankName ? ` · ${record.payoutBankName}` : ""} ·
                ••••{record.payoutAccountNumber.slice(-4)}
                {record.payoutAccountType === "Other"
                  ? " (another account in their name"
                  : " (their registered account"}
                {record.payoutNameVerified === false
                  ? ", name not confirmed by the bank)"
                  : ")"}
                .
              </span>
            </p>
          ) : (
            <p className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-3 text-sm text-destructive">
              <AlertCircle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              There&apos;s no bank account for this loan. Pay it by cheque.
            </p>
          )
        ) : null}

        {method === "Cheque" ? (
          <div className="space-y-3">
            {cheque ? (
              <div className="space-y-2.5">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Cheque preview"
                    className="max-h-40 rounded-xl border border-border"
                  />
                ) : null}
                <span className="inline-flex max-w-full items-center gap-2 rounded-full bg-primary/10 py-1.5 pr-1.5 pl-3 text-sm font-semibold text-primary dark:text-emerald-300">
                  <Paperclip className="size-3.5" aria-hidden="true" />
                  <span className="truncate">{cheque.name}</span>
                  <button
                    type="button"
                    className="grid size-6 place-items-center rounded-full hover:bg-primary/15"
                    aria-label="Remove cheque"
                    onClick={() => {
                      setCheque(null);
                      setPreview(null);
                    }}
                  >
                    <X className="size-3.5" aria-hidden="true" />
                  </button>
                </span>
              </div>
            ) : (
              <label
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  takeCheque(e.dataTransfer.files[0]);
                }}
                className="grid cursor-pointer justify-items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-border bg-muted/40 px-4 py-6 text-center transition-colors hover:border-primary/60 hover:bg-primary/5"
              >
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*,.pdf"
                  className="sr-only"
                  onChange={(e) => takeCheque(e.target.files?.[0])}
                />
                <span className="flex size-11 items-center justify-center rounded-full bg-card text-primary shadow-card dark:text-emerald-300">
                  <Upload className="size-5" aria-hidden="true" />
                </span>
                <span className="text-sm font-semibold text-foreground">
                  Drop a photo or scan of the cheque, or{" "}
                  <span className="text-primary dark:text-emerald-300">
                    browse
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">
                  JPG, PNG or PDF, up to 5 MB
                </span>
              </label>
            )}
            <div className="space-y-2">
              <Label>
                Cheque number{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                inputMode="numeric"
                maxLength={12}
                placeholder="e.g. 00004521"
                value={chequeNumber}
                onChange={(e) => setChequeNumber(e.target.value)}
              />
            </div>
          </div>
        ) : null}

        {problem ? (
          <p className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-3 text-sm font-medium text-destructive">
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            {problem}
          </p>
        ) : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={submit}
            disabled={
              busy || (method === "Online" && !record.payoutAccountNumber)
            }
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : method === "Cheque" ? (
              <FileText className="size-4" aria-hidden="true" />
            ) : (
              <Banknote className="size-4" aria-hidden="true" />
            )}
            {method
              ? `Disburse ${formatMoney(net, currency)}${method === "Cheque" ? " by cheque" : ""}`
              : "Disburse"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
