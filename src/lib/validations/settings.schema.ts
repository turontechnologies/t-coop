import { z } from "zod";

export const settingsProfileSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name"),
  lastName: z.string().trim().min(1, "Enter a last name"),
  email: z.email("Enter a valid email address"),
  address: z.string().trim().min(1, "Enter an address"),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .regex(/^[\d+\s-]+$/, "Digits, spaces, + and - only"),
  country: z.string().trim().min(1, "Select a country"),
});

export type SettingsProfileFormValues = z.infer<typeof settingsProfileSchema>;

export const settingsPasswordSchema = z
  .object({
    currentPassword: z.string().min(1, "Enter your current password"),
    newPassword: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string().min(1, "Confirm your new password"),
  })
  .refine((values) => values.newPassword === values.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type SettingsPasswordFormValues = z.infer<typeof settingsPasswordSchema>;

const chargeType = z.enum(["Fixed", "Percentage"]);
const amount = z
  .number({ message: "Enter an amount of 0 or more" })
  .min(0, "Enter an amount of 0 or more");

/** Each fee as a [type field, amount field] pair, so a percentage can be capped at 100. */
export const FEE_PAIRS = [
  ["savingsChargeType", "savingsChargeAmount"],
  ["loansChargeType", "loansChargeAmount"],
  ["withdrawalFeeType", "withdrawalFeeAmount"],
  ["loanApplicationFeeType", "loanApplicationFeeAmount"],
] as const;

/**
 * The platform's fees: the defaults a new co-op starts with (Fees & Charges), and each co-op's
 * own fees (Fees per co-operative). Both include the subscription grace period.
 */
export const feeChargesSchema = z
  .object({
    savingsChargeType: chargeType,
    savingsChargeAmount: amount,
    loansChargeType: chargeType,
    loansChargeAmount: amount,
    withdrawalFeeType: chargeType,
    withdrawalFeeAmount: amount,
    loanApplicationFeeType: chargeType,
    loanApplicationFeeAmount: amount,
    subscriptionGraceDays: z
      .number({ message: "Enter 0 or more days" })
      .int("Enter whole days")
      .min(0, "Enter 0 or more days")
      .max(365, "The grace period can be at most 365 days"),
  })
  .superRefine((values, ctx) => {
    for (const [type, amt] of FEE_PAIRS) {
      if (values[type] === "Percentage" && values[amt] > 100) {
        ctx.addIssue({
          code: "custom",
          path: [amt],
          message: "A percentage can be at most 100%",
        });
      }
    }
  });

export type FeeChargesFormValues = z.infer<typeof feeChargesSchema>;

export const coopPlatformFeesSchema = feeChargesSchema;

export type CoopPlatformFeesFormValues = FeeChargesFormValues;

export const collectionAccountSchema = z.object({
  bankCode: z.string().trim().min(1, "Select a bank"),
  accountNumber: z
    .string()
    .trim()
    .regex(/^\d{10}$/, "Enter a 10-digit account number"),
  accountName: z.string().trim().optional(),
});

export type CollectionAccountFormValues = z.infer<
  typeof collectionAccountSchema
>;

export const integrationsSchema = z.object({
  paystackEnabled: z.boolean(),
  paystackPublicKey: z.string().trim().optional(),
  paystackSecretKey: z.string().trim().optional(),
  paystackWebhookSecret: z.string().trim().optional(),
  flutterwaveEnabled: z.boolean(),
  flutterwavePublicKey: z.string().trim().optional(),
  flutterwaveSecretKey: z.string().trim().optional(),
  flutterwaveEncryptionKey: z.string().trim().optional(),
  opayEnabled: z.boolean(),
  opayPublicKey: z.string().trim().optional(),
  opaySecretKey: z.string().trim().optional(),
  opayMerchantId: z.string().trim().optional(),
  smsEnabled: z.boolean(),
  smsApiKey: z.string().trim().optional(),
  smsSenderId: z.string().trim().optional(),
});

export type IntegrationsFormValues = z.infer<typeof integrationsSchema>;

export const inviteUserSchema = z.object({
  email: z.email("Enter a valid email address"),
  role: z.string().trim().min(1, "Select a role"),
});

export type InviteUserFormValues = z.infer<typeof inviteUserSchema>;

export const createRoleSchema = z.object({
  roleName: z.string().trim().min(1, "Enter a role name"),
  permissions: z.array(z.string()).min(1, "Select at least one permission"),
});

export type CreateRoleFormValues = z.infer<typeof createRoleSchema>;
