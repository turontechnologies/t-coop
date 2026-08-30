export interface SavingsTypeDef {
  name: string;
  min: number;
  max: number;
}

export const SAVINGS_TYPES: SavingsTypeDef[] = [
  { name: "Basic Savings", min: 5_000, max: 10_000 },
  { name: "Advanced Savings", min: 50_000, max: 100_000 },
  { name: "Premium Savings", min: 500_000, max: 1_000_000 },
];
