"use client";

import { useEffect, useId, useRef, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Camera,
  CheckCircle2,
  FileUp,
  Loader2,
  Plus,
  Search,
  Trash2,
  UserRound,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
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
import { cn } from "@/lib/utils";
import {
  joinService,
  type Application,
  type ApplicationDetails,
  type CoopApplyInfo,
  type GuarantorInput,
} from "@/services/membership.service";
import { guarantorRuleText } from "@/components/features/join/guarantor-rule-text";
import {
  ID_TYPES,
  RELATIONSHIPS,
  type JoinSession,
} from "@/components/features/join/join-session";

export type Errors = Partial<Record<string, string>>;

export function Field({
  label,
  hint,
  error,
  htmlFor,
  optional,
  children,
  className,
}: {
  label: string;
  hint?: string;
  error?: string;
  htmlFor?: string;
  optional?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label htmlFor={htmlFor}>
        {label}
        {optional ? (
          <span className="font-normal text-muted-foreground">
            {" "}
            (if you have one)
          </span>
        ) : null}
      </Label>
      {children}
      {error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : hint ? (
        <p className="text-xs text-muted-foreground">{hint}</p>
      ) : null}
    </div>
  );
}

type SetField = <K extends keyof ApplicationDetails>(
  key: K,
  value: ApplicationDetails[K],
) => void;

/* ---------------- Step 1: about you ---------------- */

export function AboutYouStep({
  form,
  set,
  errors,
  minAge,
}: {
  form: ApplicationDetails;
  set: SetField;
  errors: Errors;
  minAge: number;
}) {
  const id = useId();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      <Field
        label="First name"
        htmlFor={`${id}-first`}
        error={errors.firstName}
      >
        <Input
          id={`${id}-first`}
          value={form.firstName}
          onChange={(e) => set("firstName", e.target.value)}
          autoComplete="given-name"
        />
      </Field>
      <Field
        label="Last name (surname)"
        htmlFor={`${id}-last`}
        error={errors.lastName}
      >
        <Input
          id={`${id}-last`}
          value={form.lastName}
          onChange={(e) => set("lastName", e.target.value)}
          autoComplete="family-name"
        />
      </Field>
      <Field label="Other name" htmlFor={`${id}-other`} optional>
        <Input
          id={`${id}-other`}
          value={form.otherName}
          onChange={(e) => set("otherName", e.target.value)}
          autoComplete="additional-name"
        />
      </Field>
      <Field label="Male or female" error={errors.gender}>
        <div className="grid grid-cols-2 gap-2">
          {["Male", "Female"].map((option) => (
            <button
              key={option}
              type="button"
              onClick={() => set("gender", option)}
              aria-pressed={form.gender === option}
              className={cn(
                "h-9 rounded-lg border text-sm font-medium transition",
                form.gender === option
                  ? "border-primary bg-primary/10 text-primary dark:text-emerald-300"
                  : "border-input text-foreground hover:bg-muted",
              )}
            >
              {option}
            </button>
          ))}
        </div>
      </Field>
      <Field
        label="Date of birth"
        htmlFor={`${id}-dob`}
        error={errors.dateOfBirth}
        hint={`You must be ${minAge} or older.`}
      >
        <Input
          id={`${id}-dob`}
          type="date"
          value={form.dateOfBirth ?? ""}
          max={new Date().toISOString().slice(0, 10)}
          onChange={(e) => set("dateOfBirth", e.target.value)}
        />
      </Field>
      <Field label="Phone number" htmlFor={`${id}-phone`} error={errors.phone}>
        <Input
          id={`${id}-phone`}
          type="tel"
          value={form.phone}
          onChange={(e) => set("phone", e.target.value)}
          autoComplete="tel"
        />
      </Field>
      <Field
        label="NIN (National Identification Number)"
        htmlFor={`${id}-nin`}
        error={errors.nin}
        hint="11 numbers. It is on your NIN slip or National ID card."
      >
        <Input
          id={`${id}-nin`}
          inputMode="numeric"
          maxLength={11}
          value={form.nin}
          onChange={(e) => set("nin", e.target.value.replace(/\D/g, ""))}
        />
      </Field>
      <Field label="What work do you do?" htmlFor={`${id}-job`} optional>
        <Input
          id={`${id}-job`}
          value={form.occupation}
          onChange={(e) => set("occupation", e.target.value)}
          placeholder="e.g. Teacher, Trader"
        />
      </Field>
      <Field
        label="Home address"
        htmlFor={`${id}-address`}
        error={errors.homeAddress}
        className="sm:col-span-2"
      >
        <Input
          id={`${id}-address`}
          value={form.homeAddress}
          onChange={(e) => set("homeAddress", e.target.value)}
          autoComplete="street-address"
        />
      </Field>
      <Field label="Town or city" htmlFor={`${id}-city`}>
        <Input
          id={`${id}-city`}
          value={form.city}
          onChange={(e) => set("city", e.target.value)}
          autoComplete="address-level2"
        />
      </Field>
      <Field label="State" htmlFor={`${id}-state`}>
        <Input
          id={`${id}-state`}
          value={form.state}
          onChange={(e) => set("state", e.target.value)}
          autoComplete="address-level1"
        />
      </Field>
    </div>
  );
}

