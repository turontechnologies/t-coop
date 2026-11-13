"use client";

import { useMemo } from "react";
import {
  CheckCircle2,
  Circle,
  Plus,
  TriangleAlert,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Combobox } from "@/components/ui/combobox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAlternativeIdLabel } from "@/components/features/shared/member-id";
import { coopMemberFullName, type CoopMember } from "@/lib/coop-data";
import {
  countGuarantors,
  describeGuarantorRules,
  newGuarantorEntry,
  type GuarantorEntry,
  type GuarantorProblems,
  type GuarantorRules,
} from "@/lib/member-guarantors";
import { cn } from "@/lib/utils";

interface GuarantorListEditorProps {
  coopId: string;
  rules: GuarantorRules;
  entries: GuarantorEntry[];
  onChange: (entries: GuarantorEntry[]) => void;
  /** Members of the co-op to pick from. */
  members: CoopMember[];
  /** The member being edited — they can't guarantee themselves. */
  selfId?: string;
  /** Shown only after the admin tries to save. */
  problems?: GuarantorProblems;
  /** A message from the server about the list. */
  serverError?: string;
  disabled?: boolean;
}

/**
 * The guarantors on Add/Edit Member: each one is either a member of the co-op (picked from the
 * list) or someone outside it (name, phone, optional email). The co-op's rules sit on top with a
 * live tally, so the admin can see what's still missing before saving.
 */
