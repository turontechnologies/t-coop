"use client";

import { useRef } from "react";
import { Building2, Camera, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useUploadCooperativeLogo } from "@/hooks/use-update-cooperative";

interface CooperativeLogoUploaderProps {
  coopId: string;
  logoUrl: string | null;
  name: string;
}

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

/** Uploads the co-op's own logo — shown on the admin/members' dashboard sidebar. Reused by the
 * super admin's Add Co-operative flow (right after creation) and the admin's own Settings ->
 * Co-operative tab. */
export function CooperativeLogoUploader({
  coopId,
  logoUrl,
  name,
}: CooperativeLogoUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const uploadLogo = useUploadCooperativeLogo(coopId);

  const handleFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error("Unsupported file type", {
        description: "Please choose a PNG, JPEG, or WEBP image.",
      });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Image too large", {
        description: "Please choose an image under 5MB.",
      });
      return;
    }

    try {
      await uploadLogo.mutateAsync(file);
      toast.success("Co-operative logo updated");
    } catch (error) {
      toast.error("Couldn't upload logo", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <div className="flex items-center gap-4">
      <div className="relative shrink-0">
        {logoUrl ? (
          // eslint-disable-next-line @next/next/no-img-element -- arbitrary Cloudinary URL
          <img
            src={logoUrl}
            alt={name}
            className="size-16 rounded-lg object-cover ring-1 ring-border"
          />
        ) : (
          <span className="flex size-16 items-center justify-center rounded-lg bg-muted text-muted-foreground ring-1 ring-border">
            <Building2 className="size-6" aria-hidden="true" />
          </span>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp"
          onChange={handleFileChange}
          className="hidden"
        />
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={uploadLogo.isPending}
          className="absolute -right-1 -bottom-1 flex size-6 items-center justify-center rounded-full bg-card text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground disabled:opacity-60"
          aria-label="Change co-operative logo"
        >
          {uploadLogo.isPending ? (
            <Loader2 className="size-3 animate-spin" aria-hidden="true" />
          ) : (
            <Camera className="size-3" aria-hidden="true" />
          )}
        </button>
      </div>
      <div className="space-y-0.5">
        <p className="text-sm font-medium text-foreground">Co-operative Logo</p>
        <p className="text-xs text-muted-foreground">
          Shown on your co-operative&apos;s dashboard sidebar. PNG, JPEG, or
          WEBP, up to 5MB.
        </p>
      </div>
    </div>
  );
}