/* ---------------- Step 2: photo and ID ---------------- */

function UploadBox({
  title,
  hint,
  url,
  accept,
  capture,
  onFile,
  busy,
  error,
  isImage,
}: {
  title: string;
  hint: string;
  url: string | null;
  accept: string;
  capture?: "user" | "environment";
  onFile: (file: File) => void;
  busy: boolean;
  error?: string;
  isImage: boolean;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const showImage = url && isImage && !url.toLowerCase().endsWith(".pdf");
  return (
    <div className="space-y-2">
      <p className="text-sm font-medium text-foreground">{title}</p>
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
        className={cn(
          "flex w-full items-center gap-4 rounded-2xl border-2 border-dashed p-4 text-left transition hover:bg-muted/50",
          error
            ? "border-destructive/60"
            : url
              ? "border-primary/40"
              : "border-border",
        )}
      >
        {showImage ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={url}
            alt=""
            className="size-20 shrink-0 rounded-xl bg-muted object-cover"
          />
        ) : (
          <span className="flex size-20 shrink-0 items-center justify-center rounded-xl bg-muted text-muted-foreground">
            {busy ? (
              <Loader2 className="size-6 animate-spin" aria-hidden="true" />
            ) : url ? (
              <CheckCircle2
                className="size-6 text-primary"
                aria-hidden="true"
              />
            ) : capture ? (
              <Camera className="size-6" aria-hidden="true" />
            ) : (
              <FileUp className="size-6" aria-hidden="true" />
            )}
          </span>
        )}
        <span className="min-w-0">
          <span className="block text-sm font-medium text-foreground">
            {busy
              ? "Saving…"
              : url
                ? "Added. Tap to change it"
                : "Tap to take a picture or choose a file"}
          </span>
          <span className="block text-xs text-muted-foreground">{hint}</span>
        </span>
      </button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        capture={capture}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = "";
          if (file) onFile(file);
        }}
      />
    </div>
  );
}

