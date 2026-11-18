"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  AlertCircle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  RotateCcw,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { ImportRowError } from "@/lib/table-import";
import { cn } from "@/lib/utils";

export interface BulkCheckResult<TLine> {
  totalAmount: number;
  imported: number;
  lines: TLine[];
  errors: ImportRowError[];
}

export interface BulkColumn<TLine> {
  header: string;
  cell: (line: TLine) => ReactNode;
  align?: "right";
}

interface BulkUploadDialogProps<TRow, TLine extends { row: number }> {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  /** e.g. "savings" → "12 savings rows". */
  noun: string;
  downloadTemplate: () => void;
  parseFile: (
    file: File,
  ) => Promise<{ rows: TRow[]; errors: ImportRowError[]; skipped?: number }>;
  /** Runs the check (dryRun, nothing saved) or the real upload. */
  submit: (rows: TRow[], dryRun: boolean) => Promise<BulkCheckResult<TLine>>;
  columns: BulkColumn<TLine>[];
  /** Money imports show a total; leave out for imports that aren't money. */
  formatTotal?: (amount: number) => string;
  /** What step 1 says about the template. */
  templateHint?: string;
  /**
   * true (money): any wrong row blocks the whole upload. false (members, attendance…): wrong rows
   * are skipped and listed, the rest are imported.
   */
  allOrNothing?: boolean;
}

type Step =
  | { kind: "pick" }
  | { kind: "checking"; fileName: string }
  | {
      kind: "review";
      fileName: string;
      rows: TRowAny[];
      skipped: number;
      result: BulkCheckResult<{ row: number }>;
    }
  | {
      kind: "done";
      imported: number;
      total: number;
      skipped: ImportRowError[];
    };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type TRowAny = any;

/**
 * The shared bulk upload: download the pre-filled template → drop the filled file → every row is
 * checked by the server (nothing saved) and shown → upload. Any wrong row blocks the upload, so a
 * file is never half-imported.
 */
