"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  pageSizeOptions: number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

/**
 * Shared "View N per page" + pager footer for the app's hand-rolled
 * tables. On phones, the full row of page-number buttons would either
 * overflow or wrap awkwardly, so below `sm` it collapses to just
 * Prev/Next around a "Page X of Y" label; the numbered buttons return
 * at `sm` and up.
 */
export function TablePagination({
  page,
  totalPages,
  pageSize,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
}: TablePaginationProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
      <div className="flex items-center gap-1.5">
        <span>View</span>
        <Select
          value={String(pageSize)}
          onValueChange={(value) => onPageSizeChange(Number(value))}
        >
          <SelectTrigger size="sm" className="w-16">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {pageSizeOptions.map((size) => (
              <SelectItem key={size} value={String(size)}>
                {size}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span>per page</span>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(Math.max(1, page - 1))}
          disabled={page === 1}
          className="text-muted-foreground"
          aria-label="Previous page"
        >
          <ChevronLeft className="size-4" />
        </Button>

        <span className="px-2 text-xs font-medium text-foreground sm:hidden">
          Page {page} of {totalPages}
        </span>

        <div className="hidden items-center gap-1 sm:flex">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <Button
              key={num}
              type="button"
              variant={num === page ? "default" : "ghost"}
              size="icon"
              onClick={() => onPageChange(num)}
              className="text-sm font-medium"
            >
              {num}
            </Button>
          ))}
        </div>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          onClick={() => onPageChange(Math.min(totalPages, page + 1))}
          disabled={page === totalPages}
          className="text-muted-foreground"
          aria-label="Next page"
        >
          <ChevronRight className="size-4" />
        </Button>
      </div>
    </div>
  );
}
