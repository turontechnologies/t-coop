"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { motion } from "framer-motion";
import {
  CalendarIcon,
  ChevronDown,
  ClockIcon,
  Loader2,
  Paperclip,
  TriangleAlert,
  X,
} from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { TimePicker, formatTimeLabel } from "@/components/ui/time-picker";
import { formatDateLong } from "@/lib/format";
import { ADMIN_DIRECTORY_COOP_ID } from "@/lib/member-directory";
import type { NoticeAttachment } from "@/types/notice";
import {
  createNoticeSchema,
  type CreateNoticeFormValues,
} from "@/lib/validations/notice.schema";
import { useCooperatives } from "@/hooks/use-cooperatives";
import { useNoticeMutations } from "@/hooks/use-notices";
import type { AuthenticatedMember } from "@/types/auth";

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

interface CreateNoticeFormProps {
  member: AuthenticatedMember;
}

export function CreateNoticeForm({ member }: CreateNoticeFormProps) {
  const router = useRouter();
  const { data: cooperatives = [] } = useCooperatives();
  const { create, uploadAttachment } = useNoticeMutations();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [attachmentError, setAttachmentError] = useState<string | null>(null);

  const isSuperAdmin = member.role === "super_admin";
  const isSubmitting = create.isPending || uploadAttachment.isPending;

  const titleId = useId();
  const messageId = useId();
  const typeId = useId();
  const meetingDateId = useId();
  const scheduleDateId = useId();
  const scheduleTimeId = useId();

  const {
    register,
    handleSubmit,
    control,
    watch,
    formState: { errors },
  } = useForm<CreateNoticeFormValues>({
    resolver: zodResolver(createNoticeSchema),
    defaultValues: {
      type: "General",
      title: "",
      message: "",
      // A super admin only ever reaches a co-op's admin directly (see below) — the backend
      // rejects anything else from that role, so this starts on the one value that's valid.
      recipient: isSuperAdmin ? "All Admins" : "All Members",
      medium: "Email",
      schedule: "now",
      // Admins only ever manage one co-op, so it's picked implicitly and never shown as a
      // field; the backend enforces this server-side too (it ignores this value for anyone
      // but a super admin), so it's really just a placeholder to satisfy the "pick at least
      // one" validation for a field this role never sees.
      targetCoopIds: isSuperAdmin ? [] : [ADMIN_DIRECTORY_COOP_ID],
    },
  });

  const type = watch("type");
  const schedule = watch("schedule");

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setAttachmentError(
        `"${file.name}" is too large — attachments are limited to ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)}MB.`,
      );
      return;
    }
    setAttachmentError(null);
    setAttachedFile(file);
  };

  const onSubmit = handleSubmit(async (values) => {
    let attachment: NoticeAttachment | undefined;
    if (attachedFile) {
      try {
        attachment = await uploadAttachment.mutateAsync(attachedFile);
      } catch (error) {
        toast.error("Couldn't attach that file", {
          description:
            error instanceof Error
              ? error.message
              : "Please try a different file.",
        });
        return;
      }
    }

    const sendAt =
      values.schedule === "now"
        ? new Date().toISOString()
        : new Date(
            `${values.scheduleDate}T${values.scheduleTime}`,
          ).toISOString();

    try {
      const notice = await create.mutateAsync({
        type: values.type,
        title: values.title.trim(),
        message: values.message.trim(),
        recipient: values.recipient,
        medium: values.medium,
        meetingDate: values.meetingDate,
        attachment,
        sendAt,
        targetCoopIds: values.targetCoopIds,
      });

      const coopNames = values.targetCoopIds
        .map((id) => cooperatives.find((coop) => coop.id === id)?.name ?? id)
        .join(", ");
      const audience = isSuperAdmin
        ? `${values.recipient} at ${coopNames}`
        : values.recipient;
      toast.success(
        values.schedule === "now" ? "Notice sent" : "Notice scheduled",
        {
          description:
            values.schedule === "now"
              ? `Delivered to ${audience} via ${values.medium}.`
              : `Will go out to ${audience} via ${values.medium} on ${formatDateLong(new Date(sendAt))}.`,
        },
      );
      router.push(`/notice-board/${notice.id}`);
    } catch (error) {
      toast.error("Couldn't send that notice", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  return (
    <motion.form
      onSubmit={onSubmit}
      noValidate
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="grid grid-cols-1 gap-4 lg:grid-cols-3"
    >
      <Card className="lg:col-span-2">
        <CardHeader>
          <CardTitle>Announcement</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={typeId}>Notice Type</Label>
              <Controller
                control={control}
                name="type"
                render={({ field }) => (
                  <Select
                    value={field.value}
                    onValueChange={(value) =>
                      field.onChange(value ?? "General")
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id={typeId} className="h-11 w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="General">General</SelectItem>
                      <SelectItem value="Meeting Notice">
                        Meeting Notice
                      </SelectItem>
                      <SelectItem value="Meeting Minutes">
                        Meeting Minutes
                      </SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={titleId}>Title</Label>
              <Input
                id={titleId}
                placeholder="Enter a title"
                disabled={isSubmitting}
                aria-invalid={!!errors.title}
                className="h-11"
                {...register("title")}
              />
              <FieldError message={errors.title?.message} />
            </div>
          </div>

          {type === "Meeting Notice" ? (
            <div className="space-y-2">
              <Label htmlFor={meetingDateId}>Meeting Date</Label>
              <Controller
                control={control}
                name="meetingDate"
                render={({ field }) => (
                  <Popover>
                    <PopoverTrigger
                      render={
                        <Button
                          id={meetingDateId}
                          type="button"
                          variant="outline"
                          className="h-11 w-full justify-start font-normal text-muted-foreground data-[has-value=true]:text-foreground"
                          data-has-value={!!field.value}
                        />
                      }
                    >
                      <CalendarIcon className="size-4" aria-hidden="true" />
                      {field.value
                        ? formatDateLong(new Date(field.value))
                        : "Pick the meeting date"}
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={
                          field.value ? new Date(field.value) : undefined
                        }
                        onSelect={(date) =>
                          field.onChange(date ? date.toISOString() : undefined)
                        }
                        autoFocus
                      />
                    </PopoverContent>
                  </Popover>
                )}
              />
              <FieldError message={errors.meetingDate?.message} />
            </div>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor={messageId}>Message</Label>
            <Textarea
              id={messageId}
              rows={8}
              placeholder="Lorem ipsum dolor sit amet, consectetur adipiscing elit."
              disabled={isSubmitting}
              aria-invalid={!!errors.message}
              {...register("message")}
            />
            <FieldError message={errors.message?.message} />
          </div>

          <div className="space-y-2">
            <Label>Attachment</Label>
            {attachedFile ? (
              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="truncate">{attachedFile.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    ({Math.round(attachedFile.size / 1024)} KB)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setAttachedFile(null)}
                  className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                  aria-label="Remove attachment"
                  disabled={isSubmitting}
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                <Paperclip className="size-3.5" aria-hidden="true" />
                Attach a file
              </Button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={handleFileChange}
            />
            <FieldError message={attachmentError ?? undefined} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Message Receiver</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {isSuperAdmin ? (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">
                Target Co-operative
              </p>
              <Controller
                control={control}
                name="targetCoopIds"
                render={({ field }) => (
                  <DropdownMenu>
                    <DropdownMenuTrigger
                      render={
                        <button
                          type="button"
                          disabled={isSubmitting}
                          className="flex h-11 w-full items-center justify-between rounded-lg border border-input bg-transparent px-3 text-sm text-foreground outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        />
                      }
                    >
                      <span
                        className={
                          field.value.length === 0
                            ? "text-muted-foreground"
                            : undefined
                        }
                      >
                        {field.value.length === 0
                          ? "Select co-operative(s)"
                          : field.value.length === cooperatives.length
                            ? "All co-operatives"
                            : `${field.value.length} selected`}
                      </span>
                      <ChevronDown
                        className="size-4 text-muted-foreground"
                        aria-hidden="true"
                      />
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="start"
                      className="w-(--anchor-width) min-w-56"
                    >
                      {cooperatives.map((coop) => (
                        <DropdownMenuCheckboxItem
                          key={coop.id}
                          closeOnClick={false}
                          checked={field.value.includes(coop.id)}
                          onCheckedChange={(checked) => {
                            field.onChange(
                              checked
                                ? [...field.value, coop.id]
                                : field.value.filter((id) => id !== coop.id),
                            );
                          }}
                        >
                          {coop.name}
                        </DropdownMenuCheckboxItem>
                      ))}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              />
              <FieldError message={errors.targetCoopIds?.message} />
            </div>
          ) : null}

          <Controller
            control={control}
            name="recipient"
            render={({ field }) =>
              isSuperAdmin ? (
                // A super admin only ever reaches a co-op's admin — passing it on to members
                // is that admin's own call, not the platform's. The backend rejects anything
                // else from this role, so there's nothing to choose here.
                <p className="text-sm text-muted-foreground">
                  Delivered to each selected co-operative&apos;s admin.
                  It&apos;s their call whether to pass it on to their members.
                </p>
              ) : (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <RadioOption
                    id="recipient-members"
                    value="All Members"
                    label="All Members"
                  />
                  <RadioOption
                    id="recipient-admins"
                    value="All Admins"
                    label="All Admins"
                  />
                  <RadioOption
                    id="recipient-both"
                    value="All Members & Admins"
                    label="All Members & Admins"
                  />
                </RadioGroup>
              )
            }
          />

          <div className="border-t border-border pt-4">
            <p className="mb-3 text-sm font-semibold text-foreground">
              Media Type
            </p>
            <Controller
              control={control}
              name="medium"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                >
                  <RadioOption id="medium-email" value="Email" label="Email" />
                  <RadioOption id="medium-sms" value="SMS" label="SMS" />
                  <RadioOption
                    id="medium-both"
                    value="Email & SMS"
                    label="Both (Email & SMS)"
                  />
                </RadioGroup>
              )}
            />
            <p className="mt-2 text-xs text-muted-foreground">
              Every recipient also gets an in-app notification regardless of
              medium; real Email/SMS delivery for this medium selection
              isn&apos;t wired up yet.
            </p>
          </div>

          <div className="border-t border-border pt-4">
            <Controller
              control={control}
              name="schedule"
              render={({ field }) => (
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  disabled={isSubmitting}
                  className="grid-flow-col justify-start gap-6"
                >
                  <RadioOption id="schedule-now" value="now" label="Send Now" />
                  <RadioOption
                    id="schedule-later"
                    value="later"
                    label="Send Later"
                  />
                </RadioGroup>
              )}
            />

            {schedule === "later" ? (
              <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={scheduleDateId}>Date</Label>
                  <Controller
                    control={control}
                    name="scheduleDate"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              id={scheduleDateId}
                              type="button"
                              variant="outline"
                              className="h-11 w-full justify-start font-normal text-muted-foreground data-[has-value=true]:text-foreground"
                              data-has-value={!!field.value}
                            />
                          }
                        >
                          <CalendarIcon className="size-4" aria-hidden="true" />
                          {field.value
                            ? formatDateLong(new Date(field.value))
                            : "Pick a date"}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={
                              field.value ? new Date(field.value) : undefined
                            }
                            onSelect={(date) =>
                              field.onChange(
                                date
                                  ? date.toISOString().slice(0, 10)
                                  : undefined,
                              )
                            }
                            autoFocus
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  <FieldError message={errors.scheduleDate?.message} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={scheduleTimeId}>Time</Label>
                  <Controller
                    control={control}
                    name="scheduleTime"
                    render={({ field }) => (
                      <Popover>
                        <PopoverTrigger
                          render={
                            <Button
                              id={scheduleTimeId}
                              type="button"
                              variant="outline"
                              disabled={isSubmitting}
                              className="h-11 w-full justify-start font-normal text-muted-foreground data-[has-value=true]:text-foreground"
                              data-has-value={!!field.value}
                              aria-invalid={!!errors.scheduleTime}
                            />
                          }
                        >
                          <ClockIcon className="size-4" aria-hidden="true" />
                          {field.value
                            ? formatTimeLabel(field.value)
                            : "Pick a time"}
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <TimePicker
                            value={field.value}
                            onChange={field.onChange}
                          />
                        </PopoverContent>
                      </Popover>
                    )}
                  />
                  <FieldError message={errors.scheduleTime?.message} />
                </div>
              </div>
            ) : null}
          </div>

          <div className="flex flex-col-reverse gap-3 border-t border-border pt-4 sm:flex-row sm:justify-end">
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.push("/notice-board")}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="sm:w-28">
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              ) : (
                "Send"
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.form>
  );
}

function RadioOption({
  id,
  value,
  label,
}: {
  id: string;
  value: string;
  label: string;
}) {
  return (
    <div className="flex items-center gap-2">
      <RadioGroupItem id={id} value={value} />
      <Label htmlFor={id} className="font-normal">
        {label}
      </Label>
    </div>
  );
}

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive">
      <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
