"use client";

import { useEffect, useId, useState } from "react";
import { KeyRound, Loader2 } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { apiClient } from "@/lib/axios";
import { useAuthStore } from "@/store/auth.store";

interface DefaultPassword {
  password: string;
  ownPassword: boolean;
}

/** Settings → Co-operative: the password every new member starts with. */
export function DefaultPasswordForm({
  coopId: givenCoopId,
}: {
  coopId?: string;
}) {
  const member = useAuthStore((state) => state.member);
  const coopId = givenCoopId ?? member?.cooperativeId ?? member?.id ?? "";
  const queryClient = useQueryClient();
  const inputId = useId();
  const { data, isLoading } = useQuery({
    queryKey: ["default-password", coopId],
    queryFn: async () =>
      (
        await apiClient.get<DefaultPassword>(
          `/cooperatives/${coopId}/default-password`,
        )
      ).data,
    enabled: Boolean(coopId),
  });
  const save = useMutation({
    mutationFn: async (password: string) =>
      (
        await apiClient.put<DefaultPassword>(
          `/cooperatives/${coopId}/default-password`,
          {
            password,
          },
        )
      ).data,
    onSuccess: (result) =>
      queryClient.setQueryData(["default-password", coopId], result),
  });
  const [value, setValue] = useState("");
  useEffect(() => {
    if (data) setValue(data.password);
  }, [data]);

  const problem =
    value && value.includes(" ")
      ? "The password can't have spaces in it"
      : value && value.length < 6
        ? "The password must have at least 6 characters"
        : value && !(/[A-Za-z]/.test(value) && /\d/.test(value))
          ? "Use at least one letter and one number"
          : null;

  const submit = async (password: string) => {
    try {
      const result = await save.mutateAsync(password);
      toast.success("Password saved", {
        description: result.ownPassword
          ? "New members will get this password in their welcome email."
          : "New members will get the standard password again.",
      });
    } catch (error) {
      toast.error("Couldn't save the password", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-start gap-3">
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:text-emerald-300">
            <KeyRound className="size-5" aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-medium text-foreground">
              Password for new members
            </p>
            <p className="text-sm text-muted-foreground">
              Every member you add starts with this password. It is sent to them
              in their welcome email, and they can change it after they log in.
              Members you already added keep their own password.
            </p>
          </div>
        </div>
        {isLoading ? (
          <div className="h-10 animate-pulse rounded-lg bg-muted" />
        ) : (
          <div className="space-y-2 sm:max-w-md">
            <Label htmlFor={inputId}>Starting password</Label>
            <PasswordInput
              id={inputId}
              value={value}
              maxLength={100}
              autoComplete="new-password"
              onChange={(event) => setValue(event.target.value)}
            />
            {problem ? (
              <p className="text-xs text-destructive">{problem}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                At least 6 characters, with a letter and a number.
                {data && !data.ownPassword
                  ? " You're using the standard password now."
                  : ""}
              </p>
            )}
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                disabled={
                  save.isPending ||
                  !!problem ||
                  !value ||
                  value === data?.password
                }
                onClick={() => submit(value)}
              >
                {save.isPending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : null}
                Save password
              </Button>
              {data?.ownPassword ? (
                <Button
                  variant="outline"
                  disabled={save.isPending}
                  onClick={() => submit("")}
                >
                  Use the standard password
                </Button>
              ) : null}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
