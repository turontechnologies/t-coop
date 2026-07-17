import { z } from "zod";

export const profileSchema = z.object({
  bvn: z
    .string()
    .trim()
    .length(11, "BVN must be 11 digits")
    .regex(/^\d+$/, "BVN must contain numbers only"),
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
  state: z.string().trim().min(1, "Enter your state"),
  facebook: z.string().trim().optional(),
  twitter: z.string().trim().optional(),
  guarantor: z.string().trim().optional(),
});

export type ProfileFormValues = z.infer<typeof profileSchema>;
