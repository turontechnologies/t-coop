"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { COUNTRIES } from "@/lib/countries";
import type { Cooperative } from "@/lib/coop-data";
import {
  addCooperativeSchema,
  type AddCooperativeFormValues,
} from "@/lib/validations/coop.schema";
import { useCoopStore } from "@/store/coop.store";

export function AddCooperativeForm() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const addCooperative = useCoopStore((state) => state.addCooperative);

  const coopIdId = useId();
  const coopNameId = useId();
  const adminFirstNameId = useId();
  const adminLastNameId = useId();
  const contactEmailId = useId();
  const contactPhoneId = useId();
  const addressId = useId();
  const countryId = useId();
  const stateId = useId();

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors },
  } = useForm<AddCooperativeFormValues>({
    resolver: zodResolver(addCooperativeSchema),
    defaultValues: {
      coopId: "",
      coopName: "",
      adminFirstName: "",
      adminLastName: "",
      contactEmail: "",
      contactPhone: "",
      address: "",
      country: "",
      state: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    const isTaken = cooperatives.some(
      (coop) => coop.id.toLowerCase() === values.coopId.trim().toLowerCase(),
    );
    if (isTaken) {
      setError("coopId", {
        message: "That co-op ID is already in use. Please choose another.",
      });
      return;
    }

    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 900));

    const coop: Cooperative = {
      id: values.coopId.trim(),
      name: values.coopName.trim(),
      adminName: `${values.adminFirstName.trim()} ${values.adminLastName.trim()}`,
      contactEmail: values.contactEmail.trim(),
      contactPhone: values.contactPhone.trim(),
      address: values.address.trim(),
      country: values.country,
      state: values.state.trim(),
      status: "Active",
      members: [],
      savings: [],
      loans: [],
      savingsRequests: [],
    };

    addCooperative(coop);
    setBusy(false);
    toast.success("Co-operative created", {
      description: `${coop.name} has been added.`,
    });
    router.push(`/co-operatives/${coop.id}`);
  });

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
          <div className="space-y-2">
            <Label htmlFor={coopIdId}>Co-op ID</Label>
            <Input
              id={coopIdId}
              placeholder="e.g. COOP-0004"
              disabled={busy}
              className="h-11"
              aria-invalid={!!errors.coopId}
              {...register("coopId")}
            />
            <FieldError message={errors.coopId?.message} />
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
          <div className="space-y-2">
            <Label htmlFor={countryId}>Country</Label>
            <Controller
              control={control}
              name="country"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(value) => field.onChange(value ?? "")}
                  disabled={busy}
                >
                  <SelectTrigger
                    id={countryId}
                    className="h-11 w-full"
                    aria-invalid={!!errors.country}
                  >
                    <SelectValue placeholder="Select country" />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTRIES.map((country) => (
                      <SelectItem key={country} value={country}>
                        {country}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
            <FieldError message={errors.country?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={stateId}>State</Label>
            <Input
              id={stateId}
              placeholder="Enter state"
              disabled={busy}
              className="h-11"
              aria-invalid={!!errors.state}
              {...register("state")}
            />
            <FieldError message={errors.state?.message} />
          </div>
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