export function GuarantorListEditor({
  coopId,
  rules,
  entries,
  onChange,
  members,
  selfId,
  problems,
  serverError,
  disabled,
}: GuarantorListEditorProps) {
  const altLabel = useAlternativeIdLabel(coopId);
  const allowOutside = rules.source !== "CoopOnly";
  const counts = countGuarantors(entries);

  const options = useMemo(
    () =>
      members
        .filter((member) => member.status === "Active" && member.id !== selfId)
        .map((member) => ({
          value: member.id,
          label: `${coopMemberFullName(member)} — ${member.id}${
            member.alternativeId ? ` · ${altLabel} ${member.alternativeId}` : ""
          }`,
        })),
    [members, selfId, altLabel],
  );

  const update = (key: string, patch: Partial<GuarantorEntry>) =>
    onChange(
      entries.map((entry) =>
        entry.key === key ? { ...entry, ...patch } : entry,
      ),
    );

  const tally: { label: string; done: boolean }[] = rules.required
    ? [
        {
          label: `${Math.min(counts.total, rules.min)} of ${rules.min} added`,
          done: counts.total >= rules.min,
        },
        ...(rules.source === "Mix" && rules.fromCoop > 0
          ? [
              {
                label: `${Math.min(counts.fromCoop, rules.fromCoop)}/${rules.fromCoop} from the co-op`,
                done: counts.fromCoop >= rules.fromCoop,
              },
            ]
          : []),
        ...(rules.source === "Mix" && rules.fromOutside > 0
          ? [
              {
                label: `${Math.min(counts.fromOutside, rules.fromOutside)}/${rules.fromOutside} from outside`,
                done: counts.fromOutside >= rules.fromOutside,
              },
            ]
          : []),
      ]
    : [];

  const listError = serverError ?? problems?.list;

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-xl border border-border bg-muted/40 p-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-0.5">
          <p className="text-sm font-medium text-foreground">
            {rules.required ? "Required" : "Optional"}
          </p>
          <p className="text-xs text-muted-foreground">
            {describeGuarantorRules(rules)}
          </p>
        </div>
        {tally.length > 0 ? (
          <ul
            className="flex flex-wrap gap-2"
            aria-label="Guarantor requirements"
          >
            {tally.map((item) => (
              <li
                key={item.label}
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                  item.done
                    ? "bg-success/10 text-success"
                    : "bg-background text-muted-foreground ring-1 ring-border",
                )}
              >
                {item.done ? (
                  <CheckCircle2 className="size-3.5" aria-hidden="true" />
                ) : (
                  <Circle className="size-3.5" aria-hidden="true" />
                )}
                {item.label}
              </li>
            ))}
          </ul>
        ) : null}
      </div>

      {entries.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
          No guarantors added.
        </p>
      ) : (
        <ol className="space-y-3">
          {entries.map((entry, index) => {
            const rowError = problems?.rows[entry.key];
            const taken = new Set(
              entries
                .filter(
                  (other) => other.key !== entry.key && other.kind === "member",
                )
                .map((other) => other.memberId),
            );
            return (
              <li
                key={entry.key}
                className={cn(
                  "space-y-3 rounded-xl border p-4",
                  rowError ? "border-destructive/60" : "border-border",
                )}
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="text-sm font-medium text-foreground">
                    Guarantor {index + 1}
                  </p>
                  <div className="flex items-center gap-2">
                    {allowOutside ? (
                      <div
                        role="radiogroup"
                        aria-label={`Guarantor ${index + 1} is`}
                        className="inline-flex rounded-lg bg-muted p-0.5"
                      >
                        <KindButton
                          active={entry.kind === "member"}
                          disabled={disabled}
                          onClick={() => update(entry.key, { kind: "member" })}
                          icon={
                            <UsersRound
                              className="size-3.5"
                              aria-hidden="true"
                            />
                          }
                        >
                          Co-op member
                        </KindButton>
                        <KindButton
                          active={entry.kind === "outside"}
                          disabled={disabled}
                          onClick={() => update(entry.key, { kind: "outside" })}
                          icon={
                            <UserRound
                              className="size-3.5"
                              aria-hidden="true"
                            />
                          }
                        >
                          Outside the co-op
                        </KindButton>
                      </div>
                    ) : null}
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon-sm"
                      aria-label={`Remove guarantor ${index + 1}`}
                      disabled={disabled}
                      onClick={() =>
                        onChange(
                          entries.filter((other) => other.key !== entry.key),
                        )
                      }
                    >
                      <X className="size-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>

                {entry.kind === "member" ? (
                  <div className="space-y-2">
                    <Label className="sr-only">Member</Label>
                    <Combobox
                      value={entry.memberId}
                      onValueChange={(value) =>
                        update(entry.key, { memberId: value })
                      }
                      options={options.filter(
                        (option) => !taken.has(option.value),
                      )}
                      placeholder="Pick a member of the co-operative"
                      searchPlaceholder={`Search by name, ID or ${altLabel}…`}
                      emptyText="No active member matches"
                      disabled={disabled}
                      ariaInvalid={!!rowError}
                    />
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                    <Input
                      aria-label={`Guarantor ${index + 1} full name`}
                      placeholder="Full name"
                      value={entry.name}
                      onChange={(event) =>
                        update(entry.key, { name: event.target.value })
                      }
                      disabled={disabled}
                      className="h-11"
                    />
                    <Input
                      aria-label={`Guarantor ${index + 1} phone`}
                      type="tel"
                      placeholder="Phone number"
                      value={entry.phone}
                      onChange={(event) =>
                        update(entry.key, { phone: event.target.value })
                      }
                      disabled={disabled}
                      className="h-11"
                    />
                    <Input
                      aria-label={`Guarantor ${index + 1} email (optional)`}
                      type="email"
                      placeholder="Email (optional)"
                      value={entry.email}
                      onChange={(event) =>
                        update(entry.key, { email: event.target.value })
                      }
                      disabled={disabled}
                      className="h-11"
                    />
                  </div>
                )}
                {rowError ? <ErrorText message={rowError} /> : null}
              </li>
            );
          })}
        </ol>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={disabled || entries.length >= 10}
          onClick={() =>
            onChange([...entries, newGuarantorEntry(nextKind(rules, entries))])
          }
        >
          <Plus className="size-4" aria-hidden="true" />
          Add guarantor
        </Button>
        {listError ? <ErrorText message={listError} /> : null}
      </div>
    </div>
  );
}

/** A new row starts on whichever side the rules still need. */
function nextKind(
  rules: GuarantorRules,
  entries: GuarantorEntry[],
): GuarantorEntry["kind"] {
  if (rules.source !== "Mix") return "member";
  const counts = countGuarantors(entries);
  if (counts.fromCoop < rules.fromCoop) return "member";
  if (counts.fromOutside < rules.fromOutside) return "outside";
  return "member";
}

function KindButton({
  active,
  disabled,
  onClick,
  icon,
  children,
}: {
  active: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-medium transition-colors disabled:opacity-50",
        active
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {children}
    </button>
  );
}

function ErrorText({ message }: { message: string }) {
  return (
    <p
      role="alert"
      className="flex items-center gap-1.5 text-sm text-destructive"
    >
      <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
