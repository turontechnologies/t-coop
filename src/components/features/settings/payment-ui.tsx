"use client";

import { useEffect, useId, useRef, useState } from "react";
import { animate, motion, useReducedMotion } from "framer-motion";
import {
  Controller,
  useWatch,
  type Control,
  type FieldErrors,
  type UseFormRegister,
} from "react-hook-form";
import {
  ArrowDownToLine,
  CalendarClock,
  FileText,
  Landmark,
  PiggyBank,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatNaira, getInitials } from "@/lib/format";
import type {
  ChargeType,
  CoopPlatformFees,
  EarningSource,
} from "@/lib/settings-data";
import type { FeeChargesFormValues } from "@/lib/validations/settings.schema";
import { cn } from "@/lib/utils";

export const EASE = [0.16, 1, 0.3, 1] as const;

export type FeeKey = "savings" | "loans" | "withdrawal" | "loanApplication";

type TypeField =
  | "savingsChargeType"
  | "loansChargeType"
  | "withdrawalFeeType"
  | "loanApplicationFeeType";
type AmountField =
  | "savingsChargeAmount"
  | "loansChargeAmount"
  | "withdrawalFeeAmount"
  | "loanApplicationFeeAmount";

export interface FeeMeta {
  label: string;
  short: string;
  hint: string;
  icon: LucideIcon;
  /** Icon bubble colours. */
  tone: string;
  /** Solid fill for bars and glows. */
  fill: string;
  /** Same colour for charts. */
  color: string;
  typeField: TypeField;
  amountField: AmountField;
  exampleBase: number;
  exampleNoun: string;
  source: EarningSource;
}

export const FEES: Record<FeeKey, FeeMeta> = {
  savings: {
    label: "Savings charge",
    short: "Savings",
    hint: "Taken from every savings deposit",
    icon: PiggyBank,
    tone: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    fill: "bg-emerald-500",
    color: "#10b981",
    typeField: "savingsChargeType",
    amountField: "savingsChargeAmount",
    exampleBase: 10_000,
    exampleNoun: "deposit",
    source: "SavingsCharge",
  },
  loans: {
    label: "Loan charge",
    short: "Loans",
    hint: "Taken from every loan paid out",
    icon: Landmark,
    tone: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
    fill: "bg-sky-500",
    color: "#0ea5e9",
    typeField: "loansChargeType",
    amountField: "loansChargeAmount",
    exampleBase: 100_000,
    exampleNoun: "loan",
    source: "LoanCharge",
  },
  withdrawal: {
    label: "Withdrawal fee",
    short: "Withdrawal",
    hint: "Taken from every savings withdrawal",
    icon: ArrowDownToLine,
    tone: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
    fill: "bg-amber-500",
    color: "#f59e0b",
    typeField: "withdrawalFeeType",
    amountField: "withdrawalFeeAmount",
    exampleBase: 20_000,
    exampleNoun: "withdrawal",
    source: "WithdrawalFee",
  },
  loanApplication: {
    label: "Loan application fee",
    short: "Loan app. fee",
    hint: "The platform's share of each application fee members pay",
    icon: FileText,
    tone: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
    fill: "bg-violet-500",
    color: "#8b5cf6",
    typeField: "loanApplicationFeeType",
    amountField: "loanApplicationFeeAmount",
    exampleBase: 2_000,
    exampleNoun: "application fee",
    source: "LoanApplicationFee",
  },
};

export const FEE_ORDER: FeeKey[] = [
  "savings",
  "loans",
  "withdrawal",
  "loanApplication",
];

export const SOURCE_FEE: Record<EarningSource, FeeKey> = {
  SavingsCharge: "savings",
  LoanCharge: "loans",
  WithdrawalFee: "withdrawal",
  LoanApplicationFee: "loanApplication",
};

