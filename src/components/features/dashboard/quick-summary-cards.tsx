import { Card, CardContent } from "@/components/ui/card";
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
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map((card) => (
        <Card key={card.label}>
          <CardContent className="flex items-start justify-between gap-3">
            <div className="min-w-0 space-y-1.5">
              <p className="truncate text-sm text-muted-foreground">
                {card.label}
              </p>
              <p className="text-xl font-semibold text-foreground sm:text-2xl">
                {card.value}
              </p>
              {card.action ? (
                <button
                  type="button"
                  className="mt-1 rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground transition-colors hover:bg-muted/70"
                >
                  {card.action}
                </button>
              ) : null}
            </div>
            <span
              className={cn(
                "flex size-10 shrink-0 items-center justify-center rounded-full",
                TONE_CLASSES[card.tone],
              )}
            >
              <card.icon className="size-5" aria-hidden="true" />
            </span>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
