"use client";

import { useMemo, useState } from "react";
import { Check, ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { findCurrency, SUPPORTED_CURRENCIES } from "@/lib/currency-data";

interface CurrencyComboboxProps {
  value: string;
  onChange: (code: string) => void;
  disabled?: boolean;
}

export function CurrencyCombobox({
  value,
  onChange,
  disabled,
}: CurrencyComboboxProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const selected = findCurrency(value);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return SUPPORTED_CURRENCIES;
    return SUPPORTED_CURRENCIES.filter(
      (currency) =>
        currency.name.toLowerCase().includes(query) ||
        currency.code.toLowerCase().includes(query),
    );
  }, [search]);

  return (
    <Popover
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) setSearch("");
      }}
    >
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant="outline"
            disabled={disabled}
            className="h-11 w-full justify-between font-normal"
          />
        }
      >
        <span className="truncate">
          {selected ? `${selected.name} (${selected.code})` : value}
        </span>
        <ChevronDown
          className="size-4 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
      </PopoverTrigger>
      <PopoverContent align="start" className="w-(--anchor-width) p-0">
        <div className="relative border-b border-border p-2">
          <Search
            className="pointer-events-none absolute top-1/2 left-4.5 size-3.5 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            autoFocus
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search currency…"
            className="h-9 pl-8"
          />
        </div>
        <ScrollArea className="h-64">
          <div className="p-1">
            {filtered.length === 0 ? (
              <p className="px-3 py-6 text-center text-sm text-muted-foreground">
                No currency matches your search.
              </p>
            ) : (
              filtered.map((currency) => (
                <button
                  key={currency.code}
                  type="button"
                  onClick={() => {
                    onChange(currency.code);
                    setOpen(false);
                    setSearch("");
                  }}
                  className="flex w-full items-center justify-between gap-2 rounded-md px-3 py-2 text-left text-sm transition-colors hover:bg-accent"
                >
                  <span className="truncate">
                    {currency.name}{" "}
                    <span className="text-muted-foreground">
                      ({currency.code})
                    </span>
                  </span>
                  {currency.code === value ? (
                    <Check
                      className="size-3.5 shrink-0 text-primary"
                      aria-hidden="true"
                    />
                  ) : null}
                </button>
              ))
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
}
