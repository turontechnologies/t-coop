"use client";

import { useCallback, useEffect, useId, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Copy,
  Loader2,
  Lock,
  MailCheck,
  PartyPopper,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { openCoopCheckout } from "@/lib/coop-checkout";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  joinService,
  type Application,
  type ApplicationDetails,
  type CoopApplyInfo,
} from "@/services/membership.service";
import {
  AboutYouStep,
  DocumentsStep,
  Field,
  GuarantorsStep,
  KinAndBankStep,
  type Errors,
  type GuarantorDraft,
} from "@/components/features/join/apply-steps";
import {
  ageFrom,
  clearJoinSession,
  detailsFrom,
  isPhone,
  loadJoinSession,
  saveJoinSession,
  type JoinSession,
} from "@/components/features/join/join-session";

const STEPS = [
  "About you",
  "Photo and ID",
  "Guarantors",
  "Next of kin and bank",
  "Check and pay",
];

/** The application form: confirm email, five short steps, then pay. Saves as you go. */
export function ApplyWizard({ coopId }: { coopId: string }) {
  const {
    data: coop,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ["join-coop", coopId],
    queryFn: () => joinService.cooperative(coopId),
  });
  const [session, setSession] = useState<JoinSession | null>(null);
  const [app, setApp] = useState<Application | null>(null);
  const [restoring, setRestoring] = useState(true);

  // Carry on an application started earlier in this browser.
  useEffect(() => {
    const saved = loadJoinSession(coopId);
    if (!saved) {
      setRestoring(false);
      return;
    }
    joinService
      .get(saved.applicationId, saved.token)
      .then((found) => {
        setSession(saved);
        setApp(found);
      })
      .catch(() => clearJoinSession(coopId))
      .finally(() => setRestoring(false));
  }, [coopId]);

  if (isLoading || restoring) {
    return <div className="mt-6 h-96 animate-pulse rounded-3xl bg-muted" />;
  }
  if (isError || !coop) {
    return (
      <p className="mt-10 text-center text-sm text-muted-foreground">
        {error instanceof Error
          ? error.message
          : "We couldn't find that co-operative."}{" "}
        <Link href="/join" className="text-primary underline">
          Find your co-operative
        </Link>
      </p>
    );
  }

  return (
    <div className="space-y-6 pt-4">
      <Link
        href={`/join/${encodeURIComponent(coop.id)}`}
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Rules and what you need
      </Link>
      <div>
        <p className="text-xs font-semibold tracking-wide text-primary uppercase dark:text-emerald-300">
          Joining {coop.name}
        </p>
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Application form
        </h1>
      </div>

      {!session || !app ? (
        <EmailStep
          coop={coop}
          onVerified={(next, application) => {
            saveJoinSession(coop.id, next);
            setSession(next);
            setApp(application);
          }}
        />
      ) : app.status !== "Draft" ? (
        <SentScreen
          app={app}
          coop={coop}
          onStartAgain={() => {
            clearJoinSession(coop.id);
            setSession(null);
            setApp(null);
          }}
        />
      ) : (
        <FormSteps coop={coop} session={session} app={app} setApp={setApp} />
      )}
    </div>
  );
}

/* ---------------- Email and code ---------------- */

