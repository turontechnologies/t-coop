"use client";

import { useState } from "react";
import { CalendarIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { formatDateLong } from "@/lib/format";
import {
  PERIOD_PRESETS,
  isoDate,
  parseIso,
  period,
  periodLabel,
  previousPeriod,
  type ReportRange,
} from "@/lib/report-periods";
import { Chip, Panel } from "./report-ui";

function DateField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const today = new Date();
  const selected = parseIso(value);
  return (
    <div className="grid w-[calc(50%-7px)] gap-1.5 sm:w-[190px]">
      <label
        htmlFor={id}
        className="text-sm font-semibold text-muted-foreground"
      >
        {label}
      </label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              id={id}
              type="button"
              variant="outline"
              className="h-11 w-full justify-start rounded-xl font-normal"
            />
          }
        >
          <CalendarIcon
            className="size-4 text-muted-foreground"
            aria-hidden="true"
          />
          <span className="truncate">{formatDateLong(selected)}</span>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            captionLayout="dropdown"
            selected={selected}
            defaultMonth={selected}
            startMonth={new Date(2000, 0)}
            endMonth={today}
            disabled={{ after: today }}
            onSelect={(date) => {
              if (!date) return;
              onChange(isoDate(date));
              setOpen(false);
            }}
            autoFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function ReportFilters({
  range,
  onRangeChange,
  compare,
  onCompareChange,
}: {
  range: ReportRange;
  onRangeChange: (range: ReportRange) => void;
  compare: boolean;
  onCompareChange: (compare: boolean) => void;
}) {
  const previous = previousPeriod(range);
  const setCustom = (from: string, to: string) => {
    const [a, b] = from > to ? [to, from] : [from, to];
    onRangeChange({ from: a, to: b, key: "custom" });
  };

  return (
    <Panel className="gap-4">
      <div className="flex flex-wrap gap-2" role="group" aria-label="Period">
        {PERIOD_PRESETS.map(([key, label]) => (
          <Chip
            key={key}
            pressed={range.key === key}
            onClick={() => onRangeChange(period(key))}
          >
            {label}
          </Chip>
        ))}
        {range.key === "custom" ? (
          <Chip pressed disabled>
            Custom
          </Chip>
        ) : null}
      </div>
      <div className="flex flex-wrap items-end gap-3.5">
        <DateField
          id="report-from"
          label="From"
          value={range.from}
          onChange={(value) => setCustom(value, range.to)}
        />
        <DateField
          id="report-to"
          label="To"
          value={range.to}
          onChange={(value) => setCustom(range.from, value)}
        />
        <label className="flex cursor-pointer items-center gap-2.5 self-center text-sm font-medium text-muted-foreground sm:ml-auto">
          <Checkbox
            checked={compare && previous != null}
            disabled={previous == null}
            onCheckedChange={(checked) => onCompareChange(Boolean(checked))}
          />
          <span>
            Compare with{" "}
            <b className="font-semibold text-foreground">
              {previous
                ? periodLabel(previous)
                : "an earlier period (not available for all time)"}
            </b>
          </span>
        </label>
      </div>
    </Panel>
  );
}
