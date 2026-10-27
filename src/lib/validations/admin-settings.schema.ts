import { z } from "zod";

export const coopBankAccountSchema = z.object({
  bankCode: z.string().trim().min(1, "Select a bank"),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Enter a 10-digit account number"),
  accountName: z.string().trim().optional(),
});

export type CoopBankAccountFormValues = z.infer<typeof coopBankAccountSchema>;

/** Mirrors CoopIntegrationsController's own checks so a mistake is caught before saving.
 * `*SecretKeySet` aren't inputs — they're whether a secret is already saved, so an enabled
 * gateway only needs a new secret typed in when there isn't one yet. */
export const coopIntegrationsSchema = z
  .object({
    paystackEnabled: z.boolean(),
    paystackPublicKey: z.string().trim(),
    paystackSecretKey: z.string().trim(),
    paystackSecretKeySet: z.boolean(),
    flutterwaveEnabled: z.boolean(),
    flutterwavePublicKey: z.string().trim(),
    flutterwaveSecretKey: z.string().trim(),
    flutterwaveSecretKeySet: z.boolean(),
  })
  .superRefine((values, ctx) => {
    const check = (
      name: string,
      enabled: boolean,
      publicKey: string,
      secretKey: string,
      secretSaved: boolean,
      publicPrefix: string,
      secretPrefix: string,
      fields: { public: string; secret: string },
    ) => {
      if (!enabled) return;
      if (!publicKey) {
        ctx.addIssue({
          code: "custom",
          path: [fields.public],
          message: `Enter your ${name} public key`,
        });
      } else if (!publicKey.startsWith(publicPrefix)) {
        ctx.addIssue({
          code: "custom",
          path: [fields.public],
          message: `A ${name} public key starts with ${publicPrefix}`,
        });
      }
      if (!secretKey && !secretSaved) {
        ctx.addIssue({
          code: "custom",
          path: [fields.secret],
          message: `Enter your ${name} secret key`,
        });
      } else if (secretKey && !secretKey.startsWith(secretPrefix)) {
        ctx.addIssue({
          code: "custom",
          path: [fields.secret],
          message: `A ${name} secret key starts with ${secretPrefix}`,
        });
      }
    };
    check(
      "Paystack",
      values.paystackEnabled,
      values.paystackPublicKey,
      values.paystackSecretKey,
      values.paystackSecretKeySet,
      "pk_",
      "sk_",
      { public: "paystackPublicKey", secret: "paystackSecretKey" },
    );
    check(
      "Flutterwave",
      values.flutterwaveEnabled,
      values.flutterwavePublicKey,
      values.flutterwaveSecretKey,
      values.flutterwaveSecretKeySet,
      "FLWPUBK",
      "FLWSECK",
      { public: "flutterwavePublicKey", secret: "flutterwaveSecretKey" },
    );
  });

export type CoopIntegrationsFormValues = z.infer<typeof coopIntegrationsSchema>;

export const withdrawalFeeSchema = z.object({
  withdrawalFeeType: z.enum(["Fixed", "Percentage"]),
  withdrawalFeeAmount: z.number().min(0, "Enter an amount of 0 or more"),
});

export type WithdrawalFeeFormValues = z.infer<typeof withdrawalFeeSchema>;

/** The co-op's own cut of every savings deposit and loan disbursement — combined with the
 * platform's own rate (super admin's Fees & Charges) at transaction time, same mechanics as
 * {@link withdrawalFeeSchema}. */
export const coopChargesSchema = z.object({
  savingsChargeType: z.enum(["Fixed", "Percentage"]),
  savingsChargeAmount: z.number().min(0, "Enter an amount of 0 or more"),
  loansChargeType: z.enum(["Fixed", "Percentage"]),
  loansChargeAmount: z.number().min(0, "Enter an amount of 0 or more"),
});

export type CoopChargesFormValues = z.infer<typeof coopChargesSchema>;

// Matches SavingsTypeCreateRequest on the backend exactly — no approval-group field, since
// savings/loan REQUEST approval workflow (who signs off on a member's request) is a separate,
// not-yet-built feature; this form only defines the type itself.
export const savingsTypeSettingSchema = z.object({
  name: z.string().trim().min(1, "Enter a savings type name"),
  min: z.number().min(0, "Enter a minimum amount"),
  max: z.number().min(0, "Enter a maximum amount"),
});

export type SavingsTypeSettingFormValues = z.infer<
  typeof savingsTypeSettingSchema
>;

// Matches LoanTypeCreateRequest exactly — no approver/terms fields, same reasoning as above.
// interestAmount only matters when interestType isn't "NoInterest" — a genuinely interest-free
// loan needs nothing entered there at all.
export const loanTypeSettingSchema = z
  .object({
    name: z.string().trim().min(1, "Enter a loan type name"),
    eligibilityPercent: z.number().min(1, "Enter an eligibility percentage"),
    durationMonths: z.number().min(1, "Select a duration"),
    maxAmount: z.number().min(1, "Enter a maximum loan amount"),
    repaymentInterval: z.enum(["Weekly", "Monthly", "Quarterly"]),
    numberOfInstallments: z.number().min(1, "Enter the number of installments"),
    interestType: z.enum(["Percentage", "Fixed", "NoInterest"]),
    interestAmount: z.number().min(0, "Enter an interest amount").optional(),
  })
  .refine(
    (values) =>
      values.interestType === "NoInterest" || values.interestAmount != null,
    { message: "Enter an interest amount", path: ["interestAmount"] },
  );

export type LoanTypeSettingFormValues = z.infer<typeof loanTypeSettingSchema>;

export const assignCoopRoleSchema = z.object({
  memberId: z.string().trim().min(1, "Select a member"),
  roleId: z.string().trim().min(1, "Select a role"),
});

export type AssignCoopRoleFormValues = z.infer<typeof assignCoopRoleSchema>;
