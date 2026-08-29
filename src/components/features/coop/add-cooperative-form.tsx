"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Building2, Camera, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CurrencyCombobox } from "@/components/features/admin-settings/currency-combobox";
import { LocationFields } from "@/components/features/shared/location-fields";
import { useCreateCooperative } from "@/hooks/use-create-cooperative";
import { useNextCoopId } from "@/hooks/use-next-id";
import { cooperativeService } from "@/services/cooperative.service";
import {
  addCooperativeSchema,
  type AddCooperativeFormValues,
} from "@/lib/validations/coop.schema";

const ALLOWED_LOGO_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_LOGO_BYTES = 5 * 1024 * 1024;

export function AddCooperativeForm() {
  const router = useRouter();
  const createCooperative = useCreateCooperative();
  const { data: nextCoopId, isLoading: loadingNextId } = useNextCoopId();
  const logoInputRef = useRef<HTMLInputElement>(null);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const coopIdId = useId();
  const coopNameId = useId();
  const adminFirstNameId = useId();
  const adminLastNameId = useId();
  const adminNinId = useId();
  const contactEmailId = useId();
  const contactPhoneId = useId();
  const addressId = useId();

  const handleLogoChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_LOGO_TYPES.has(file.type)) {
      toast.error("Unsupported file type", {
        description: "Please choose a PNG, JPEG, or WEBP image.",
      });
      return;
    }
    if (file.size > MAX_LOGO_BYTES) {
      toast.error("Image too large", {
        description: "Please choose an image under 5MB.",
      });
      return;
    }
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    setError,
    formState: { errors },
  } = useForm<AddCooperativeFormValues>({
    resolver: zodResolver(addCooperativeSchema),
    defaultValues: {
      coopId: "",
      coopName: "",
      adminFirstName: "",
      adminLastName: "",
      adminNin: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      country: "",
      state: "",
      city: "",
      currency: "NGN",
    },
  });

  // Auto-generated per the super admin's own configured format (Settings -> Payment Settings ->
  // Fees & Charges -> Co-op ID Format) — read-only here, not something typed in per co-op.
  useEffect(() => {
    if (nextCoopId) setValue("coopId", nextCoopId, { shouldValidate: true });
  }, [nextCoopId, setValue]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      const coop = await createCooperative.mutateAsync({
        ...values,
        coopId: values.coopId.trim(),
        coopName: values.coopName.trim(),
        contactEmail: values.contactEmail.trim(),
        contactPhone: values.contactPhone.trim(),
        address: values.address.trim(),
        state: values.state.trim(),
      });
      toast.success("Co-operative created", {
        description: `${coop.name} can now sign in with ID "${coop.id}" and the default password — details were emailed to ${coop.contactEmail}.`,
      });

      // Best-effort — the co-op already exists at this point regardless of whether this
      // succeeds, same discipline as the welcome email above (see CooperativeController.create).
      if (logoFile) {
        try {
          await cooperativeService.uploadLogo(coop.id, logoFile);
        } catch {
          toast.error("Co-operative created, but the logo upload failed", {
            description: "Add it later from the co-op's own Settings.",
          });
        }
      }

      router.push(`/co-operatives/${coop.id}`);
    } catch (error) {
      if (error instanceof Error && /co-op id/i.test(error.message)) {
        setError("coopId", { message: error.message });
        return;
      }
      toast.error("Couldn't create co-operative", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  const busy = createCooperative.isPending;

  return (
    <motion.form
      onSubmit={onSubmit}
      noValidate
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Co-operative Details</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label>Co-operative Logo</Label>
            <div className="flex items-center gap-4">
              <div className="relative shrink-0">
                {logoPreview ? (
                  // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
                  <img
                    src={logoPreview}
                    alt="Co-operative logo preview"
                    className="size-16 rounded-lg object-cover ring-1 ring-border"
                  />
                ) : (
                  <span className="flex size-16 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border">
                    <Building2 className="size-6" aria-hidden="true" />
                  </span>
                )}
                <input
                  ref={logoInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleLogoChange}
                  className="hidden"
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={busy}
                  className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-card text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground disabled:opacity-60"
                  aria-label="Choose co-operative logo"
                >
                  <Camera className="size-3" aria-hidden="true" />
                </button>
              </div>
              <p className="text-xs text-muted-foreground">
                Optional — the co-op&apos;s admin can also add or change this
                later from their own Settings. PNG, JPEG, or WEBP, up to 5MB.
              </p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor={coopIdId}>Co-op ID</Label>
            <Input
              id={coopIdId}
              placeholder={loadingNextId ? "Generating…" : undefined}
              disabled
              className="h-11"
              aria-invalid={!!errors.coopId}
              {...register("coopId")}
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated — change the format in Settings.
            </p>
            <FieldError message={errors.coopId?.message} />
          </div>
          <div className="space-y-2">
            <Label>Currency</Label>
            <Controller
              control={control}
              name="currency"
              render={({ field }) => (
                <CurrencyCombobox
                  value={field.value}
                  onChange={field.onChange}
                  disabled={busy}
                />
              )}
            />
            <p className="text-xs text-muted-foreground">
              The co-op&apos;s admin can change this later from their own
              Settings.
            </p>
            <FieldError message={errors.currency?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={coopNameId}>Co-operative Name</Label>
            <Input
              id={coopNameId}
              placeholder="Enter co-op name"
              disabled={busy}
              className="h-11"
              aria-invalid={!!errors.coopName}
              {...register("coopName")}
            />
            <FieldError message={errors.coopName?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={adminFirstNameId}>Admin First Name</Label>
            <Input
              id={adminFirstNameId}
              placeholder="Enter first name"
              disabled={busy}
              className="h-11"
              aria-invalid={!!errors.adminFirstName}
              {...register("adminFirstName")}
            />
            <FieldError message={errors.adminFirstName?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={adminLastNameId}>Admin Last Name</Label>
            <Input
              id={adminLastNameId}
              placeholder="Enter last name"
              disabled={busy}
              className="h-11"
              aria-invalid={!!errors.adminLastName}
              {...register("adminLastName")}
            />
            <FieldError message={errors.adminLastName?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={adminNinId}>Admin&apos;s NIN</Label>
            <Input
              id={adminNinId}
              placeholder="Enter NIN"
              disabled={busy}
              className="h-11"
              aria-invalid={!!errors.adminNin}
              {...register("adminNin")}
            />
            <FieldError message={errors.adminNin?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={contactEmailId}>Contact Email</Label>
            <Input
              id={contactEmailId}
              type="email"
              placeholder="Enter contact email"
              disabled={busy}
              className="h-11"
              aria-invalid={!!errors.contactEmail}
              {...register("contactEmail")}
            />
            <FieldError message={errors.contactEmail?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={contactPhoneId}>Contact Phone No</Label>
            <Input
              id={contactPhoneId}
              type="tel"
              placeholder="Enter phone number"
              disabled={busy}
              className="h-11"
              aria-invalid={!!errors.contactPhone}
              {...register("contactPhone")}
            />
            <FieldError message={errors.contactPhone?.message} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={addressId}>Address</Label>
            <Input
              id={addressId}
              placeholder="Enter address"
              disabled={busy}
              className="h-11"
              aria-invalid={!!errors.address}
              {...register("address")}
            />
            <FieldError message={errors.address?.message} />
          </div>
          <LocationFields
            country={watch("country")}
            state={watch("state")}
            city={watch("city")}
            onCountryChange={(value) =>
              setValue("country", value, { shouldValidate: true })
            }
            onStateChange={(value) =>
              setValue("state", value, { shouldValidate: true })
            }
            onCityChange={(value) =>
              setValue("city", value, { shouldValidate: true })
            }
            disabled={busy}
            countryError={errors.country?.message}
            stateError={errors.state?.message}
            cityError={errors.city?.message}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/co-operatives")}
          disabled={busy}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={busy} className="sm:w-52">
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Creating…
            </>
          ) : (
            "Create Co-operative"
          )}
        </Button>
      </div>
    </motion.form>
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
