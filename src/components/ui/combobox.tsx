"use client";

import * as React from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";

export interface ComboboxOption {
  value: string;
  label: string;
}

interface ComboboxProps {
  value: string;
  onValueChange: (value: string) => void;
  options: ComboboxOption[];
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  disabled?: boolean;
  loading?: boolean;
  loadingText?: string;
  className?: string;
  id?: string;
  ariaInvalid?: boolean;
}

/**
 * A searchable single-select — the `Select` primitive (Base UI) has no built-in filtering, so any
 * dropdown backed by a real, potentially-long list (banks, countries, states, members) uses this
 * instead. Same trigger look as `Select` so it drops in without a visual seam.
 */
export function Combobox({
  value,
  onValueChange,
  options,
  placeholder = "Select",
  searchPlaceholder = "Search…",
  emptyText = "No results found.",
  disabled,
  loading,
  loadingText = "Loading…",
  className,
  id,
  ariaInvalid,
}: ComboboxProps) {
  const [open, setOpen] = React.useState(false);
  const [query, setQuery] = React.useState("");
  const inputRef = React.useRef<HTMLInputElement>(null);

  const selected = options.find((option) => option.value === value);
  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter((option) => option.label.toLowerCase().includes(q));
  }, [options, query]);

  React.useEffect(() => {
    if (!open) return;
    const frame = requestAnimationFrame(() => inputRef.current?.focus());
    return () => cancelAnimationFrame(frame);
  }, [open]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setQuery("");
      }}
    >
      <PopoverTrigger
        render={
          // The rule flags aria-invalid as unsupported on an implicit button role, but it's
          // still how assistive tech is meant to learn a field is invalid; a data-* attribute
          // would carry no semantics at all, so the real ARIA attribute is kept regardless.
          // eslint-disable-next-line jsx-a11y/role-supports-aria-props
          <button
            id={id}
            type="button"
            disabled={disabled || loading}
            aria-invalid={ariaInvalid}
            className={cn(
              "flex h-11 w-full items-center justify-between gap-1.5 rounded-lg border border-input bg-transparent px-3 text-sm whitespace-nowrap text-foreground outline-none transition-colors select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 dark:bg-input/30 dark:hover:bg-input/50",
              className,
            )}
          />
        }
      >
        <span
          className={cn(
            "flex-1 truncate text-left",
            !selected && "text-muted-foreground",
          )}
        >
          {loading ? loadingText : (selected?.label ?? placeholder)}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--anchor-width) min-w-56 p-0">
        <div className="flex items-center gap-2 border-b border-border px-2.5 py-2">
          <Search
            className="size-3.5 shrink-0 text-muted-foreground"
            aria-hidden="true"
          />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={searchPlaceholder}
            className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
        </div>
        <ul className="max-h-64 overflow-y-auto p-1" role="listbox">
          {filtered.length === 0 ? (
            <li className="px-2.5 py-4 text-center text-sm text-muted-foreground">
              {emptyText}
            </li>
          ) : (
            filtered.map((option) => (
              <li key={option.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={option.value === value}
                  onClick={() => {
                    onValueChange(option.value);
                    setOpen(false);
                    setQuery("");
                  }}
                  className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-sm outline-none hover:bg-accent hover:text-accent-foreground",
                    option.value === value && "bg-accent/60",
                  )}
                >
                  <Check
                    className={cn(
                      "size-3.5 shrink-0",
                      option.value === value ? "opacity-100" : "opacity-0",
                    )}
                    aria-hidden="true"
                  />
                  <span className="truncate">{option.label}</span>
                </button>
              </li>
            ))
          )}
        </ul>
      </PopoverContent>
    </Popover>
  );
}