/** Same rule as the backend's PlatformFees.feeFor. */
export function feeFor(type: ChargeType, amount: number, base: number) {
  const value = Number.isFinite(amount) ? amount : 0;
  const fee = type === "Fixed" ? value : (base * value) / 100;
  return Math.round(fee * 100) / 100;
}

/** What the platform takes on {@code base}; an application-fee share never exceeds the fee. */
export function platformCut(
  fee: FeeKey,
  type: ChargeType,
  amount: number,
  base: number,
) {
  const cut = feeFor(type, amount, base);
  return fee === "loanApplication" ? Math.min(cut, base) : cut;
}

export function describeFee(type: ChargeType, amount: number) {
  return type === "Fixed" ? formatNaira(amount) : `${amount}%`;
}

/** A number that counts smoothly to each new value. */
export function AnimatedNumber({
  value,
  format = formatNaira,
  className,
}: {
  value: number;
  format?: (value: number) => string;
  className?: string;
}) {
  const reduce = useReducedMotion();
  const [display, setDisplay] = useState(reduce ? value : 0);
  const from = useRef(reduce ? value : 0);

  useEffect(() => {
    if (reduce) {
      setDisplay(value);
      from.current = value;
      return;
    }
    const controls = animate(from.current, value, {
      duration: 0.8,
      ease: EASE,
      onUpdate: (latest) => setDisplay(latest),
    });
    from.current = value;
    return () => controls.stop();
  }, [value, reduce]);

  return (
    <span className={cn("tabular-nums", className)}>
      {format(Math.round(display * 100) / 100)}
    </span>
  );
}

/** A pill row where the selected pill slides between options. */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  size = "md",
  className,
}: {
  options: { value: T; label: React.ReactNode }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const layoutId = useId();
  return (
    <div
      role="radiogroup"
      aria-label={label}
      className={cn(
        "inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-xl bg-muted p-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        className,
      )}
    >
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(option.value)}
            className={cn(
              "relative shrink-0 rounded-lg font-medium whitespace-nowrap transition-colors focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none",
              size === "sm" ? "px-2.5 py-1 text-xs" : "px-3.5 py-1.5 text-sm",
              selected
                ? "text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {selected ? (
              <motion.span
                layoutId={layoutId}
                transition={{ type: "spring", stiffness: 500, damping: 38 }}
                className="absolute inset-0 rounded-lg bg-card shadow-card ring-1 ring-border/60"
              />
            ) : null}
            <span className="relative">{option.label}</span>
          </button>
        );
      })}
    </div>
  );
}

const CHARGE_OPTIONS: { value: ChargeType; label: string }[] = [
  { value: "Fixed", label: "₦ Fixed" },
  { value: "Percentage", label: "% Percent" },
];

