"use client";

import { useMemo, useState } from "react";
import { ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface GuarantorOption {
  id: string;
  name: string;
  /** e.g. "Admin" — shown next to the name. */
  tag?: string;
}

interface GuarantorMultiSelectProps {
  id?: string;
  options: GuarantorOption[];
  value: string[];
  onChange: (value: string[]) => void;
  min: number;
  disabled?: boolean;
  /** What the co-op calls this loan mode, e.g. "Times three". */
  modeName?: string;
}

/**
 * Pick two or more guarantors for a loan — a searchable checklist, with the picks shown as
 * removable chips. Anyone in the co-op (members or the admin) can stand as guarantor.
 */
export function GuarantorMultiSelect({
  id,
  options,
  value,
  onChange,
  min,
  disabled,
  modeName = "Times two",
}: GuarantorMultiSelectProps) {
  const [search, setSearch] = useState("");
  const selected = options.filter((option) => value.includes(option.id));

  const visible = useMemo(() => {
    const query = search.trim().toLowerCase();
    return query
      ? options.filter(
          (option) =>
            option.name.toLowerCase().includes(query) ||
            option.id.toLowerCase().includes(query),
        )
      : options;
  }, [options, search]);

  const toggle = (optionId: string) =>
    onChange(
      value.includes(optionId)
        ? value.filter((v) => v !== optionId)
        : [...value, optionId],
    );

  const remaining = Math.max(min - value.length, 0);

  return (
    <div className="space-y-2">
      <Popover>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              disabled={disabled}
              className="h-auto min-h-11 w-full justify-between gap-2 py-2 font-normal"
            />
          }
        >
          <span
            className={cn(
              "truncate text-left",
              selected.length === 0 && "text-muted-foreground",
            )}
          >
            {selected.length === 0
              ? `Select at least ${min} guarantors`
              : `${selected.length} selected`}
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-(--anchor-width) min-w-72 p-0"
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by name or ID"
                className="h-9 pl-9"
                aria-label="Search guarantors"
              />
            </div>
          </div>
          <ul
            className="max-h-64 overflow-y-auto p-1"
            role="listbox"
            aria-multiselectable="true"
          >
            {visible.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-muted-foreground">
                No one matches that search.
              </li>
            ) : (
              visible.map((option) => {
                const checked = value.includes(option.id);
                return (
                  <li key={option.id}>
                    <label
                      className={cn(
                        "flex cursor-pointer items-center gap-3 rounded-md px-3 py-2 text-sm hover:bg-muted",
                        checked && "bg-accent/50",
                      )}
                    >
                      <Checkbox
                        checked={checked}
                        onCheckedChange={() => toggle(option.id)}
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-foreground">
                          {option.name}
                        </span>
                        <span className="block text-xs text-muted-foreground">
                          {option.id}
                          {option.tag ? ` · ${option.tag}` : ""}
                        </span>
                      </span>
                    </label>
                  </li>
                );
              })
            )}
          </ul>
        </PopoverContent>
      </Popover>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((option) => (
            <span
              key={option.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent px-3 py-1 text-xs font-medium text-foreground"
            >
              {option.name}
              <button
                type="button"
                onClick={() => toggle(option.id)}
                disabled={disabled}
                className="rounded-full text-muted-foreground hover:text-foreground"
                aria-label={`Remove ${option.name}`}
              >
                <X className="size-3.5" aria-hidden="true" />
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <p
        className={cn(
          "text-xs",
          remaining > 0 ? "text-muted-foreground" : "text-success",
        )}
      >
        {remaining > 0
          ? `Pick ${remaining} more — a ${modeName} loan needs at least ${min} guarantors. Each one is asked to accept.`
          : `${value.length} guarantors selected. Each one will be asked to accept.`}
      </p>
    </div>
  );
}
