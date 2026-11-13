"use client";

import { useEffect, useId, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowDown,
  ArrowUp,
  Info,
  Loader2,
  Plus,
  Trash2,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { useCoopMembers } from "@/hooks/use-coop-members";
import { useLoanSettings, useUpdateLoanSettings } from "@/hooks/use-loans-self";
import { coopMemberFullName } from "@/lib/coop-data";
import { formatMoney, getInitials } from "@/lib/format";
import type { LoanSettings } from "@/services/loan-self.service";
import { cn } from "@/lib/utils";
import {
  MemberIdText,
  formatMemberId,
  useAlternativeIdLabel,
} from "@/components/features/shared/member-id";

const EASE = [0.16, 1, 0.3, 1] as const;

interface Seat {
  key: string;
  memberId: string;
  title: string;
}

type Form = Omit<LoanSettings, "committee" | "adminApprovesAlone" | "canEdit">;

const DIVIDEND_METHODS: {
  value: Form["dividendMethod"];
  title: string;
  body: (rate: number) => string;
}[] = [
  {
    value: "SavingsPercent",
    title: "A share of savings",
    body: (rate) =>
      `Each member gets ${rate}% of their savings. ₦100,000 saved → ₦${(1000 * rate).toLocaleString("en-NG")}.`,
  },
  {
    value: "InterestShare",
    title: "A share of loan interest",
    body: (rate) =>
      `${rate}% of the interest the co-operative earns on loans is shared out, in proportion to each member's savings.`,
  },
  {
    value: "None",
    title: "No dividends",
    body: () => "Members don't receive dividends.",
  },
];

/**
 * Settings → Loans: who approves loans and in what order (the loan committee), the rules for
 * applying and borrowing, and how dividends are worked out.
 */
export function LoanRulesSettings({ coopId }: { coopId: string }) {
  const query = useLoanSettings(coopId);
  return (
    <QueryBoundary
      isLoading={query.isLoading}
      isError={query.isError}
      error={query.error}
      onRetry={() => query.refetch()}
      isRetrying={query.isFetching}
      errorTitle="Couldn't load the loan rules"
    >
      {query.data ? (
        <RulesForm
          key={query.dataUpdatedAt}
          coopId={coopId}
          settings={query.data}
        />
      ) : null}
    </QueryBoundary>
  );
}

function RulesForm({
  coopId,
  settings,
}: {
  coopId: string;
  settings: LoanSettings;
}) {
  const update = useUpdateLoanSettings(coopId);
  const { data: members = [] } = useCoopMembers(coopId);
  const altLabel = useAlternativeIdLabel(coopId);
  const canEdit = settings.canEdit;
  const ids = {
    fee: useId(),
    min: useId(),
    guarantors: useId(),
    months: useId(),
    savings: useId(),
    multiplier: useId(),
    within: useId(),
    rate: useId(),
    frequency: useId(),
    concurrent: useId(),
    picker: useId(),
  };

  const [form, setForm] = useState<Form>(() => ({
    minAmount: settings.minAmount,
    applicationFee: settings.applicationFee,
    savingsMultiplier: settings.savingsMultiplier,
    withinPercent: settings.withinPercent,
    minMembershipMonths: settings.minMembershipMonths,
    minSavings: settings.minSavings,
    allowConcurrentLoans: settings.allowConcurrentLoans,
    minGuarantors: settings.minGuarantors,
    dividendMethod: settings.dividendMethod,
    dividendRate: settings.dividendRate,
    dividendFrequency: settings.dividendFrequency,
  }));
  const [seats, setSeats] = useState<Seat[]>(() =>
    settings.committee.map((c) => ({
      key: c.memberId,
      memberId: c.memberId,
      title: c.title,
    })),
  );
  const [picked, setPicked] = useState("");
  const [pickedTitle, setPickedTitle] = useState("");

  const set = <K extends keyof Form>(key: K, value: Form[K]) =>
    setForm((current) => ({ ...current, [key]: value }));

  const nameOf = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    return member
      ? coopMemberFullName(member)
      : (settings.committee.find((c) => c.memberId === memberId)?.memberName ??
          memberId);
  };
  const available = useMemo(
    () =>
      members.filter(
        (m) => m.status === "Active" && !seats.some((s) => s.memberId === m.id),
      ),
    [members, seats],
  );

  const move = (index: number, by: number) =>
    setSeats((current) => {
      const next = [...current];
      const [seat] = next.splice(index, 1);
      next.splice(index + by, 0, seat);
      return next;
    });

  const addSeat = () => {
    if (!picked || !pickedTitle.trim()) return;
    setSeats((current) => [
      ...current,
      { key: picked, memberId: picked, title: pickedTitle.trim() },
    ]);
    setPicked("");
    setPickedTitle("");
  };

  const dirty =
    JSON.stringify(form) !==
      JSON.stringify({
        minAmount: settings.minAmount,
        applicationFee: settings.applicationFee,
        savingsMultiplier: settings.savingsMultiplier,
        withinPercent: settings.withinPercent,
        minMembershipMonths: settings.minMembershipMonths,
        minSavings: settings.minSavings,
        allowConcurrentLoans: settings.allowConcurrentLoans,
        minGuarantors: settings.minGuarantors,
        dividendMethod: settings.dividendMethod,
        dividendRate: settings.dividendRate,
        dividendFrequency: settings.dividendFrequency,
      }) ||
    JSON.stringify(seats.map((s) => [s.memberId, s.title])) !==
      JSON.stringify(settings.committee.map((c) => [c.memberId, c.title]));

  const save = async () => {
    if (seats.some((s) => !s.title.trim())) {
      toast.error("Give every approver a title");
      return;
    }
    try {
      await update.mutateAsync({
        ...form,
        committee: seats.map((s) => ({
          memberId: s.memberId,
          title: s.title.trim(),
        })),
      });
      toast.success("Loan rules saved");
    } catch (error) {
      toast.error("Couldn't save the loan rules", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <div className="space-y-5">
      {/* Committee */}
      <Card>
        <CardContent className="space-y-5">
          <SectionHead
            title="Loan committee"
            body="The people who approve loans, in order. Each one suggests an amount and repayment period; the last one's figures are offered to the borrower. Nobody approves a loan they borrow or guarantee: you cover that step."
          />
          {seats.length === 0 ? (
            <p className="flex items-start gap-2.5 rounded-xl bg-muted/60 px-4 py-3 text-sm text-muted-foreground">
              <Info className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
              No committee yet, so you approve every loan yourself. Add people
              below to share the work.
            </p>
          ) : (
            <ol className="space-y-2.5">
              <AnimatePresence initial={false}>
                {seats.map((seat, index) => (
                  <motion.li
                    key={seat.key}
                    layout
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.25, ease: EASE }}
                    className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3"
                  >
                    <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                      {index + 1}
                    </span>
                    <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary dark:text-emerald-300">
                      {getInitials(nameOf(seat.memberId))}
                    </span>
                    <div className="min-w-40 flex-1">
                      <p className="font-semibold text-foreground">
                        {nameOf(seat.memberId)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        <MemberIdText id={seat.memberId} coopId={coopId} />
                        {index === seats.length - 1 ? " · Final approval" : ""}
                      </p>
                    </div>
                    <Input
                      value={seat.title}
                      onChange={(e) =>
                        setSeats((current) =>
                          current.map((s) =>
                            s.key === seat.key
                              ? { ...s, title: e.target.value }
                              : s,
                          ),
                        )
                      }
                      maxLength={60}
                      aria-label={`Title for ${nameOf(seat.memberId)}`}
                      className="h-9 w-full sm:w-44"
                      disabled={!canEdit}
                    />
                    <div className="flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!canEdit || index === 0}
                        onClick={() => move(index, -1)}
                        aria-label="Move up"
                      >
                        <ArrowUp className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        disabled={!canEdit || index === seats.length - 1}
                        onClick={() => move(index, 1)}
                        aria-label="Move down"
                      >
                        <ArrowDown className="size-4" aria-hidden="true" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        disabled={!canEdit}
                        onClick={() =>
                          setSeats((current) =>
                            current.filter((s) => s.key !== seat.key),
                          )
                        }
                        aria-label={`Remove ${nameOf(seat.memberId)}`}
                      >
                        <Trash2 className="size-4" aria-hidden="true" />
                      </Button>
                    </div>
                  </motion.li>
                ))}
              </AnimatePresence>
            </ol>
          )}

          {canEdit ? (
            <div className="grid gap-3 rounded-2xl border border-dashed border-border p-3.5 sm:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)_auto] sm:items-end">
              <div className="space-y-2">
                <Label htmlFor={ids.picker}>Add a member</Label>
                <Combobox
                  id={ids.picker}
                  value={picked}
                  onValueChange={setPicked}
                  options={available.map((m) => ({
                    value: m.id,
                    label: `${coopMemberFullName(m)} · ${formatMemberId(m.id, m.alternativeId, altLabel)}`,
                  }))}
                  placeholder="Choose a member"
                  searchPlaceholder="Search members…"
                />
              </div>
              <div className="space-y-2">
                <Label>Title</Label>
                <Input
                  value={pickedTitle}
                  onChange={(e) => setPickedTitle(e.target.value)}
                  placeholder="e.g. Treasurer"
                  maxLength={60}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") addSeat();
                  }}
                />
              </div>
              <Button
                variant="outline"
                onClick={addSeat}
                disabled={!picked || !pickedTitle.trim()}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add to committee
              </Button>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {/* Applying */}
      <Card>
        <CardContent className="space-y-5">
          <SectionHead
            title="Applying for a loan"
            body="What members pay and need before they can apply."
          />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <MoneyField
              id={ids.fee}
              label="Application fee"
              hint="Paid online before the loan form opens. 0 for no fee."
              value={form.applicationFee}
              onChange={(v) => set("applicationFee", v)}
              disabled={!canEdit}
            />
            <MoneyField
              id={ids.min}
              label="Minimum loan"
              hint="0 for no minimum."
              value={form.minAmount}
              onChange={(v) => set("minAmount", v)}
              disabled={!canEdit}
            />
            <NumberField
              id={ids.guarantors}
              label="Guarantors for a Times two loan"
              hint="Within loans never need one."
              value={form.minGuarantors}
              onChange={(v) =>
                set("minGuarantors", Math.min(10, Math.round(v)))
              }
              disabled={!canEdit}
            />
            <NumberField
              id={ids.months}
              label="Member for at least"
              suffix="months"
              hint="0 to let new members apply."
              value={form.minMembershipMonths}
              onChange={(v) => set("minMembershipMonths", Math.round(v))}
              disabled={!canEdit}
            />
            <MoneyField
              id={ids.savings}
              label="Minimum savings"
              hint="Members need at least this saved to apply."
              value={form.minSavings}
              onChange={(v) => set("minSavings", v)}
              disabled={!canEdit}
            />
            <div className="flex items-start justify-between gap-3 rounded-xl border border-border px-4 py-3">
              <div>
                <Label htmlFor={ids.concurrent}>More than one loan</Label>
                <p className="mt-1 text-xs text-muted-foreground">
                  Let members apply while another loan is running.
                </p>
              </div>
              <Switch
                id={ids.concurrent}
                checked={form.allowConcurrentLoans}
                onCheckedChange={(v) => set("allowConcurrentLoans", v)}
                disabled={!canEdit}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Eligibility */}
      <Card>
        <CardContent className="space-y-5">
          <SectionHead
            title="How much members can borrow"
            body="Always capped by each loan type's own maximum."
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <NumberField
              id={ids.multiplier}
              label="Times two: up to"
              suffix="× savings"
              step={0.5}
              hint={`₦100,000 saved → up to ${formatMoney(100000 * (form.savingsMultiplier || 0), "NGN")}.`}
              value={form.savingsMultiplier}
              onChange={(v) => set("savingsMultiplier", v)}
              disabled={!canEdit}
            />
            <NumberField
              id={ids.within}
              label="Within: up to"
              suffix="% of savings"
              hint={`₦100,000 saved → up to ${formatMoney(1000 * (form.withinPercent || 0), "NGN")}.`}
              value={form.withinPercent}
              onChange={(v) => set("withinPercent", Math.min(100, v))}
              disabled={!canEdit}
            />
          </div>
        </CardContent>
      </Card>

      {/* Dividends */}
      <Card>
        <CardContent className="space-y-5">
          <SectionHead
            title="Dividends"
            body="How members' dividends are worked out. Members see theirs on the dashboard."
          />
          <div className="grid gap-2.5 md:grid-cols-3" role="radiogroup">
            {DIVIDEND_METHODS.map((method) => {
              const checked = form.dividendMethod === method.value;
              return (
                <label
                  key={method.value}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2xl border px-4 py-3.5 transition-colors",
                    checked
                      ? "border-primary/60 bg-primary/5"
                      : "border-border hover:border-foreground/20",
                    !canEdit && "cursor-not-allowed opacity-70",
                  )}
                >
                  <input
                    type="radio"
                    name="dividend-method"
                    className="mt-1 size-4 accent-[var(--primary)]"
                    checked={checked}
                    disabled={!canEdit}
                    onChange={() => set("dividendMethod", method.value)}
                  />
                  <span>
                    <span className="block font-bold text-foreground">
                      {method.title}
                    </span>
                    <span className="mt-1 block text-sm text-muted-foreground">
                      {method.body(form.dividendRate)}
                    </span>
                  </span>
                </label>
              );
            })}
          </div>
          {form.dividendMethod !== "None" ? (
            <div className="grid gap-4 sm:grid-cols-2">
              <NumberField
                id={ids.rate}
                label="Rate"
                suffix="%"
                step={0.5}
                value={form.dividendRate}
                onChange={(v) => set("dividendRate", Math.min(100, v))}
                disabled={!canEdit}
              />
              <div className="space-y-2">
                <Label htmlFor={ids.frequency}>Paid</Label>
                <Select
                  items={[
                    { value: "Monthly", label: "Monthly" },
                    { value: "Quarterly", label: "Quarterly" },
                    { value: "Annually", label: "Annually" },
                  ]}
                  value={form.dividendFrequency}
                  onValueChange={(v) =>
                    set(
                      "dividendFrequency",
                      (v as Form["dividendFrequency"]) ?? "Annually",
                    )
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger id={ids.frequency} className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly">Monthly</SelectItem>
                    <SelectItem value="Quarterly">Quarterly</SelectItem>
                    <SelectItem value="Annually">Annually</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      {canEdit ? (
        <AnimatePresence>
          {dirty ? (
            <motion.div
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 24, opacity: 0 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="sticky bottom-4 z-20 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-border bg-card/95 px-4 py-3 shadow-raised backdrop-blur"
            >
              <p className="flex items-center gap-2 text-sm text-foreground">
                <Users
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                You have unsaved changes to the loan rules.
              </p>
              <Button onClick={save} disabled={update.isPending}>
                {update.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Save loan rules
              </Button>
            </motion.div>
          ) : null}
        </AnimatePresence>
      ) : (
        <p className="text-sm text-muted-foreground">
          Only the co-operative&apos;s admin can change these.
        </p>
      )}
    </div>
  );
}

function SectionHead({ title, body }: { title: string; body: string }) {
  return (
    <div>
      <h3 className="text-lg font-bold text-foreground">{title}</h3>
      <p className="mt-1 max-w-[70ch] text-sm text-muted-foreground">{body}</p>
    </div>
  );
}

function MoneyField({
  id,
  label,
  hint,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  hint?: string;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  const [text, setText] = useState(value ? value.toLocaleString("en-NG") : "0");
  useEffect(() => {
    setText(value ? value.toLocaleString("en-NG") : "0");
    // Only resync when the saved value changes from outside.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3.5 -translate-y-1/2 font-semibold text-muted-foreground">
          ₦
        </span>
        <Input
          id={id}
          inputMode="decimal"
          className="pl-8"
          value={text}
          disabled={disabled}
          onChange={(e) => {
            setText(e.target.value);
            onChange(Number(e.target.value.replace(/[^\d.]/g, "")) || 0);
          }}
          onBlur={() => setText(value ? value.toLocaleString("en-NG") : "0")}
        />
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

function NumberField({
  id,
  label,
  hint,
  suffix,
  step = 1,
  value,
  onChange,
  disabled,
}: {
  id: string;
  label: string;
  hint?: string;
  suffix?: string;
  step?: number;
  value: number;
  onChange: (value: number) => void;
  disabled?: boolean;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type="number"
          min={0}
          step={step}
          value={Number.isFinite(value) ? value : 0}
          disabled={disabled}
          onChange={(e) => onChange(Number(e.target.value) || 0)}
          className={suffix ? "pr-28" : undefined}
        />
        {suffix ? (
          <span className="pointer-events-none absolute top-1/2 right-3.5 -translate-y-1/2 text-sm text-muted-foreground">
            {suffix}
          </span>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
