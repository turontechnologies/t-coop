/** What character set an auto-generated id's suffix is made of — NUMERIC (0-9), ALPHA (A-Z), or
 * ALPHANUMERIC (0-9 then A-Z). Shared by co-op ids (platform-wide, super admin's own setting)
 * and member ids (per-co-op, that co-op's own admin's setting) — see CoopIdFormat and this
 * interface's memberIdType. */
export type IdGenerationType = "NUMERIC" | "ALPHA" | "ALPHANUMERIC";

/**
 * The real backend's co-operative shape — leaner than the legacy mock
 * `Cooperative` type in `src/lib/coop-data.ts` (no members/savings/loans
 * arrays; those aren't cut over to the real backend yet). `totalSavings`/
 * `totalLoans`/`memberCount` are computed server-side, not summed here.
 */
export interface CooperativeSummary {
  id: string;
  name: string;
  adminName: string;
  contactEmail: string;
  contactPhone: string;
  address: string;
  country: string;
  state: string;
  city: string;
  status: "Active" | "Disabled";
  currency: string;
  withdrawalFeeAmount: number;
  withdrawalFeeType: "Fixed" | "Percentage";
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
  logoUrl: string | null;
  memberIdPrefix: string;
  memberIdPadding: number;
  memberIdType: IdGenerationType;
  minGuarantors: number;
  memberCount: number;
  savingsTypeCount: number;
  loanTypeCount: number;
  totalSavings: number;
  totalLoans: number;
}

/** GET /api/v1/cooperatives/{id}/branding — the lean shape any member (not just admin/coop
 * staff) can fetch for their own co-op, to show its name/logo on their dashboard. */
export interface CooperativeBranding {
  id: string;
  name: string;
  logoUrl: string | null;
}