export function DocumentsStep({
  session,
  app,
  form,
  set,
  errors,
  requireIdDocument,
  onUploaded,
}: {
  session: JoinSession;
  app: Application;
  form: ApplicationDetails;
  set: SetField;
  errors: Errors;
  requireIdDocument: boolean;
  onUploaded: (kind: "photo" | "id", url: string) => void;
}) {
  const [busy, setBusy] = useState<"photo" | "id" | null>(null);
  const upload = async (kind: "photo" | "id", file: File) => {
    if (file.size > 5 * 1024 * 1024) {
      toast.error("That file is too big", {
        description: "It must be 5 MB or smaller.",
      });
      return;
    }
    setBusy(kind);
    try {
      const url = await joinService.upload(
        session.applicationId,
        session.token,
        kind,
        file,
      );
      onUploaded(kind, url);
    } catch (error) {
      toast.error("We couldn't save your file", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="grid gap-6 sm:grid-cols-2">
      <UploadBox
        title="Passport photograph"
        hint="A clear photo of your face, looking straight ahead. JPG or PNG, up to 5 MB."
        url={app.photoUrl}
        accept="image/png,image/jpeg,image/webp"
        capture="user"
        isImage
        busy={busy === "photo"}
        error={errors.photo}
        onFile={(file) => upload("photo", file)}
      />
      <div className="space-y-3">
        <Field
          label={
            requireIdDocument
              ? "Your ID card"
              : "Your ID card (if you have one)"
          }
          error={errors.idDocumentType}
        >
          <Select
            value={form.idDocumentType}
            onValueChange={(value) => set("idDocumentType", value as string)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Which ID card is it?" />
            </SelectTrigger>
            <SelectContent>
              {ID_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <UploadBox
          title="Picture of the ID card"
          hint="Make sure your name, photo and number are clear. Picture or PDF, up to 5 MB."
          url={app.idDocumentUrl}
          accept="image/png,image/jpeg,image/webp,application/pdf"
          capture="environment"
          isImage
          busy={busy === "id"}
          error={errors.idDocument}
          onFile={(file) => upload("id", file)}
        />
      </div>
    </div>
  );
}

/* ---------------- Step 3: guarantors ---------------- */

export interface GuarantorDraft extends GuarantorInput {
  /** What the applicant sees for a member guarantor (short name from the lookup). */
  label?: string;
}

export function GuarantorsStep({
  session,
  coop,
  guarantors,
  setGuarantors,
  error,
}: {
  session: JoinSession;
  coop: CoopApplyInfo;
  guarantors: GuarantorDraft[];
  setGuarantors: (next: GuarantorDraft[]) => void;
  error?: string;
}) {
  const id = useId();
  const [memberId, setMemberId] = useState("");
  const [checking, setChecking] = useState(false);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [outsider, setOutsider] = useState({ name: "", phone: "" });
  const [showOutsider, setShowOutsider] = useState(false);
  const allowOutsiders = coop.guarantors.source !== "CoopOnly";
  const fromCoop = guarantors.filter((g) => g.memberId).length;
  const fromOutside = guarantors.length - fromCoop;

  const addMember = async () => {
    const wanted = memberId.trim();
    if (!wanted) return;
    if (
      guarantors.some((g) => g.memberId?.toLowerCase() === wanted.toLowerCase())
    ) {
      setLookupError("You already added this person.");
      return;
    }
    setChecking(true);
    setLookupError(null);
    try {
      const found = await joinService.lookupGuarantor(
        session.applicationId,
        session.token,
        wanted,
      );
      setGuarantors([
        ...guarantors,
        { memberId: found.memberId, label: found.name },
      ]);
      setMemberId("");
    } catch (err) {
      setLookupError(
        err instanceof Error ? err.message : "We couldn't check that ID.",
      );
    } finally {
      setChecking(false);
    }
  };

  const addOutsider = () => {
    if (!outsider.name.trim() || !outsider.phone.trim()) {
      setLookupError("Enter the person's full name and phone number.");
      return;
    }
    setGuarantors([
      ...guarantors,
      { name: outsider.name.trim(), phone: outsider.phone.trim() },
    ]);
    setOutsider({ name: "", phone: "" });
    setShowOutsider(false);
    setLookupError(null);
  };

  return (
    <div className="space-y-5">
      <p className="rounded-2xl bg-muted/60 p-4 text-sm text-muted-foreground">
        {guarantorRuleText(coop.guarantors)} A member who stands for you will
        get a message asking if they know you, so please tell them first.
      </p>

      <div className="space-y-2">
        <Label htmlFor={`${id}-member`}>Add a member of {coop.name}</Label>
        <div className="flex gap-2">
          <Input
            id={`${id}-member`}
            value={memberId}
            onChange={(e) => {
              setMemberId(e.target.value);
              setLookupError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                void addMember();
              }
            }}
            placeholder="Their Membership ID, e.g. MB-0012"
          />
          <Button
            type="button"
            onClick={addMember}
            disabled={checking || !memberId.trim()}
          >
            {checking ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Search className="size-4" aria-hidden="true" />
            )}
            Check
          </Button>
        </div>
        <p className="text-xs text-muted-foreground">
          Ask them for their Membership ID. It is the ID they use to log in.
        </p>
      </div>

      {allowOutsiders ? (
        showOutsider ? (
          <div className="space-y-3 rounded-2xl border border-border p-4">
            <p className="text-sm font-medium text-foreground">
              Someone from outside the co-operative
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Input
                value={outsider.name}
                onChange={(e) =>
                  setOutsider({ ...outsider, name: e.target.value })
                }
                placeholder="Full name"
                aria-label="Guarantor's full name"
              />
              <Input
                type="tel"
                value={outsider.phone}
                onChange={(e) =>
                  setOutsider({ ...outsider, phone: e.target.value })
                }
                placeholder="Phone number"
                aria-label="Guarantor's phone number"
              />
            </div>
            <div className="flex gap-2">
              <Button type="button" size="sm" onClick={addOutsider}>
                Add this person
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() => setShowOutsider(false)}
              >
                Cancel
              </Button>
            </div>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowOutsider(true)}
          >
            <Plus className="size-4" aria-hidden="true" />
            Add someone from outside the co-operative
          </Button>
        )
      ) : null}

      {lookupError ? (
        <p className="text-sm text-destructive">{lookupError}</p>
      ) : null}

      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <p className="font-medium text-foreground">Your guarantors</p>
          {coop.guarantors.required ? (
            <p
              className={cn(
                "text-xs",
                guarantors.length >= coop.guarantors.min
                  ? "text-primary"
                  : "text-muted-foreground",
              )}
            >
              {guarantors.length} of {coop.guarantors.min} added
              {coop.guarantors.source === "Mix"
                ? ` (${fromCoop} member${fromCoop === 1 ? "" : "s"}, ${fromOutside} from outside)`
                : ""}
            </p>
          ) : null}
        </div>
        {guarantors.length === 0 ? (
          <p className="rounded-2xl border border-dashed border-border px-4 py-6 text-center text-sm text-muted-foreground">
            No guarantor added yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {guarantors.map((g, index) => (
              <li
                key={`${g.memberId ?? g.phone}-${index}`}
                className="flex items-center gap-3 rounded-2xl bg-card p-3 ring-1 ring-border/70"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:text-emerald-300">
                  <UserRound className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {g.label ?? g.name ?? g.memberId}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {g.memberId
                      ? `Member · ${g.memberId}`
                      : `From outside · ${g.phone}`}
                  </p>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove this guarantor"
                  onClick={() =>
                    setGuarantors(guarantors.filter((_, i) => i !== index))
                  }
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </Button>
              </li>
            ))}
          </ul>
        )}
      </div>
      {error ? (
        <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {error}
        </p>
      ) : null}
    </div>
  );
}

