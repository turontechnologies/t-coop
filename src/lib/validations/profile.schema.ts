import { z } from "zod";

export const profileSchema = z.object({
  accountNumber: z
    .string()
    .trim()
    .length(10, "Account number must be 10 digits")
    .regex(/^\d+$/, "Account number must contain numbers only"),
  bankCode: z.string().trim().min(1, "Select a bank"),
  /** Resolved from Paystack — read-only in the UI, not directly typed by the user. */
  accountName: z.string().trim().optional(),
  nin: z
    .string()
    .trim()
    .length(11, "NIN must be 11 digits")
    .regex(/^\d+$/, "NIN must contain numbers only"),
  firstName: z.string().trim().min(1, "Enter your first name"),
  lastName: z.string().trim().min(1, "Enter your last name"),
  otherName: z.string().trim().optional(),
  gender: z.enum(["Male", "Female", "Other"]),
  phone: z
    .string()
    .trim()
    .min(7, "Enter a valid phone number")
    .regex(/^[\d+\s-]+$/, "Enter a valid phone number"),
  email: z.email("Enter a valid email address"),
  homeAddress: z.string().trim().min(1, "Enter your home address"),
  country: z.string().min(1, "Select a country"),
  state: z.string().trim().min(1, "Select a state"),
  city: z.string().trim().min(1, "Select a city"),
  facebook: z.string().trim().optional(),
  twitter: z.string().trim().optional(),
  guarantor: z.string().trim().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
