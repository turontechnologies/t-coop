import { z } from "zod";

export const addMemberSchema = z.object({
  bvn: z
    .string()
    .trim()
    .length(11, "BVN must be 11 digits")
    .regex(/^\d+$/, "BVN must contain numbers only"),
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
  facebook: z.string().trim().optional(),
  membershipId: z.string().trim().min(1, "Enter a membership ID"),
  guarantor: z.string().trim().min(1, "Select a guarantor"),
  role: z.enum(["Member", "Admin"]),
  twitter: z.string().trim().optional(),
});

export type AddMemberFormValues = z.infer<typeof addMemberSchema>;