/* ---------------- Step 4: next of kin and bank ---------------- */

export function KinAndBankStep({
  session,
  form,
  set,
  errors,
}: {
  session: JoinSession;
  form: ApplicationDetails;
  set: SetField;
  errors: Errors;
}) {
  const id = useId();
  const { data: banks = [], isLoading: banksLoading } = useQuery({
    queryKey: ["join-banks"],
    queryFn: () => joinService.banks(),
    staleTime: 60 * 60 * 1000,
  });
  const [resolving, setResolving] = useState(false);
  const [resolveError, setResolveError] = useState<string | null>(null);
  const { bankCode, accountNumber } = form;

  useEffect(() => {
    if (!bankCode || accountNumber.length !== 10) return;
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      setResolving(true);
      setResolveError(null);
      try {
        const name = await joinService.resolveAccount(
          session.applicationId,
          session.token,
          accountNumber,
          bankCode,
        );
        if (!cancelled) set("accountName", name);
      } catch (err) {
        if (!cancelled) {
          set("accountName", "");
          setResolveError(
            err instanceof Error
              ? err.message
              : "We couldn't check that account.",
          );
        }
      } finally {
        if (!cancelled) setResolving(false);
      }
    }, 400);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // `set` is stable for the life of the form.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bankCode, accountNumber, session.applicationId, session.token]);

  return (
    <div className="space-y-6">
      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">Next of kin</h3>
          <p className="text-xs text-muted-foreground">
            Someone close to you the co-operative can call if they can&apos;t
            reach you.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field
            label="Their full name"
            htmlFor={`${id}-kin`}
            error={errors.nextOfKinName}
          >
            <Input
              id={`${id}-kin`}
              value={form.nextOfKinName}
              onChange={(e) => set("nextOfKinName", e.target.value)}
            />
          </Field>
          <Field
            label="Their phone number"
            htmlFor={`${id}-kin-phone`}
            error={errors.nextOfKinPhone}
          >
            <Input
              id={`${id}-kin-phone`}
              type="tel"
              value={form.nextOfKinPhone}
              onChange={(e) => set("nextOfKinPhone", e.target.value)}
            />
          </Field>
          <Field label="How are they related to you?">
            <Select
              value={form.nextOfKinRelationship}
              onValueChange={(value) =>
                set("nextOfKinRelationship", value as string)
              }
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Choose one" />
              </SelectTrigger>
              <SelectContent>
                {RELATIONSHIPS.map((relation) => (
                  <SelectItem key={relation} value={relation}>
                    {relation}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground">
            Your bank account
          </h3>
          <p className="text-xs text-muted-foreground">
            Where the co-operative pays you (for example, money you take out of
            your savings). It must be in your own name.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Bank" optional>
            <Combobox
              value={form.bankCode}
              onValueChange={(value) => {
                set("bankCode", value);
                set("accountName", "");
              }}
              options={banks.map((bank) => ({
                value: bank.code,
                label: bank.name,
              }))}
              placeholder="Choose your bank"
              searchPlaceholder="Type your bank's name"
              loading={banksLoading}
            />
          </Field>
          <Field
            label="Account number"
            htmlFor={`${id}-acct`}
            error={errors.accountNumber}
            optional
          >
            <Input
              id={`${id}-acct`}
              inputMode="numeric"
              maxLength={10}
              value={form.accountNumber}
              onChange={(e) => {
                set("accountNumber", e.target.value.replace(/\D/g, ""));
                set("accountName", "");
              }}
            />
          </Field>
        </div>
        {resolving ? (
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Checking the account name…
          </p>
        ) : form.accountName ? (
          <p className="flex items-center gap-2 rounded-xl bg-primary/10 px-3 py-2 text-sm text-primary dark:text-emerald-300">
            <CheckCircle2 className="size-4" aria-hidden="true" />
            Account name:{" "}
            <span className="font-semibold">{form.accountName}</span>
          </p>
        ) : resolveError ? (
          <p className="flex items-center gap-2 text-sm text-destructive">
            <X className="size-4" aria-hidden="true" />
            {resolveError}
          </p>
        ) : null}
      </section>
    </div>
  );
}
