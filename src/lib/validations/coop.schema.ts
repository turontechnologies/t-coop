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
  state: z.string().trim().min(1, "Enter the state"),
});

export type AddCooperativeFormValues = z.infer<typeof addCooperativeSchema>;