function EmailStep({
  coop,
  onVerified,
}: {
  coop: CoopApplyInfo;
  onVerified: (session: JoinSession, app: Application) => void;
}) {
  const id = useId();
  const [form, setForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState<{
    applicationId: string;
    email: string;
    resumed: boolean;
  } | null>(null);
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [resendIn, setResendIn] = useState(0);

  useEffect(() => {
    if (resendIn <= 0) return;
    const timer = window.setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => window.clearTimeout(timer);
  }, [resendIn]);

  const sendCode = async () => {
    const next: Errors = {};
    if (!form.firstName.trim()) next.firstName = "Enter your first name";
    if (!form.lastName.trim()) next.lastName = "Enter your last name";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email.trim()))
      next.email = "Enter a correct email address";
    if (!isPhone(form.phone)) next.phone = "Enter a correct phone number";
    setErrors(next);
    if (Object.keys(next).length) return;
    setBusy(true);
    setProblem(null);
    try {
      const result = await joinService.start(coop.id, form);
      setSent(result);
      setCode("");
      setResendIn(60);
    } catch (error) {
      setProblem(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    if (!sent || code.length !== 6) return;
    setBusy(true);
    setProblem(null);
    try {
      const result = await joinService.verify(sent.applicationId, code);
      onVerified(
        { applicationId: sent.applicationId, token: result.token },
        result.application,
      );
    } catch (error) {
      setProblem(
        error instanceof Error ? error.message : "That code didn't work.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="mx-auto max-w-xl space-y-5 rounded-3xl bg-card p-5 shadow-card ring-1 ring-border/70 sm:p-7">
      {!sent ? (
        <>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              First, let&apos;s confirm your email
            </h2>
            <p className="text-sm text-muted-foreground">
              We will send a 6-number code to your email. If you started before,
              use the same email to carry on.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="First name"
              htmlFor={`${id}-f`}
              error={errors.firstName}
            >
              <Input
                id={`${id}-f`}
                value={form.firstName}
                onChange={(e) =>
                  setForm({ ...form, firstName: e.target.value })
                }
                autoComplete="given-name"
              />
            </Field>
            <Field
              label="Last name (surname)"
              htmlFor={`${id}-l`}
              error={errors.lastName}
            >
              <Input
                id={`${id}-l`}
                value={form.lastName}
                onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                autoComplete="family-name"
              />
            </Field>
            <Field
              label="Email address"
              htmlFor={`${id}-e`}
              error={errors.email}
            >
              <Input
                id={`${id}-e`}
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                autoComplete="email"
              />
            </Field>
            <Field
              label="Phone number"
              htmlFor={`${id}-p`}
              error={errors.phone}
            >
              <Input
                id={`${id}-p`}
                type="tel"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                autoComplete="tel"
              />
            </Field>
          </div>
          {problem ? (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {problem}
            </p>
          ) : null}
          <Button
            size="lg"
            className="w-full"
            onClick={sendCode}
            disabled={busy}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <MailCheck className="size-4" aria-hidden="true" />
            )}
            Send me a code
          </Button>
        </>
      ) : (
        <>
          <div>
            <h2 className="text-lg font-semibold text-foreground">
              Check your email
            </h2>
            <p className="text-sm text-muted-foreground">
              {sent.resumed
                ? "Welcome back! We found the application you started. "
                : ""}
              We sent a 6-number code to{" "}
              <span className="font-medium text-foreground">{sent.email}</span>.
              Type it below. Check your spam folder if you can&apos;t see it.
            </p>
          </div>
          <Field label="Code" htmlFor={`${id}-code`}>
            <Input
              id={`${id}-code`}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && void verify()}
              className="h-12 text-center font-mono text-2xl tracking-[0.5em]"
              autoFocus
            />
          </Field>
          {problem ? (
            <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {problem}
            </p>
          ) : null}
          <Button
            size="lg"
            className="w-full"
            onClick={verify}
            disabled={busy || code.length !== 6}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Check className="size-4" aria-hidden="true" />
            )}
            Continue
          </Button>
          <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
            <button
              type="button"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setSent(null)}
            >
              Change my email
            </button>
            <button
              type="button"
              className="font-medium text-primary disabled:text-muted-foreground dark:text-emerald-300"
              disabled={resendIn > 0 || busy}
              onClick={sendCode}
            >
              {resendIn > 0
                ? `Send a new code in ${resendIn}s`
                : "Send a new code"}
            </button>
          </div>
        </>
      )}
    </section>
  );
}

/* ---------------- The five steps ---------------- */

