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

export const feeChargesSchema = z.object({
  savingsChargeType: z.enum(["Fixed", "Percentage"]),
  savingsChargeAmount: z.number().min(0, "Enter an amount of 0 or more"),
  loansChargeType: z.enum(["Fixed", "Percentage"]),
  loansChargeAmount: z.number().min(0, "Enter an amount of 0 or more"),
  withdrawalFeePercent: z
    .number()
    .min(0, "Enter a percentage of 0 or more")
    .max(100, "Enter a percentage of 100 or less"),
});

export type FeeChargesFormValues = z.infer<typeof feeChargesSchema>;

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
