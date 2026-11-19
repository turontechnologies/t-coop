"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Copy, ExternalLink, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
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
import { Textarea } from "@/components/ui/textarea";
import { useCurrency } from "@/components/providers/currency-provider";
import { useCoopSavingsTypes } from "@/hooks/use-coop-savings";
import { formatMoney } from "@/lib/format";
import {
  membershipAdminService,
  type RegistrationSettings,
  type RegistrationSettingsInput,
} from "@/services/membership.service";
import { useAuthStore } from "@/store/auth.store";

const toInput = (
  settings: RegistrationSettings,
): RegistrationSettingsInput => ({
  open: settings.open,
  formFee: settings.formFee,
  firstSavings: settings.firstSavings,
  savingsTypeId: settings.savingsTypeId,
  rules: settings.rules,
  requirements: settings.requirements,
  requireIdDocument: settings.requireIdDocument,
  minAge: settings.minAge,
});

/** Settings → New Members: whether people can apply online, the joining fee, rules and what to bring. */
export function RegistrationSettingsForm() {
  const member = useAuthStore((state) => state.member);
  const coopId = member?.cooperativeId ?? member?.id ?? "";
  const currency = useCurrency();
  const id = useId();
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["registration-settings", coopId],
    queryFn: () => membershipAdminService.settings(coopId),
    enabled: Boolean(coopId),
  });
  const { data: savingsTypes = [] } = useCoopSavingsTypes(coopId);
  const save = useMutation({
    mutationFn: (input: RegistrationSettingsInput) =>
      membershipAdminService.saveSettings(coopId, input),
    onSuccess: (result) =>
      queryClient.setQueryData(["registration-settings", coopId], result),
  });
  // What the admin is changing; until they change something, what's saved.
  const [draft, setDraft] = useState<RegistrationSettingsInput | null>(null);
  const [formFeeText, setFormFeeText] = useState<string | null>(null);
  const [savingsText, setSavingsText] = useState<string | null>(null);

  if (isLoading || !data) {
    return <div className="h-64 animate-pulse rounded-2xl bg-muted" />;
  }

  const value = draft ?? toInput(data);
  const update = (patch: Partial<RegistrationSettingsInput>) =>
    setDraft({ ...value, ...patch });
  const total =
    (Number(value.formFee) || 0) + (Number(value.firstSavings) || 0);
  const link =
    typeof window === "undefined"
      ? `/join/${coopId}`
      : `${window.location.origin}/join/${encodeURIComponent(coopId)}`;
  const activeTypes = savingsTypes.filter((type) => type.status === "Active");
  const money = (amount: number) => formatMoney(amount, currency);

  const problem =
    value.firstSavings > 0 && !value.savingsTypeId
      ? "Choose which savings the first savings goes into."
      : value.open && total > 0 && !data.canPayOnline
        ? "To charge a joining fee, first connect Paystack or Flutterwave in Settings → Integrations."
        : null;

  const submit = async () => {
    try {
      await save.mutateAsync(value);
      setDraft(null);
      setFormFeeText(null);
      setSavingsText(null);
      toast.success("Saved", {
        description: value.open
          ? "People can now apply to join online."
          : "Online applications are closed.",
      });
    } catch (error) {
      toast.error("Couldn't save", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const moneyInput = (
    text: string | null,
    amount: number,
    setText: (v: string) => void,
    key: "formFee" | "firstSavings",
    inputId: string,
  ) => (
    <Input
      id={inputId}
      inputMode="decimal"
      value={text ?? String(amount)}
      onChange={(event) => {
        const cleaned = event.target.value.replace(/[^\d.]/g, "");
        setText(cleaned);
        update({ [key]: Number(cleaned) || 0 });
      }}
    />
  );

  return (
    <Card>
      <CardContent className="space-y-6">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:text-emerald-300">
            <UserPlus className="size-5" aria-hidden="true" />
          </span>
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">
              People applying to join
            </p>
            <p className="text-sm text-muted-foreground">
              Let people apply to become members online. They read your rules
              first, fill a form with their photo, ID card and guarantors, and
              pay the joining fee. You then check and approve or reject them.
            </p>
          </div>
          {data.waitingCount > 0 ? (
            <Button
              size="sm"
              variant="outline"
              nativeButton={false}
              render={<Link href="/members/applications" />}
            >
              {data.waitingCount} waiting
            </Button>
          ) : null}
        </div>

        <label className="flex items-center justify-between gap-4 rounded-2xl bg-muted/50 p-4">
          <span>
            <span className="block text-sm font-medium text-foreground">
              Take applications online
            </span>
            <span className="block text-xs text-muted-foreground">
              Turn off to stop new applications. People already waiting are not
              affected.
            </span>
          </span>
          <Switch
            checked={value.open}
            onCheckedChange={(checked) => update({ open: checked })}
          />
        </label>

        <div className="space-y-2 rounded-2xl bg-muted/40 p-4">
          <p className="text-sm font-medium text-foreground">Joining link</p>
          <p className="text-xs text-muted-foreground">
            Share this link (on WhatsApp, for example). People can also find you
            on the Join page.
          </p>
          <div className="flex flex-wrap gap-2">
            <code className="min-w-0 flex-1 truncate rounded-lg bg-background px-3 py-2 text-xs ring-1 ring-border">
              {link}
            </code>
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                void navigator.clipboard?.writeText(link);
                toast.success("Link copied");
              }}
            >
              <Copy className="size-4" aria-hidden="true" />
              Copy
            </Button>
            <Button
              size="sm"
              variant="ghost"
              nativeButton={false}
              render={<a href={link} target="_blank" rel="noreferrer" />}
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Open
            </Button>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium text-foreground">Joining fee</p>
            <p className="text-xs text-muted-foreground">
              Paid once, online, at the end of the form. Put 0 in both boxes for
              no fee.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-form`}>Form fee</Label>
              {moneyInput(
                formFeeText,
                value.formFee,
                setFormFeeText,
                "formFee",
                `${id}-form`,
              )}
              <p className="text-xs text-muted-foreground">
                The co-operative keeps this.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={`${id}-savings`}>First savings</Label>
              {moneyInput(
                savingsText,
                value.firstSavings,
                setSavingsText,
                "firstSavings",
                `${id}-savings`,
              )}
              <p className="text-xs text-muted-foreground">
                Goes into the new member&apos;s savings when approved.
              </p>
            </div>
            <div className="space-y-1.5">
              <Label>Total they pay</Label>
              <p className="flex h-9 items-center rounded-lg bg-primary/10 px-3 text-sm font-semibold text-primary dark:text-emerald-300">
                {money(total)}
              </p>
            </div>
          </div>
          {value.firstSavings > 0 ? (
            <div className="space-y-1.5 sm:max-w-sm">
              <Label>First savings goes into</Label>
              <Select
                value={value.savingsTypeId ?? ""}
                onValueChange={(v) =>
                  update({ savingsTypeId: (v as string) || null })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose a savings type" />
                </SelectTrigger>
                <SelectContent>
                  {activeTypes.map((type) => (
                    <SelectItem key={type.id} value={type.id}>
                      {type.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {activeTypes.length === 0 ? (
                <p className="text-xs text-muted-foreground">
                  Add a savings type in Settings → Savings first.
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor={`${id}-age`}>Youngest age allowed</Label>
            <Input
              id={`${id}-age`}
              type="number"
              min={16}
              max={100}
              value={value.minAge}
              onChange={(event) =>
                update({ minAge: Number(event.target.value) || 18 })
              }
            />
          </div>
          <label className="flex items-center justify-between gap-4 rounded-2xl bg-muted/50 p-4">
            <span>
              <span className="block text-sm font-medium text-foreground">
                Ask for an ID card
              </span>
              <span className="block text-xs text-muted-foreground">
                National ID, voter&apos;s card, driver&apos;s licence or
                passport.
              </span>
            </span>
            <Switch
              checked={value.requireIdDocument}
              onCheckedChange={(checked) =>
                update({ requireIdDocument: checked })
              }
            />
          </label>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor={`${id}-rules`}>Your rules</Label>
          <Textarea
            id={`${id}-rules`}
            rows={8}
            value={value.rules ?? ""}
            onChange={(event) => update({ rules: event.target.value })}
            placeholder={
              "For example:\n1. Every member saves at least ₦5,000 every month.\n2. Members attend the general meeting every quarter.\n3. You can take a loan after 6 months of saving.\n4. The form fee is not refunded."
            }
          />
          <p className="text-xs text-muted-foreground">
            People must read these before they can start the form.
          </p>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-2">
            <Label htmlFor={`${id}-needs`}>
              What people need to have ready
            </Label>
            <Button
              size="xs"
              variant="ghost"
              onClick={() =>
                update({ requirements: data.defaultRequirements.join("\n") })
              }
            >
              Use the standard list
            </Button>
          </div>
          <Textarea
            id={`${id}-needs`}
            rows={6}
            value={value.requirements ?? ""}
            onChange={(event) => update({ requirements: event.target.value })}
            placeholder={data.defaultRequirements.join("\n")}
          />
          <p className="text-xs text-muted-foreground">
            One item on each line. Leave it empty to show the standard list.
          </p>
        </div>

        {problem ? (
          <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
            {problem}
          </p>
        ) : null}

        <div className="flex flex-wrap gap-2">
          <Button
            onClick={submit}
            disabled={save.isPending || !draft || Boolean(problem)}
          >
            {save.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : null}
            Save
          </Button>
          {draft ? (
            <Button
              variant="outline"
              disabled={save.isPending}
              onClick={() => {
                setDraft(null);
                setFormFeeText(null);
                setSavingsText(null);
              }}
            >
              Cancel changes
            </Button>
          ) : null}
        </div>
      </CardContent>
    </Card>
  );
}