function FormSteps({
  coop,
  session,
  app,
  setApp,
}: {
  coop: CoopApplyInfo;
  session: JoinSession;
  app: Application;
  setApp: (app: Application) => void;
}) {
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<ApplicationDetails>(() => detailsFrom(app));
  const [guarantors, setGuarantors] = useState<GuarantorDraft[]>(() =>
    app.guarantors.map((g) =>
      g.memberId
        ? { memberId: g.memberId, label: g.name }
        : { name: g.name, phone: g.phone, email: g.email },
    ),
  );
  const [errors, setErrors] = useState<Errors>({});
  const [saving, setSaving] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);

  const set = useCallback(
    <K extends keyof ApplicationDetails>(
      key: K,
      value: ApplicationDetails[K],
    ) => {
      setForm((current) => ({ ...current, [key]: value }));
    },
    [],
  );

  const validate = (index: number): Errors => {
    const next: Errors = {};
    if (index === 0) {
      if (!form.firstName.trim()) next.firstName = "Enter your first name";
      if (!form.lastName.trim()) next.lastName = "Enter your last name";
      if (!form.gender) next.gender = "Choose one";
      const age = form.dateOfBirth ? ageFrom(form.dateOfBirth) : null;
      if (age === null) next.dateOfBirth = "Enter your date of birth";
      else if (age < coop.minAge)
        next.dateOfBirth = `You must be ${coop.minAge} or older to join`;
      if (!isPhone(form.phone)) next.phone = "Enter a correct phone number";
      if (!/^\d{11}$/.test(form.nin))
        next.nin = "Your NIN must be exactly 11 numbers";
      if (!form.homeAddress.trim())
        next.homeAddress = "Enter your home address";
    }
    if (index === 1) {
      if (!app.photoUrl) next.photo = "Add your passport photograph";
      if (coop.requireIdDocument && !app.idDocumentUrl)
        next.idDocument = "Add a picture of your ID card";
      if (app.idDocumentUrl && !form.idDocumentType)
        next.idDocumentType = "Say which ID card it is";
    }
    if (index === 3) {
      if (!form.nextOfKinName.trim())
        next.nextOfKinName = "Enter your next of kin's name";
      if (!isPhone(form.nextOfKinPhone))
        next.nextOfKinPhone = "Enter a correct phone number";
      if (form.accountNumber && !/^\d{10}$/.test(form.accountNumber))
        next.accountNumber = "Your account number must be exactly 10 numbers";
      if (form.accountNumber && !form.bankCode)
        next.accountNumber = "Choose your bank too";
    }
    return next;
  };

  const saveAndGo = async (target: number) => {
    // Going back never needs checks; going forward checks the step you're on.
    if (target > step) {
      const found = validate(step);
      setErrors(found);
      if (Object.keys(found).length) {
        setProblem("Please fix the parts marked in red.");
        return;
      }
    }
    setSaving(true);
    setProblem(null);
    try {
      const sendGuarantors = step === 2;
      const saved = await joinService.save(
        session.applicationId,
        session.token,
        {
          ...form,
          guarantors: sendGuarantors
            ? guarantors.map((g) =>
                g.memberId
                  ? { memberId: g.memberId }
                  : { name: g.name, phone: g.phone, email: g.email },
              )
            : null,
        },
      );
      setApp(saved);
      setErrors({});
      setStep(target);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (error) {
      setProblem(
        error instanceof Error
          ? error.message
          : "We couldn't save your form. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-5">
      <ol className="grid grid-cols-5 gap-1.5" aria-label="Steps">
        {STEPS.map((label, index) => (
          <li key={label} className="space-y-1.5">
            <div
              className={cn(
                "h-1.5 rounded-full",
                index <= step ? "bg-primary" : "bg-muted",
              )}
            />
            <p
              className={cn(
                "hidden text-xs sm:block",
                index === step
                  ? "font-semibold text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {index + 1}. {label}
            </p>
          </li>
        ))}
      </ol>
      <p className="text-sm font-semibold text-foreground sm:hidden">
        Step {step + 1} of {STEPS.length}: {STEPS[step]}
      </p>

      <section className="rounded-3xl bg-card p-5 shadow-card ring-1 ring-border/70 sm:p-7">
        {step === 0 ? (
          <AboutYouStep
            form={form}
            set={set}
            errors={errors}
            minAge={coop.minAge}
          />
        ) : null}
        {step === 1 ? (
          <DocumentsStep
            session={session}
            app={app}
            form={form}
            set={set}
            errors={errors}
            requireIdDocument={coop.requireIdDocument}
            onUploaded={(kind, url) =>
              setApp(
                kind === "photo"
                  ? { ...app, photoUrl: url }
                  : { ...app, idDocumentUrl: url },
              )
            }
          />
        ) : null}
        {step === 2 ? (
          <GuarantorsStep
            session={session}
            coop={coop}
            guarantors={guarantors}
            setGuarantors={setGuarantors}
          />
        ) : null}
        {step === 3 ? (
          <KinAndBankStep
            session={session}
            form={form}
            set={set}
            errors={errors}
          />
        ) : null}
        {step === 4 ? (
          <ReviewAndPay
            coop={coop}
            session={session}
            app={app}
            setApp={setApp}
            goTo={setStep}
          />
        ) : null}
      </section>

      {problem ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {problem}
        </p>
      ) : null}

      {step < 4 ? (
        <div className="flex items-center justify-between gap-3">
          <Button
            variant="outline"
            disabled={step === 0 || saving}
            onClick={() => saveAndGo(step - 1)}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back
          </Button>
          <Button
            size="lg"
            disabled={saving}
            onClick={() => saveAndGo(step + 1)}
          >
            {saving ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Save and continue
            <ArrowRight className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : (
        <Button variant="outline" onClick={() => setStep(3)}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>
      )}
      <p className="flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="size-3.5" aria-hidden="true" />
        Your form is saved as you go. You can close this page and come back with
        the same email.
      </p>
    </div>
  );
}

/* ---------------- Check and pay ---------------- */

function ReviewAndPay({
  coop,
  session,
  app,
  setApp,
  goTo,
}: {
  coop: CoopApplyInfo;
  session: JoinSession;
  app: Application;
  setApp: (app: Application) => void;
  goTo: (step: number) => void;
}) {
  const [busy, setBusy] = useState<"paying" | "checking" | null>(null);
  const [problem, setProblem] = useState<string | null>(null);
  const money = (amount: number) => formatMoney(amount, coop.currency || "NGN");

  const pay = async () => {
    setBusy("paying");
    setProblem(null);
    try {
      const result = await joinService.pay(
        session.applicationId,
        session.token,
      );
      if (result.submitted && result.application) {
        setApp(result.application);
        return;
      }
      if (
        !result.reference ||
        !result.gateway ||
        !result.publicKey ||
        result.amount == null
      ) {
        throw new Error(
          "We couldn't open the payment window. Please try again.",
        );
      }
      const reference = result.reference;
      await openCoopCheckout({
        gateway: result.gateway,
        publicKey: result.publicKey,
        email: result.email,
        amountNaira: result.amount,
        reference,
        title: `Joining ${coop.name}`,
        description: "Form fee and first savings",
        onSuccess: async () => {
          setBusy("checking");
          try {
            const submitted = await joinService.confirmPayment(
              session.applicationId,
              session.token,
              reference,
            );
            setApp(submitted);
          } catch (error) {
            setProblem(
              (error instanceof Error
                ? error.message
                : "We couldn't confirm your payment.") +
                " If money left your account, press the pay button again: we will check first and won't charge you twice.",
            );
          } finally {
            setBusy(null);
          }
        },
        onClose: () => setBusy(null),
      });
    } catch (error) {
      setProblem(
        error instanceof Error
          ? error.message
          : "Something went wrong. Please try again.",
      );
      setBusy(null);
    }
  };

  const rows: { label: string; value: string | null; step: number }[] = [
    {
      label: "Name",
      value: [app.firstName, app.otherName, app.lastName]
        .filter(Boolean)
        .join(" "),
      step: 0,
    },
    { label: "Email", value: app.email, step: 0 },
    { label: "Phone", value: app.phone, step: 0 },
    { label: "Male or female", value: app.gender, step: 0 },
    { label: "Date of birth", value: app.dateOfBirth, step: 0 },
    { label: "NIN", value: app.nin, step: 0 },
    {
      label: "Home address",
      value: [app.homeAddress, app.city, app.state].filter(Boolean).join(", "),
      step: 0,
    },
    { label: "Passport photo", value: app.photoUrl ? "Added" : null, step: 1 },
    {
      label: "ID card",
      value: app.idDocumentUrl ? (app.idDocumentType ?? "Added") : null,
      step: 1,
    },
    {
      label: "Guarantors",
      value: app.guarantors.length
        ? app.guarantors.map((g) => g.name).join(", ")
        : null,
      step: 2,
    },
    {
      label: "Next of kin",
      value: app.nextOfKinName
        ? `${app.nextOfKinName}, ${app.nextOfKinPhone ?? ""}`
        : null,
      step: 3,
    },
    {
      label: "Bank account",
      value: app.accountNumber
        ? `${app.accountNumber}${app.accountName ? ` (${app.accountName})` : ""}`
        : null,
      step: 3,
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold text-foreground">
          Check your details
        </h2>
        <p className="text-sm text-muted-foreground">
          Make sure everything is right. You can&apos;t change it after you send
          it.
        </p>
      </div>
      <dl className="divide-y divide-border rounded-2xl ring-1 ring-border/70">
        {rows.map((row) => (
          <div
            key={row.label}
            className="flex items-start justify-between gap-3 px-4 py-2.5 text-sm"
          >
            <dt className="w-32 shrink-0 text-muted-foreground">{row.label}</dt>
            <dd
              className={cn(
                "min-w-0 flex-1 break-words",
                row.value ? "text-foreground" : "text-muted-foreground italic",
              )}
            >
              {row.value || "Not given"}
            </dd>
            <button
              type="button"
              className="shrink-0 text-xs font-medium text-primary dark:text-emerald-300"
              onClick={() => goTo(row.step)}
            >
              Change
            </button>
          </div>
        ))}
      </dl>

      {app.totalFee > 0 ? (
        <dl className="space-y-2 rounded-2xl bg-muted/60 p-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Form fee</dt>
            <dd className="text-foreground">{money(app.formFee)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Your first savings</dt>
            <dd className="text-foreground">{money(app.firstSavings)}</dd>
          </div>
          <div className="flex justify-between border-t border-border pt-2 text-base font-semibold">
            <dt className="text-foreground">Total to pay now</dt>
            <dd className="text-foreground">{money(app.totalFee)}</dd>
          </div>
        </dl>
      ) : null}

      {problem ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {problem}
        </p>
      ) : null}

      <Button
        size="lg"
        className="w-full"
        onClick={pay}
        disabled={busy !== null}
      >
        {busy ? (
          <Loader2 className="size-4 animate-spin" aria-hidden="true" />
        ) : (
          <Lock className="size-4" aria-hidden="true" />
        )}
        {busy === "checking"
          ? "Confirming your payment…"
          : app.totalFee > 0
            ? `Pay ${money(app.totalFee)} and send my application`
            : "Send my application"}
      </Button>
      {app.totalFee > 0 ? (
        <p className="text-center text-xs text-muted-foreground">
          A secure payment window opens. You can pay with your card, bank
          transfer or USSD.
        </p>
      ) : null}
    </div>
  );
}

/* ---------------- Sent ---------------- */

function SentScreen({
  app,
  coop,
  onStartAgain,
}: {
  app: Application;
  coop: CoopApplyInfo;
  onStartAgain: () => void;
}) {
  const decided = app.status === "Approved" || app.status === "Rejected";
  return (
    <section className="mx-auto max-w-xl space-y-6 rounded-3xl bg-card p-6 text-center shadow-card ring-1 ring-border/70 sm:p-8">
      <span className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary dark:text-emerald-300">
        {decided ? (
          <CheckCircle2 className="size-7" aria-hidden="true" />
        ) : (
          <PartyPopper className="size-7" aria-hidden="true" />
        )}
      </span>
      <div className="space-y-1.5">
        <h2 className="text-xl font-semibold text-foreground">
          {app.status === "Approved"
            ? "You are now a member!"
            : app.status === "Rejected"
              ? "Your application was not approved"
              : "Your application has been sent"}
        </h2>
        <p className="text-sm text-muted-foreground">
          {app.status === "Approved"
            ? `We emailed your login details to ${app.email}.`
            : app.status === "Rejected"
              ? app.decisionNote
                ? `Reason: ${app.decisionNote}`
                : "Please contact the co-operative to know why."
              : `${coop.name} will now check your details. We will email ${app.email} when they decide.`}
        </p>
      </div>
      <div className="rounded-2xl bg-muted/60 p-4">
        <p className="text-xs text-muted-foreground">Your application number</p>
        <p className="mt-1 flex items-center justify-center gap-2 font-mono text-2xl font-semibold tracking-wider text-foreground">
          {app.reference}
          <button
            type="button"
            aria-label="Copy application number"
            className="text-muted-foreground hover:text-foreground"
            onClick={() => {
              void navigator.clipboard?.writeText(app.reference);
              toast.success("Copied");
            }}
          >
            <Copy className="size-4" aria-hidden="true" />
          </button>
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          Keep it. You need it to check your application.
        </p>
      </div>
      {app.status === "Submitted" ? (
        <ol className="space-y-2 text-left text-sm text-muted-foreground">
          <li>
            1. Your guarantors get a message asking if they know you. Remind
            them to answer.
          </li>
          <li>2. The co-operative checks your details and documents.</li>
          <li>
            3. When you are approved, you get an email with your Membership ID
            and password.
          </li>
        </ol>
      ) : null}
      <div className="flex flex-col gap-2 sm:flex-row sm:justify-center">
        <Button nativeButton={false} render={<Link href="/join/status" />}>
          Check my application
        </Button>
        {app.status === "Approved" ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/login" />}
          >
            Log in
          </Button>
        ) : app.status === "Rejected" ? (
          <Button variant="outline" onClick={onStartAgain}>
            Apply again
          </Button>
        ) : null}
      </div>
    </section>
  );
}
