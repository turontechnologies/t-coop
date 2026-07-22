import { z } from "zod";

export const createNoticeSchema = z
  .object({
    type: z.enum(["General", "Meeting Notice", "Meeting Minutes"]),
    title: z.string().trim().min(1, "Enter a title"),
    message: z.string().trim().min(1, "Enter an announcement message"),
    recipient: z.enum(["All Members", "All Admins", "All Members & Admins"]),
    medium: z.enum(["Email", "SMS", "Email & SMS"]),
    meetingDate: z.string().optional(),
    schedule: z.enum(["now", "later"]),
    scheduleDate: z.string().optional(),
    scheduleTime: z.string().optional(),
  })
  .refine(
    (values) => values.type !== "Meeting Notice" || !!values.meetingDate,
    { message: "Enter the meeting date", path: ["meetingDate"] },
  )
  .refine((values) => values.schedule !== "later" || !!values.scheduleDate, {
    message: "Pick a date to send on",
    path: ["scheduleDate"],
  })
  .refine((values) => values.schedule !== "later" || !!values.scheduleTime, {
    message: "Pick a time to send at",
    path: ["scheduleTime"],
  });

export type CreateNoticeFormValues = z.infer<typeof createNoticeSchema>;

export const replySchema = z.object({
  message: z.string().trim().min(1, "Enter a message"),
});

export type ReplyFormValues = z.infer<typeof replySchema>;
