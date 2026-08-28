import { z } from "zod";

export const addMemberSchema = z.object({
  accountNumber: z
    .string()
    .trim()
    .length(10, "Account number must be 10 digits")
    .regex(/^\d+$/, "Account number must contain numbers only"),
  bankCode: z.string().trim().min(1, "Select a bank"),
  /** Resolved from Paystack — read-only in the UI, not directly typed by the user. */
  accountName: z.string().trim().optional(),
  firstName: z.string().trim().min(1, "Enter a first name"),
  lastName: z.string().trim().min(1, "Enter a last name"),
  otherName: z.string().trim().optional(),
  gender: z.enum(["Male", "Female", "Other"]).optional(),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .regex(/^[\d+\s-]+$/, "Enter a valid phone number"),
  email: z.email("Enter a valid email address"),
  homeAddress: z.string().trim().optional(),
  country: z.string().min(1, "Select a country"),
  state: z.string().trim().optional(),
  city: z.string().trim().optional(),
  facebook: z.string().trim().optional(),
  membershipId: z.string().trim().min(1, "Enter a membership ID"),
  // Length enforced against the co-op's own configured minimum in the form itself (a per-co-op
  // setting, not a fixed schema rule) — see AddMemberForm. Index 0 must be an existing member of
  // the co-op (picked via Combobox, which fills in their email/phone too); the rest can be
  // anyone, but every guarantor gets a real email invite and has to accept it.
  guarantors: z
    .array(
      z.object({
        name: z.string().trim().min(1, "Enter the guarantor's name"),
        email: z.email("Enter a valid email address"),
        phone: z
          .string()
          .trim()
          .min(7, "Enter a valid phone number")
          .regex(/^[\d+\s-]+$/, "Enter a valid phone number"),
      }),
    )
    .min(1, "Enter at least one guarantor"),
  nextOfKinName: z.string().trim().optional(),
  nextOfKinPhone: z.string().trim().optional(),
  nextOfKinEmail: z.string().trim().optional(),
  nextOfKinRelationship: z.string().trim().optional(),
  nextOfKinAuthorityLevel: z.string().trim().optional(),
  role: z.enum(["Member", "Admin"]),
  twitter: z.string().trim().optional(),
});

export type AddMemberFormValues = z.infer<typeof addMemberSchema>;
