export interface ImportRowError {
  row: number;
  message: string;
}

export interface ParsedImportResult<TRow> {
  rows: TRow[];
  errors: ImportRowError[];
}
