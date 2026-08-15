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
  memberCount: number;
  totalSavings: number;
  totalLoans: number;
}
