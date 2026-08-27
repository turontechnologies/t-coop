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
  withdrawalFeePercent: number;
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
  memberIdPrefix: string;
  memberIdPadding: number;
  memberIdType: IdGenerationType;
  memberCount: number;
  savingsTypeCount: number;
  loanTypeCount: number;
  totalSavings: number;
  totalLoans: number;
}
