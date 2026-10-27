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
  nin: z
    .string()
    .trim()
    .regex(/^$|^\d{11}$/, "NIN must be 11 digits")
    .optional(),
  homeAddress: z.string().trim().optional(),
  country: z.string().min(1, "Select a country"),
  state: z.string().trim().optional(),
  city: z.string().trim().optional(),
  facebook: z.string().trim().optional(),
  membershipId: z.string().trim().min(1, "Enter a membership ID"),
  // No guarantor to join — a member only names one when applying for a loan. Next-of-kin details
  // are all optional.
  nextOfKinName: z.string().trim().optional(),
  nextOfKinPhone: z.string().trim().optional(),
  nextOfKinEmail: z.string().trim().optional(),
  nextOfKinRelationship: z.string().trim().optional(),
  nextOfKinAuthorityLevel: z.string().trim().optional(),
  role: z.enum(["Member", "Admin"]),
  twitter: z.string().trim().optional(),
});

export type AddMemberFormValues = z.infer<typeof addMemberSchema>;
