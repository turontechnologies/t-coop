import { z } from "zod";

export const addCooperativeSchema = z.object({
  coopId: z.string().trim().min(1, "Enter a co-op ID"),
  coopName: z.string().trim().min(1, "Enter the co-operative name"),
  adminFirstName: z.string().trim().min(1, "Enter the admin's first name"),
  adminLastName: z.string().trim().min(1, "Enter the admin's last name"),
  contactEmail: z.email("Enter a valid email address"),
  contactPhone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .regex(/^[\d+\s-]+$/, "Enter a valid phone number"),
  address: z.string().trim().min(1, "Enter the co-operative's address"),
  country: z.string().min(1, "Select a country"),
  state: z.string().trim().min(1, "Select a state"),
  city: z.string().trim().min(1, "Select a city"),
  currency: z.string().trim().min(1, "Select a currency"),
});

export type AddCooperativeFormValues = z.infer<typeof addCooperativeSchema>;

export const editCooperativeSchema = z.object({
  name: z.string().trim().min(1, "Enter the co-operative name"),
  adminFirstName: z.string().trim().min(1, "Enter the admin's first name"),
  adminLastName: z.string().trim().min(1, "Enter the admin's last name"),
  contactEmail: z.email("Enter a valid email address"),
  contactPhone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .regex(/^[\d+\s-]+$/, "Enter a valid phone number"),
  address: z.string().trim().min(1, "Enter the co-operative's address"),
  country: z.string().min(1, "Select a country"),
  state: z.string().trim().min(1, "Select a state"),
  city: z.string().trim().min(1, "Select a city"),
  // Only ever set by an admin editing their own co-op (see AdminCooperativeSettingsTab) — the
  // super admin's own "Edit Cooperative" form never sends these, so they stay optional here.
  currency: z.string().trim().optional(),
  withdrawalFeePercent: z
    .number()
    .min(0, "Enter a percentage of 0 or more")
    .max(100, "Enter a percentage of 100 or less")
    .optional(),
  memberIdPrefix: z
    .string()
    .trim()
    .regex(
      /^[A-Za-z0-9]{1,20}$/,
      "Letters and numbers only, up to 20 characters",
    )
    .optional(),
  memberIdPadding: z
    .number()
    .min(1, "Enter at least 1 digit")
    .max(10, "Enter at most 10 digits")
    .optional(),
  memberIdType: z.enum(["NUMERIC", "ALPHA", "ALPHANUMERIC"]).optional(),
});

export type EditCooperativeFormValues = z.infer<typeof editCooperativeSchema>;

export const editMemberSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name"),
  lastName: z.string().trim().min(1, "Enter a last name"),
  email: z.email("Enter a valid email address"),
  role: z.enum(["Member", "Admin"]),
  guarantor: z.string().trim().min(1, "Enter a guarantor"),
  country: z.string().min(1, "Select a country"),
  state: z.string().trim().min(1, "Select a state"),
  city: z.string().trim().min(1, "Select a city"),
  bankCode: z.string().trim().min(1, "Select a bank"),
  accountNumber: z
    .string()
    .trim()
    .length(10, "Account number must be 10 digits")
    .regex(/^\d+$/, "Account number must contain numbers only"),
  accountName: z.string().trim().optional(),
});

export type EditMemberFormValues = z.infer<typeof editMemberSchema>;
