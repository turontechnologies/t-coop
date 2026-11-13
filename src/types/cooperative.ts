/** What character set an auto-generated id's suffix is made of — NUMERIC (0-9), ALPHA (A-Z), or
 * ALPHANUMERIC (0-9 then A-Z). Shared by co-op ids (platform-wide, super admin's own setting)
 * and member ids (per-co-op, that co-op's own admin's setting) — see CoopIdFormat and this
 * interface's memberIdType. */
export type IdGenerationType = "NUMERIC" | "ALPHA" | "ALPHANUMERIC";

/**
 * The backend's co-operative shape. `totalSavings`/`totalLoans`/
 * `memberCount` are computed server-side, not summed here.
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
  savingsChargeAmount: number;
  savingsChargeType: "Fixed" | "Percentage";
  loansChargeAmount: number;
  loansChargeType: "Fixed" | "Percentage";
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
  logoUrl: string | null;
  memberIdPrefix: string;
  memberIdPadding: number;
  memberIdType: IdGenerationType;
  minGuarantors: number;
  /** Settings → Co-operative: a new member must name a guarantor. Off by default. */
  requireMemberGuarantors?: boolean;
  /** Where new-member guarantors come from: anyone, co-op members only, or a set mix. */
  memberGuarantorSource?: "Any" | "CoopOnly" | "Mix";
  /** With "Mix": at least this many from the co-op. */
  memberGuarantorsFromCoop?: number;
  /** With "Mix": at least this many from outside the co-op. */
  memberGuarantorsFromOutside?: number;
  /** What the co-op calls the alternative ID. */
  alternativeIdLabel?: string;
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
  currency: string;
  /** What the co-op calls the alternative ID, e.g. "Staff No.". */
  alternativeIdLabel?: string;
}