/** One platform fee: fixed or percent, the amount, and what it earns on an example. */
export function FeeTile({
  fee,
  control,
  register,
  errors,
  index = 0,
  compact = false,
}: {
  fee: FeeKey;
  control: Control<FeeChargesFormValues>;
  register: UseFormRegister<FeeChargesFormValues>;
  errors: FieldErrors<FeeChargesFormValues>;
  index?: number;
  compact?: boolean;
}) {
  const meta = FEES[fee];
  const type = useWatch({ control, name: meta.typeField });
  const amount = useWatch({ control, name: meta.amountField });
  const inputId = useId();
  const error = errors[meta.amountField]?.message;
  const earned = platformCut(fee, type, amount, meta.exampleBase);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: EASE }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card shadow-card transition-all duration-200 focus-within:ring-4 focus-within:ring-primary/10 hover:-translate-y-0.5 hover:shadow-raised",
        compact ? "p-4" : "p-5",
        error
          ? "border-destructive/60"
          : "border-border focus-within:border-primary/40",
      )}
    >
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute -top-12 -right-12 size-32 rounded-full opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-25",
          meta.fill,
        )}
      />
      <div className="relative flex items-start gap-3">
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6",
            meta.tone,
          )}
        >
          <meta.icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0">
          <label
            htmlFor={inputId}
            className="block font-semibold text-foreground"
          >
            {meta.label}
          </label>
          <p className="text-xs text-muted-foreground">{meta.hint}</p>
        </div>
      </div>

      <div className="relative mt-4 flex flex-wrap items-center gap-3">
        <Controller
          control={control}
          name={meta.typeField}
          render={({ field }) => (
            <Segmented
              size="sm"
              label={`${meta.label} type`}
              options={CHARGE_OPTIONS}
              value={field.value}
              onChange={field.onChange}
            />
          )}
        />
        <div className="relative">
          {type === "Fixed" ? (
            <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm text-muted-foreground">
              ₦
            </span>
          ) : null}
          <Input
            id={inputId}
            type="number"
            inputMode="decimal"
            step="any"
            min={0}
            placeholder="0"
            aria-invalid={!!error}
            className={cn(
              "h-10 w-32 font-semibold tabular-nums",
              type === "Fixed" ? "pl-7" : "pr-8",
            )}
            {...register(meta.amountField, { valueAsNumber: true })}
          />
          {type === "Percentage" ? (
            <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
              %
            </span>
          ) : null}
        </div>
      </div>

      {error ? (
        <p className="relative mt-2 flex items-center gap-1.5 text-sm text-destructive">
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}

      <div className="relative mt-4 flex items-center justify-between gap-3 rounded-xl bg-muted/70 px-3 py-2.5 text-xs">
        <span className="text-muted-foreground">
          On a {formatNaira(meta.exampleBase)} {meta.exampleNoun}, you get
        </span>
        <AnimatedNumber
          value={earned}
          className="text-sm font-bold text-foreground"
        />
      </div>
    </motion.div>
  );
}

const GRACE_PRESETS = [0, 3, 7, 14, 30];

/** Days a co-op keeps working after its subscription runs out, with a picture of the timeline. */
export function GraceTile({
  control,
  errors,
  index = 0,
  description,
}: {
  control: Control<FeeChargesFormValues>;
  errors: FieldErrors<FeeChargesFormValues>;
  index?: number;
  description: string;
}) {
  const inputId = useId();
  const error = errors.subscriptionGraceDays?.message;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.05, ease: EASE }}
      className={cn(
        "group relative overflow-hidden rounded-2xl border bg-card p-5 shadow-card transition-all duration-200 focus-within:ring-4 focus-within:ring-primary/10 hover:shadow-raised",
        error ? "border-destructive/60" : "border-border",
      )}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-12 -right-12 size-32 rounded-full bg-rose-500 opacity-10 blur-2xl transition-opacity duration-300 group-hover:opacity-20"
      />
      <Controller
        control={control}
        name="subscriptionGraceDays"
        render={({ field }) => {
          const days = Number.isFinite(field.value) ? field.value : 0;
          const graceWidth = Math.min(days, 60) / 60;
          return (
            <div className="relative space-y-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-rose-500/12 text-rose-700 transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6 dark:text-rose-300">
                    <CalendarClock className="size-5" aria-hidden="true" />
                  </span>
                  <div className="min-w-0">
                    <label
                      htmlFor={inputId}
                      className="block font-semibold text-foreground"
                    >
                      Subscription grace period
                    </label>
                    <p className="text-xs text-muted-foreground">
                      {description}
                    </p>
                  </div>
                </div>
                <div className="relative">
                  <Input
                    id={inputId}
                    type="number"
                    inputMode="numeric"
                    min={0}
                    max={365}
                    aria-invalid={!!error}
                    className="h-10 w-28 pr-12 font-semibold tabular-nums"
                    value={Number.isFinite(field.value) ? field.value : ""}
                    onBlur={field.onBlur}
                    onChange={(event) =>
                      field.onChange(
                        event.target.value === ""
                          ? Number.NaN
                          : Number(event.target.value),
                      )
                    }
                  />
                  <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-sm text-muted-foreground">
                    days
                  </span>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                {GRACE_PRESETS.map((preset) => {
                  const selected = days === preset;
                  return (
                    <motion.button
                      key={preset}
                      type="button"
                      whileTap={{ scale: 0.92 }}
                      onClick={() => field.onChange(preset)}
                      aria-pressed={selected}
                      className={cn(
                        "rounded-full border px-3 py-1 text-xs font-medium transition-colors",
                        selected
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground",
                      )}
                    >
                      {preset === 0 ? "None" : `${preset} days`}
                    </motion.button>
                  );
                })}
              </div>

              <div className="space-y-2">
                <div className="flex h-3 overflow-hidden rounded-full bg-muted">
                  <div className="h-full w-[40%] bg-gradient-to-r from-primary to-emerald-500" />
                  <motion.div
                    className="h-full bg-gradient-to-r from-amber-400 to-amber-300"
                    initial={false}
                    animate={{ width: `${graceWidth * 45}%` }}
                    transition={{ type: "spring", stiffness: 220, damping: 28 }}
                  />
                  <div className="h-full flex-1 bg-rose-500/25" />
                </div>
                <div className="flex justify-between text-[11px] font-medium text-muted-foreground">
                  <span>Subscription running</span>
                  <span className="text-amber-700 dark:text-amber-300">
                    {days > 0
                      ? `${days} day${days === 1 ? "" : "s"} grace`
                      : "No grace"}
                  </span>
                  <span className="text-rose-600 dark:text-rose-300">
                    Locked
                  </span>
                </div>
              </div>
            </div>
          );
        }}
      />
      {error ? (
        <p className="relative mt-2 flex items-center gap-1.5 text-sm text-destructive">
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {error}
        </p>
      ) : null}
    </motion.div>
  );
}

