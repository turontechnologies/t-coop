export interface BankDef {
  name: string;
  /** Paystack's numeric bank code — required by both the account-resolve and transfer-recipient endpoints. */
  code: string;
}

export function findBankByCode(
  banks: BankDef[],
  code: string,
): BankDef | undefined {
  return banks.find((bank) => bank.code === code);
}

export interface BankAccountDetails {
  bankCode: string;
  accountNumber: string;
  /** Resolved from Paystack's account-resolve endpoint — never user-typed. */
  accountName: string;
}
