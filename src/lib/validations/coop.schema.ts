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
});

export type AddCooperativeFormValues = z.infer<typeof addCooperativeSchema>;

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
