"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { highlightParts, initialsOf, searchMembers } from "@/lib/member-search";
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

function Highlighted({ text, query }: { text: string; query: string }) {
  return (
    <>
      {highlightParts(text, query).map((part, index) =>
        part.match ? (
          <mark
            key={index}
            className="rounded-sm bg-primary/15 px-0.5 text-inherit dark:bg-emerald-400/20"
          >
            {part.text}
          </mark>
        ) : (
          <span key={index}>{part.text}</span>
        ),
      )}
    </>
  );
}

/**
 * Pick the guarantors for a loan. Search by name (any order, "ade bola") or membership ID
 * ("12", "0012" and "MB-0012" all work); best matches come first and the matching text is
 * highlighted. Arrow keys move, Enter picks, and the picks show as removable chips. Anyone in
 * the co-op (members or the admin) can stand as guarantor.
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
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const selected = value
    .map((selectedId) => options.find((option) => option.id === selectedId))
    .filter((option): option is GuarantorOption => Boolean(option));

  const visible = useMemo(
    () => searchMembers(options, search),
    [options, search],
  );

  useEffect(() => {
    if (open) requestAnimationFrame(() => inputRef.current?.focus());
    else setSearch("");
  }, [open]);

  useEffect(() => {
    listRef.current
      ?.querySelector<HTMLElement>(`[data-index="${active}"]`)
      ?.scrollIntoView({ block: "nearest" });
  }, [active]);

  const toggle = (optionId: string) =>
    onChange(
      value.includes(optionId)
        ? value.filter((v) => v !== optionId)
        : [...value, optionId],
    );

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActive((index) => Math.min(index + 1, visible.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActive((index) => Math.max(index - 1, 0));
    } else if (event.key === "Enter") {
      event.preventDefault();
      const option = visible[active];
      if (option) {
        toggle(option.id);
        setSearch("");
        setActive(0);
      }
    } else if (event.key === "Backspace" && !search && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const remaining = Math.max(min - value.length, 0);
  const progress = min > 0 ? Math.min(value.length / min, 1) : 1;

  return (
    <div className="space-y-2">
      <Popover open={open} onOpenChange={setOpen}>
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
          <span className="flex min-w-0 items-center gap-2">
            <Search
              className="size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span
              className={cn(
                "truncate text-left",
                selected.length === 0 && "text-muted-foreground",
              )}
            >
              {selected.length === 0
                ? `Search members by name or ID`
                : `${selected.length} selected · add more`}
            </span>
          </span>
          <ChevronDown
            className="size-4 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
        </PopoverTrigger>
        <PopoverContent
          align="start"
          className="w-(--anchor-width) min-w-80 p-0"
        >
          <div className="border-b border-border p-2">
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <input
                ref={inputRef}
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onKeyDown}
                placeholder="Name or ID, e.g. “ade” or “0012”"
                className="h-10 w-full rounded-lg border border-input bg-transparent pr-9 pl-9 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                aria-label="Search guarantors"
                role="combobox"
                aria-expanded="true"
                aria-controls="guarantor-options"
                aria-activedescendant={
                  visible[active]
                    ? `guarantor-${visible[active].id}`
                    : undefined
                }
              />
              {search ? (
                <button
                  type="button"
                  aria-label="Clear search"
                  onClick={() => {
                    setSearch("");
                    inputRef.current?.focus();
                  }}
                  className="absolute top-1/2 right-2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  <X className="size-3.5" aria-hidden="true" />
                </button>
              ) : null}
            </div>
            <p className="mt-1.5 px-1 text-[11px] text-muted-foreground">
              {search
                ? `${visible.length} match${visible.length === 1 ? "" : "es"}`
                : `${options.length} members`}{" "}
              · ↑↓ to move, Enter to pick
            </p>
          </div>
          <ul
            ref={listRef}
            id="guarantor-options"
            className="max-h-72 overflow-y-auto p-1"
            role="listbox"
            aria-multiselectable="true"
          >
            {visible.length === 0 ? (
              <li className="px-3 py-8 text-center text-sm text-muted-foreground">
                No member matches “{search}”.
                <span className="mt-1 block text-xs">
                  Try part of their name or their membership ID.
                </span>
              </li>
            ) : (
              visible.map((option, index) => {
                const checked = value.includes(option.id);
                return (
                  <li
                    key={option.id}
                    id={`guarantor-${option.id}`}
                    data-index={index}
                    role="option"
                    aria-selected={checked}
                    onMouseEnter={() => setActive(index)}
                    onClick={() => toggle(option.id)}
                    className={cn(
                      "flex cursor-pointer items-center gap-3 rounded-md px-2.5 py-2 text-sm",
                      index === active && "bg-muted",
                      checked && "bg-accent/60",
                    )}
                  >
                    <span
                      className={cn(
                        "flex size-8 shrink-0 items-center justify-center rounded-full text-[11px] font-semibold",
                        checked
                          ? "bg-primary text-primary-foreground"
                          : "bg-primary/10 text-primary dark:text-emerald-300",
                      )}
                      aria-hidden="true"
                    >
                      {checked ? (
                        <Check className="size-4" />
                      ) : (
                        initialsOf(option.name)
                      )}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-foreground">
                        <Highlighted text={option.name} query={search} />
                      </span>
                      <span className="block text-xs text-muted-foreground">
                        <Highlighted text={option.id} query={search} />
                        {option.tag ? ` · ${option.tag}` : ""}
                      </span>
                    </span>
                    {checked ? (
                      <span className="text-[11px] font-semibold text-primary dark:text-emerald-300">
                        Picked
                      </span>
                    ) : null}
                  </li>
                );
              })
            )}
          </ul>
          {selected.length > 0 ? (
            <div className="flex items-center justify-between gap-2 border-t border-border px-3 py-2">
              <span className="text-xs text-muted-foreground">
                {selected.length} of at least {min} picked
              </span>
              <Button size="sm" type="button" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          ) : null}
        </PopoverContent>
      </Popover>

      {selected.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {selected.map((option) => (
            <span
              key={option.id}
              className="inline-flex items-center gap-1.5 rounded-full bg-accent py-1 pr-1.5 pl-1 text-xs font-medium text-foreground"
            >
              <span
                className="flex size-5 items-center justify-center rounded-full bg-primary/15 text-[9px] font-semibold text-primary dark:text-emerald-300"
                aria-hidden="true"
              >
                {initialsOf(option.name)}
              </span>
              {option.name}
              <span className="text-muted-foreground">{option.id}</span>
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

      <div className="space-y-1">
        <div className="h-1 overflow-hidden rounded-full bg-muted">
          <div
            className={cn(
              "h-full rounded-full transition-all duration-300",
              remaining > 0 ? "bg-primary/60" : "bg-success",
            )}
            style={{ width: `${progress * 100}%` }}
          />
        </div>
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
    </div>
  );
}