export function BulkUploadDialog<TRow, TLine extends { row: number }>({
  open,
  onOpenChange,
  title,
  description,
  noun,
  downloadTemplate,
  parseFile,
  submit,
  columns,
  formatTotal,
  templateHint = "It's already filled in. Just type the amounts; rows left empty are skipped.",
  allOrNothing = true,
}: BulkUploadDialogProps<TRow, TLine>) {
  const [step, setStep] = useState<Step>({ kind: "pick" });
  const [problem, setProblem] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!open) {
      setStep({ kind: "pick" });
      setProblem(null);
      setUploading(false);
    }
  }, [open]);

  const takeFile = async (file: File | undefined) => {
    if (!file) return;
    setProblem(null);
    if (!/\.(xlsx|xls|csv)$/i.test(file.name)) {
      setProblem("Choose an Excel (.xlsx) or CSV file.");
      return;
    }
    setStep({ kind: "checking", fileName: file.name });
    try {
      const parsed = await parseFile(file);
      if (parsed.rows.length === 0 && parsed.errors.length === 0) {
        setStep({ kind: "pick" });
        setProblem(
          (parsed.skipped ?? 0) > 0
            ? "No row has an amount yet. Fill in the Amount column and upload it again."
            : "That file has no rows.",
        );
        return;
      }
      const result: BulkCheckResult<TLine> =
        parsed.rows.length > 0
          ? await submit(parsed.rows, true)
          : { totalAmount: 0, imported: 0, lines: [], errors: [] };
      setStep({
        kind: "review",
        fileName: file.name,
        rows: parsed.rows,
        skipped: parsed.skipped ?? 0,
        result: {
          ...result,
          errors: [...parsed.errors, ...result.errors].sort(
            (a, b) => a.row - b.row,
          ),
        },
      });
    } catch (error) {
      setStep({ kind: "pick" });
      setProblem(
        error instanceof Error ? error.message : "We couldn't read that file.",
      );
    }
  };

  const upload = async () => {
    if (step.kind !== "review") return;
    setUploading(true);
    setProblem(null);
    try {
      const result = await submit(step.rows as TRow[], false);
      if (result.errors.length > 0 && (allOrNothing || result.imported === 0)) {
        setStep({
          ...step,
          result: result as BulkCheckResult<{ row: number }>,
        });
        return;
      }
      setStep({
        kind: "done",
        imported: result.imported,
        total: result.totalAmount,
        skipped: [
          ...(allOrNothing ? [] : step.result.errors),
          ...result.errors,
        ],
      });
      toast.success(`${result.imported} ${noun} imported`, {
        description: formatTotal
          ? `${formatTotal(result.totalAmount)} recorded.`
          : undefined,
      });
    } catch (error) {
      setProblem(
        error instanceof Error
          ? error.message
          : "The upload didn't go through.",
      );
    } finally {
      setUploading(false);
    }
  };

  const review = step.kind === "review" ? step : null;
  const errors = review?.result.errors ?? [];
  const lines = (review?.result.lines ?? []) as TLine[];

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !uploading && onOpenChange(value)}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait" initial={false}>
          {step.kind === "pick" || step.kind === "checking" ? (
            <motion.div
              key="pick"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <ol className="grid gap-3 sm:grid-cols-2">
                <li className="rounded-2xl border border-border bg-muted/40 p-4">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Step 1
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    Download the template
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {templateHint}
                  </p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={downloadTemplate}
                  >
                    <Download className="size-3.5" aria-hidden="true" />
                    Download template
                  </Button>
                </li>
                <li className="rounded-2xl border border-border bg-muted/40 p-4">
                  <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                    Step 2
                  </p>
                  <p className="mt-1 text-sm font-semibold text-foreground">
                    Upload the filled file
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    You&apos;ll see every row before anything is saved.
                  </p>
                </li>
              </ol>

              <button
                type="button"
                disabled={step.kind === "checking"}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => {
                  event.preventDefault();
                  setDragging(true);
                }}
                onDragLeave={() => setDragging(false)}
                onDrop={(event) => {
                  event.preventDefault();
                  setDragging(false);
                  void takeFile(event.dataTransfer.files?.[0]);
                }}
                className={cn(
                  "grid w-full justify-items-center gap-2 rounded-2xl border-[1.5px] border-dashed border-border px-4 py-10 text-center transition-colors hover:border-primary/60 hover:bg-primary/5",
                  dragging && "border-primary bg-primary/5",
                )}
              >
                <input
                  ref={inputRef}
                  type="file"
                  accept=".xlsx,.xls,.csv"
                  className="sr-only"
                  onChange={(event) => {
                    void takeFile(event.target.files?.[0]);
                    event.target.value = "";
                  }}
                />
                <span className="flex size-12 items-center justify-center rounded-full bg-card text-primary shadow-card dark:text-emerald-300">
                  {step.kind === "checking" ? (
                    <Loader2
                      className="size-5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Upload className="size-5" aria-hidden="true" />
                  )}
                </span>
                <span className="text-sm font-semibold text-foreground">
                  {step.kind === "checking"
                    ? `Checking ${step.fileName}…`
                    : "Drop the file here, or browse"}
                </span>
                <span className="text-xs text-muted-foreground">
                  Excel (.xlsx) or CSV
                </span>
              </button>
            </motion.div>
          ) : null}

          {review ? (
            <motion.div
              key="review"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="space-y-4"
            >
              <div className="flex flex-wrap items-center gap-2 text-sm">
                <FileSpreadsheet
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="font-medium text-foreground">
                  {review.fileName}
                </span>
                <Badge
                  variant="secondary"
                  className="bg-success/15 text-success"
                >
                  {lines.length} ready
                </Badge>
                {errors.length > 0 ? (
                  <Badge variant="destructive">{errors.length} to fix</Badge>
                ) : null}
                {review.skipped > 0 ? (
                  <Badge variant="outline">
                    {review.skipped} without an amount, skipped
                  </Badge>
                ) : null}
                {formatTotal ? (
                  <span className="ml-auto font-semibold text-foreground tabular-nums">
                    {formatTotal(review.result.totalAmount)}
                  </span>
                ) : null}
              </div>

              {errors.length > 0 ? (
                <div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-destructive">
                    <AlertCircle className="size-4" aria-hidden="true" />
                    {allOrNothing
                      ? "Fix these rows in the file and upload it again. Nothing is saved until every row is right."
                      : "These rows will be skipped. Fix them and import again, or import the rest now."}
                  </p>
                  <ul className="mt-2 max-h-40 space-y-1 overflow-y-auto text-sm">
                    {errors.map((error, index) => (
                      <li key={`${error.row}-${index}`} className="flex gap-2">
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          Row {error.row}
                        </span>
                        <span className="text-foreground">{error.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}

              {lines.length > 0 ? (
                <div className="max-h-80 overflow-auto rounded-xl border border-border">
                  <table className="w-full min-w-[560px] text-left text-sm">
                    <thead className="sticky top-0 bg-muted">
                      <tr>
                        <th className="px-3 py-2 text-xs font-semibold text-muted-foreground">
                          Row
                        </th>
                        {columns.map((column) => (
                          <th
                            key={column.header}
                            className={cn(
                              "px-3 py-2 text-xs font-semibold text-muted-foreground",
                              column.align === "right" && "text-right",
                            )}
                          >
                            {column.header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {lines.map((line) => (
                        <tr key={line.row} className="border-t border-border">
                          <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                            {line.row}
                          </td>
                          {columns.map((column) => (
                            <td
                              key={column.header}
                              className={cn(
                                "px-3 py-2 text-foreground",
                                column.align === "right" &&
                                  "text-right tabular-nums",
                              )}
                            >
                              {column.cell(line)}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : null}
            </motion.div>
          ) : null}

          {step.kind === "done" ? (
            <motion.div
              key="done"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              className="grid justify-items-center gap-2 py-8 text-center"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-success/15 text-success">
                <CheckCircle2 className="size-7" aria-hidden="true" />
              </span>
              <p className="text-lg font-semibold text-foreground">
                {step.imported} {noun} imported
              </p>
              {formatTotal ? (
                <p className="text-sm text-muted-foreground">
                  {formatTotal(step.total)} recorded. Members can see it
                  straight away.
                </p>
              ) : null}
              {step.skipped.length > 0 ? (
                <div className="mt-2 w-full rounded-2xl border border-amber-500/30 bg-amber-500/5 p-3 text-left">
                  <p className="text-sm font-semibold text-amber-700 dark:text-amber-300">
                    {step.skipped.length} row
                    {step.skipped.length === 1 ? " was" : "s were"} skipped
                  </p>
                  <ul className="mt-1 max-h-32 space-y-1 overflow-y-auto text-sm">
                    {step.skipped.map((error, index) => (
                      <li key={`${error.row}-${index}`} className="flex gap-2">
                        <span className="shrink-0 font-mono text-xs text-muted-foreground">
                          Row {error.row}
                        </span>
                        <span className="text-foreground">{error.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </motion.div>
          ) : null}
        </AnimatePresence>

        {problem ? (
          <p className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-3 text-sm font-medium text-destructive">
            <AlertCircle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
            {problem}
          </p>
        ) : null}

        <DialogFooter>
          {step.kind === "done" ? (
            <Button onClick={() => onOpenChange(false)}>Done</Button>
          ) : (
            <>
              {review ? (
                <Button
                  variant="outline"
                  disabled={uploading}
                  onClick={() => setStep({ kind: "pick" })}
                >
                  <RotateCcw className="size-3.5" aria-hidden="true" />
                  Choose another file
                </Button>
              ) : (
                <Button variant="outline" onClick={() => onOpenChange(false)}>
                  Cancel
                </Button>
              )}
              {review ? (
                <Button
                  disabled={
                    uploading ||
                    (allOrNothing && errors.length > 0) ||
                    lines.length === 0
                  }
                  onClick={upload}
                >
                  {uploading ? (
                    <Loader2
                      className="size-4 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <Upload className="size-4" aria-hidden="true" />
                  )}
                  Upload {lines.length} {lines.length === 1 ? "row" : "rows"}
                </Button>
              ) : null}
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