const AVATAR_GRADIENTS = [
  "from-emerald-500 to-teal-600",
  "from-sky-500 to-indigo-600",
  "from-amber-400 to-orange-600",
  "from-violet-500 to-fuchsia-600",
  "from-rose-500 to-pink-600",
  "from-lime-500 to-emerald-600",
];

export function CoopAvatar({
  id,
  name,
  className,
}: {
  id: string;
  name: string;
  className?: string;
}) {
  let hash = 0;
  for (const char of id) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-sm font-bold text-white shadow-sm",
        AVATAR_GRADIENTS[hash % AVATAR_GRADIENTS.length],
        className,
      )}
    >
      {getInitials(name)}
    </span>
  );
}

export type SubscriptionState = "active" | "grace" | "locked" | "none";

export function subscriptionState(fees: CoopPlatformFees): SubscriptionState {
  if (!fees.subscriptionExpiresAt) return "none";
  if (fees.inGracePeriod) return "grace";
  const today = new Date();
  const todayIso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
  return fees.subscriptionExpiresAt >= todayIso ? "active" : "locked";
}

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function SubscriptionPill({ fees }: { fees: CoopPlatformFees }) {
  const state = subscriptionState(fees);
  const config = {
    active: {
      dot: "bg-emerald-500",
      className: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
      text: `Active to ${fees.subscriptionExpiresAt ? shortDate(fees.subscriptionExpiresAt) : ""}`,
    },
    grace: {
      dot: "bg-amber-500 animate-pulse",
      className: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
      text: `In grace until ${fees.graceEndsAt ? shortDate(fees.graceEndsAt) : ""}`,
    },
    locked: {
      dot: "bg-rose-500",
      className: "bg-rose-500/10 text-rose-700 dark:text-rose-300",
      text: "Subscription expired",
    },
    none: {
      dot: "bg-slate-400",
      className: "bg-muted text-muted-foreground",
      text: "Not subscribed yet",
    },
  }[state];
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium",
        config.className,
      )}
    >
      <span className={cn("size-1.5 rounded-full", config.dot)} />
      {config.text}
    </span>
  );
}
