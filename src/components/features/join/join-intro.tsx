"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  BadgeCheck,
  Building2,
  CheckCircle2,
  ClipboardList,
  CreditCard,
  FileText,
  ScrollText,
  ShieldCheck,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { formatMoney } from "@/lib/format";
import { joinService } from "@/services/membership.service";
import { guarantorRuleText } from "@/components/features/join/guarantor-rule-text";

const STEPS = [
  {
    icon: ScrollText,
    title: "Read the rules",
    text: "Know what the co-operative expects from its members.",
  },
  {
    icon: ClipboardList,
    title: "Fill the form",
    text: "Your details, photo, ID card, guarantors and next of kin.",
  },
  {
    icon: CreditCard,
    title: "Pay the joining fee",
    text: "Online, with your card or bank, at the end of the form.",
  },
  {
    icon: ShieldCheck,
    title: "The co-operative checks",
    text: "They check your details and your guarantors say they know you.",
  },
  {
    icon: BadgeCheck,
    title: "You become a member",
    text: "We email you your Membership ID and password.",
  },
];

/** Shown before the form: the rules, what to have ready, the fee, and how it works. */
export function JoinIntro({ coopId }: { coopId: string }) {
  const [agreed, setAgreed] = useState(false);
  const {
    data: coop,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["join-coop", coopId],
    queryFn: () => joinService.cooperative(coopId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 pt-6">
        <div className="h-24 animate-pulse rounded-3xl bg-muted" />
        <div className="h-64 animate-pulse rounded-3xl bg-muted" />
      </div>
    );
  }
  if (isError || !coop) {
    return (
      <div className="mx-auto max-w-md space-y-4 pt-16 text-center">
        <Building2
          className="mx-auto size-10 text-muted-foreground"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "We couldn't find that co-operative."}
        </p>
        <Button
          variant="outline"
          nativeButton={false}
          render={<Link href="/join" />}
        >
          Find another co-operative
        </Button>
      </div>
    );
  }

  const money = (amount: number) => formatMoney(amount, coop.currency || "NGN");

  return (
    <div className="space-y-6 pt-4">
      <Link
        href="/join"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All co-operatives
      </Link>

      <section className="flex items-center gap-4 rounded-3xl bg-card p-5 shadow-card ring-1 ring-border/70 sm:p-6">
        {coop.logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={coop.logoUrl}
            alt=""
            className="size-16 shrink-0 rounded-2xl bg-muted object-cover"
          />
        ) : (
          <span className="flex size-16 shrink-0 items-center justify-center rounded-2xl bg-primary/10 text-primary dark:text-emerald-300">
            <Building2 className="size-7" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0">
          <p className="text-xs font-semibold tracking-wide text-primary uppercase dark:text-emerald-300">
            Apply to join
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {coop.name}
          </h1>
          {coop.address ? (
            <p className="text-sm text-muted-foreground">{coop.address}</p>
          ) : null}
        </div>
      </section>

      {!coop.open ? (
        <p className="rounded-2xl bg-amber-500/10 px-4 py-3 text-sm text-amber-800 dark:text-amber-300">
          {coop.name} isn&apos;t taking new members right now. Please check back
          later or contact them.
        </p>
      ) : null}

      <section className="rounded-3xl bg-card p-5 shadow-card ring-1 ring-border/70 sm:p-6">
        <h2 className="text-base font-semibold text-foreground">
          How it works
        </h2>
        <ol className="mt-4 grid gap-3 sm:grid-cols-5">
          {STEPS.map((step, index) => (
            <li key={step.title} className="flex gap-3 sm:flex-col sm:gap-2">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:text-emerald-300">
                <step.icon className="size-4" aria-hidden="true" />
              </span>
              <div>
                <p className="text-sm font-medium text-foreground">
                  {index + 1}. {step.title}
                </p>
                <p className="text-xs text-muted-foreground">{step.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <section className="space-y-4 rounded-3xl bg-card p-5 shadow-card ring-1 ring-border/70 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <FileText
              className="size-4 text-primary dark:text-emerald-300"
              aria-hidden="true"
            />
            What you need to have ready
          </h2>
          <ul className="space-y-2.5">
            {coop.requirements.map((item) => (
              <li key={item} className="flex gap-2.5 text-sm text-foreground">
                <CheckCircle2
                  className="mt-0.5 size-4 shrink-0 text-primary dark:text-emerald-300"
                  aria-hidden="true"
                />
                {item}
              </li>
            ))}
          </ul>
          <div className="space-y-2 rounded-2xl bg-muted/60 p-4 text-sm">
            <p className="flex items-center gap-2 font-medium text-foreground">
              <Users className="size-4" aria-hidden="true" />
              Guarantors
            </p>
            <p className="text-muted-foreground">
              {guarantorRuleText(coop.guarantors)}
            </p>
            <p className="text-muted-foreground">
              A guarantor who is a member will be asked in the app if they know
              you, so tell them before you apply.
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            You must be {coop.minAge} years or older.
            {coop.requireIdDocument
              ? " You will take a picture of your ID card or upload it."
              : ""}
          </p>
        </section>

        <section className="space-y-4 rounded-3xl bg-card p-5 shadow-card ring-1 ring-border/70 sm:p-6">
          <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
            <CreditCard
              className="size-4 text-primary dark:text-emerald-300"
              aria-hidden="true"
            />
            Joining fee
          </h2>
          {coop.totalFee > 0 ? (
            <>
              <dl className="space-y-2 text-sm">
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">Form fee</dt>
                  <dd className="font-medium text-foreground">
                    {money(coop.formFee)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-muted-foreground">
                    Your first savings
                    {coop.savingsTypeName
                      ? ` (into ${coop.savingsTypeName})`
                      : ""}
                  </dt>
                  <dd className="font-medium text-foreground">
                    {money(coop.firstSavings)}
                  </dd>
                </div>
                <div className="flex justify-between gap-3 border-t border-border pt-2 text-base">
                  <dt className="font-semibold text-foreground">You pay</dt>
                  <dd className="font-semibold text-foreground">
                    {money(coop.totalFee)}
                  </dd>
                </div>
              </dl>
              <p className="text-xs text-muted-foreground">
                You pay once, online, at the end of the form. The form fee goes
                to the co-operative. Your first savings goes into your own
                savings when you are approved.
              </p>
            </>
          ) : (
            <p className="text-sm text-muted-foreground">
              There is no joining fee. You just fill the form.
            </p>
          )}
        </section>
      </div>

      <section className="rounded-3xl bg-card p-5 shadow-card ring-1 ring-border/70 sm:p-6">
        <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
          <ScrollText
            className="size-4 text-primary dark:text-emerald-300"
            aria-hidden="true"
          />
          Rules of {coop.name}
        </h2>
        {coop.rules ? (
          <div className="mt-3 max-h-80 overflow-y-auto rounded-2xl bg-muted/50 p-4 text-sm leading-relaxed whitespace-pre-line text-foreground">
            {coop.rules}
          </div>
        ) : (
          <p className="mt-3 text-sm text-muted-foreground">
            The co-operative hasn&apos;t written its rules here yet. Ask them
            for a copy before you apply.
          </p>
        )}
      </section>

      {coop.open ? (
        <section className="flex flex-col gap-4 rounded-3xl bg-primary/5 p-5 ring-1 ring-primary/20 sm:flex-row sm:items-center sm:justify-between sm:p-6">
          <label className="flex items-start gap-3 text-sm text-foreground">
            <Checkbox
              checked={agreed}
              onCheckedChange={(value) => setAgreed(value === true)}
              className="mt-0.5"
            />
            <span>
              I have read the rules and I have everything on the list ready.
              {coop.totalFee > 0
                ? ` I know the joining fee is ${money(coop.totalFee)}.`
                : ""}
            </span>
          </label>
          <Button
            size="lg"
            disabled={!agreed}
            nativeButton={false}
            render={
              agreed ? (
                <Link href={`/join/${encodeURIComponent(coop.id)}/apply`} />
              ) : (
                <span />
              )
            }
            className="shrink-0"
          >
            Start my application
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </section>
      ) : null}
    </div>
  );
}
