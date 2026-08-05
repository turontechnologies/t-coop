import { z } from "zod";

export const cooperativeSettingsSchema = z.object({
  name: z.string().trim().min(1, "Enter the co-operative name"),
  address: z.string().trim().min(1, "Enter an address"),
  contactPerson: z.string().trim().min(1, "Enter a contact person"),
  website: z.string().trim().optional(),
  contactEmail: z.email("Enter a valid email address"),
  contactPhone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .regex(/^[\d+\s-]+$/, "Digits, spaces, + and - only"),
  presidentName: z.string().trim().min(1, "Enter the president's name"),
  presidentContact: z.string().trim().min(1, "Enter a contact"),
  chairmanName: z.string().trim().min(1, "Enter the chairman's name"),
  chairmanContact: z.string().trim().min(1, "Enter a contact"),
});

export type CooperativeSettingsFormValues = z.infer<
  typeof cooperativeSettingsSchema
>;

export const coopBankAccountSchema = z.object({
  bankCode: z.string().trim().min(1, "Select a bank"),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Enter a 10-digit account number"),
  accountName: z.string().trim().optional(),
});

export type CoopBankAccountFormValues = z.infer<typeof coopBankAccountSchema>;

export const savingsTypeSettingSchema = z.object({
  name: z.string().trim().min(1, "Enter a savings type name"),
  min: z.number().min(0, "Enter a minimum amount"),
  max: z.number().min(0, "Enter a maximum amount"),
  approvalGroup: z
    .array(z.string())
    .min(1, "Select at least one approval member"),
});

export type SavingsTypeSettingFormValues = z.infer<
  typeof savingsTypeSettingSchema
>;

export const loanTypeSettingSchema = z.object({
  name: z.string().trim().min(1, "Enter a loan type name"),
  eligibilityPercent: z.number().min(1, "Enter an eligibility percentage"),
  durationMonths: z.number().min(1, "Select a duration"),
  repaymentInterval: z.enum(["Weekly", "Monthly", "Quarterly"]),
  interestType: z.enum(["Percentage", "Fixed"]),
  interestAmount: z.number().min(0, "Enter an interest amount"),
  approver1: z.string().trim().min(1, "Select an approver"),
  approver2: z.string().trim().optional(),
  loanTerms: z.string().trim().min(1, "Enter the documents required"),
  guarantorTerms: z.string().trim().min(1, "Enter the documents required"),
});

export type LoanTypeSettingFormValues = z.infer<typeof loanTypeSettingSchema>;
