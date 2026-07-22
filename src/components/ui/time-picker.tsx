"use client";

import * as React from "react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
const MINUTES = Array.from({ length: 12 }, (_, i) =>
  String(i * 5).padStart(2, "0"),
);

interface TimePickerProps {
  /** 24-hour "HH:mm", matching <input type="time"> value shape. */
  value?: string;
  onChange: (value: string) => void;
  className?: string;
}

function TimePicker({ value, onChange, className }: TimePickerProps) {
  const [hour, minute] = value ? value.split(":") : [undefined, undefined];

  return (
    <div
      data-slot="time-picker"
      className={cn("flex divide-x divide-border bg-background p-2", className)}
    >
      <TimeColumn
        options={HOURS}
        selected={hour}
        label="Hour"
        onSelect={(h) => onChange(`${h}:${minute ?? "00"}`)}
      />
      <TimeColumn
        options={MINUTES}
        selected={minute}
        label="Minute"
        onSelect={(m) => onChange(`${hour ?? "00"}:${m}`)}
      />
    </div>
  );
}

function TimeColumn({
  options,
  selected,
  label,
  onSelect,
}: {
  options: string[];
  selected?: string;
  label: string;
  onSelect: (value: string) => void;
}) {
  const selectedRef = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    selectedRef.current?.scrollIntoView({ block: "center" });
  }, [selected]);

  return (
    <ScrollArea className="h-56 w-16">
      <div
        className="flex flex-col gap-0.5 pr-2"
        role="listbox"
        aria-label={label}
      >
        {options.map((option) => {
          const isSelected = option === selected;
          return (
            <Button
              key={option}
              ref={isSelected ? selectedRef : undefined}
              type="button"
              variant="ghost"
              size="sm"
              role="option"
              aria-selected={isSelected}
              onClick={() => onSelect(option)}
              className={cn(
                "h-8 w-full justify-center font-normal tabular-nums",
                isSelected &&
                  "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
              )}
            >
              {option}
            </Button>
          );
        })}
      </div>
    </ScrollArea>
  );
}

/** "14:30" -> "2:30 PM" */
function formatTimeLabel(value: string): string {
  const [hourStr, minute] = value.split(":");
  const hour = Number(hourStr);
  const period = hour >= 12 ? "PM" : "AM";
  const hour12 = hour % 12 === 0 ? 12 : hour % 12;
  return `${hour12}:${minute} ${period}`;
}

export { TimePicker, formatTimeLabel };
