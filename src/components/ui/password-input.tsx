"use client";

import * as React from "react";
import { Eye, EyeOff } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

type PasswordInputProps = Omit<React.ComponentProps<"input">, "type">;

/**
 * A password field with a built-in show/hide toggle — the same pattern
 * used across the app (login, password reset), pulled into one place so
 * new password fields get it for free instead of reimplementing the
 * eye-icon button each time.
 */
function PasswordInput({ className, ...props }: PasswordInputProps) {
  const [revealed, setRevealed] = React.useState(false);

  return (
    <div className={cn("relative", className)}>
      <Input
        type={revealed ? "text" : "password"}
        className={cn("pr-10", className)}
        {...props}
      />
      <button
        type="button"
        onClick={() => setRevealed((value) => !value)}
        className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
        aria-label={revealed ? "Hide password" : "Show password"}
        aria-pressed={revealed}
        tabIndex={-1}
      >
        {revealed ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </button>
    </div>
  );
}

export { PasswordInput };
