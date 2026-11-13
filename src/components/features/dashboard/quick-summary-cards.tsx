"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SummaryCard } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

const TONE_CLASSES: Record<SummaryCard["tone"], string> = {
  brand: "bg-primary/10 text-primary",
  violet: "bg-violet-500/10 text-violet-600 dark:text-violet-300",
  sky: "bg-sky-500/10 text-sky-600 dark:text-sky-300",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-300",
};

interface QuickSummaryCardsProps {
  cards: SummaryCard[];
}

export function QuickSummaryCards({ cards }: QuickSummaryCardsProps) {
  const router = useRouter();
  const [selectedLoanTypeId, setSelectedLoanTypeId] = useState("");

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => {
        const selectedEligibility =
          card.loanEligibilityByType?.find(
            (eligibility) => eligibility.loanTypeId === selectedLoanTypeId,
          ) ?? card.loanEligibilityByType?.[0];

        return (
          <Card
            key={card.label}
            className="transition-shadow duration-300 hover:shadow-raised"
          >
            <CardContent className="flex h-full flex-col gap-4">
              <div className="flex items-center justify-between gap-3">
                <span
                  className={cn(
                    "flex size-11 shrink-0 items-center justify-center rounded-xl",
                    TONE_CLASSES[card.tone],
                  )}
                >
                  <card.icon className="size-5" aria-hidden="true" />
                </span>
              </div>
              <div className="min-w-0 flex-1 space-y-1">
                <p className="truncate text-sm font-medium text-muted-foreground">
                  {card.label}
                </p>
                {card.loanEligibilityByType ? (
                  <div className="space-y-2.5 pt-1">
                    <p className="text-xs text-muted-foreground">
                      Based on your current savings
                    </p>
                    {selectedEligibility ? (
                      <>
                        <Select
                          value={selectedEligibility.loanTypeId}
                          onValueChange={(value) =>
                            setSelectedLoanTypeId(value ?? "")
                          }
                        >
                          <SelectTrigger
                            aria-label="Select loan type"
                            className="h-9 w-full"
                          >
                            <SelectValue placeholder="Select loan type">
                              {selectedEligibility.loanTypeName}
                            </SelectValue>
                          </SelectTrigger>
                          <SelectContent>
                            {card.loanEligibilityByType.map((eligibility) => (
                              <SelectItem
                                key={eligibility.loanTypeId}
                                value={eligibility.loanTypeId}
                              >
                                {eligibility.loanTypeName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <div className="grid grid-cols-2 gap-2 rounded-lg bg-muted/60 p-2.5 text-xs">
                          <p className="text-muted-foreground">
                            Times two
                            <span className="block font-semibold text-foreground">
                              {selectedEligibility.timesTwo}
                            </span>
                          </p>
                          <p className="text-muted-foreground">
                            Within
                            <span className="block font-semibold text-foreground">
                              {selectedEligibility.within}
                            </span>
                          </p>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No active loan types are available.
                      </p>
                    )}
                  </div>
                ) : (
                  <p className="truncate text-2xl font-semibold tracking-tight text-foreground tabular-nums sm:text-[1.7rem]">
                    {card.value}
                  </p>
                )}
                {card.hint ? (
                  <p className="pt-0.5 text-xs leading-snug text-muted-foreground">
                    {card.hint}
                  </p>
                ) : null}
              </div>
              {card.action ? (
                <button
                  type="button"
                  onClick={() =>
                    card.actionHref ? router.push(card.actionHref) : undefined
                  }
                  className="group/action inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80 dark:text-emerald-400"
                >
                  {card.action}
                  <ArrowRight
                    className="size-4 transition-transform group-hover/action:translate-x-0.5"
                    aria-hidden="true"
                  />
                </button>
              ) : null}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
