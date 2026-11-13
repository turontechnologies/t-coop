import { z } from "zod";

// Reused everywhere a co-op's admin/contact person's NIN is captured — optional (blank is fine),
// but a value that's entered has to be exactly 11 digits or it's not a real NIN.
const ninField = z
  .string()
  .trim()
  .regex(/^$|^\d{11}$/, "NIN must be 11 digits")
  .optional();

export const addCooperativeSchema = z.object({
  coopId: z.string().trim().min(1, "Enter a co-op ID"),
  coopName: z.string().trim().min(1, "Enter the co-operative name"),
  adminFirstName: z.string().trim().min(1, "Enter the admin's first name"),
  adminLastName: z.string().trim().min(1, "Enter the admin's last name"),
  adminNin: ninField,
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

export const editCooperativeSchema = z
  .object({
    name: z.string().trim().min(1, "Enter the co-operative name"),
    adminFirstName: z.string().trim().min(1, "Enter the admin's first name"),
    adminLastName: z.string().trim().min(1, "Enter the admin's last name"),
    adminNin: ninField,
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
    withdrawalFeeAmount: z
      .number()
      .min(0, "Enter an amount of 0 or more")
      .optional(),
    withdrawalFeeType: z.enum(["Fixed", "Percentage"]).optional(),
    savingsChargeAmount: z
      .number()
      .min(0, "Enter an amount of 0 or more")
      .optional(),
    savingsChargeType: z.enum(["Fixed", "Percentage"]).optional(),
    loansChargeAmount: z
      .number()
      .min(0, "Enter an amount of 0 or more")
      .optional(),
    loansChargeType: z.enum(["Fixed", "Percentage"]).optional(),
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
    /** Require a guarantor when adding a member. */
    requireMemberGuarantors: z.boolean().optional(),
    /** With guarantors required: the minimum number for each new member. */
    minGuarantors: z
      .number({ error: "Enter a number" })
      .int("Whole numbers only")
      .min(1, "At least 1 guarantor")
      .max(10, "At most 10 guarantors")
      .optional(),
    /** Anyone, members of the co-op only, or a set number from each side. */
    memberGuarantorSource: z.enum(["Any", "CoopOnly", "Mix"]).optional(),
    memberGuarantorsFromCoop: z
      .number({ error: "Enter a number" })
      .int("Whole numbers only")
      .min(0, "Enter 0 or more")
      .max(10, "At most 10")
      .optional(),
    memberGuarantorsFromOutside: z
      .number({ error: "Enter a number" })
      .int("Whole numbers only")
      .min(0, "Enter 0 or more")
      .max(10, "At most 10")
      .optional(),
    /** What the co-op calls the alternative ID; empty means "Alternative ID". */
    alternativeIdLabel: z
      .string()
      .trim()
      .max(40, "Keep it under 40 characters")
      .optional(),
  })
  .superRefine((values, ctx) => {
    if (
      !values.requireMemberGuarantors ||
      values.memberGuarantorSource !== "Mix"
    )
      return;
    const fromCoop = values.memberGuarantorsFromCoop ?? 0;
    const fromOutside = values.memberGuarantorsFromOutside ?? 0;
    const min = values.minGuarantors ?? 1;
    if (fromCoop + fromOutside === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["memberGuarantorsFromCoop"],
        message: 'Set how many come from each side, or choose "Anyone".',
      });
    } else if (fromCoop + fromOutside > min) {
      ctx.addIssue({
        code: "custom",
        path: ["memberGuarantorsFromCoop"],
        message: `${fromCoop} + ${fromOutside} is more than the minimum of ${min}. Raise the minimum or lower one of these.`,
      });
    }
  });

export type EditCooperativeFormValues = z.infer<typeof editCooperativeSchema>;

export const editMemberSchema = z.object({
  firstName: z.string().trim().min(1, "Enter a first name"),
  lastName: z.string().trim().min(1, "Enter a last name"),
  email: z.email("Enter a valid email address"),
  role: z.enum(["Member", "Admin"]),
  guarantor: z.string().trim().optional(),
  alternativeId: z
    .string()
    .trim()
    .max(50, "Keep it under 50 characters")
    .optional(),
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

export const transferAdminSchema = z.object({
  newFirstName: z.string().trim().min(1, "Enter the new admin's first name"),
  newLastName: z.string().trim().min(1, "Enter the new admin's last name"),
  newNin: ninField,
  newEmail: z.email("Enter a valid email address"),
  newPhone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .regex(/^[\d+\s-]+$/, "Enter a valid phone number"),
});

export type TransferAdminFormValues = z.infer<typeof transferAdminSchema>;
