"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { Camera, IdCard, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { getRoleLabel } from "@/config/dashboard-nav";
import { getInitials } from "@/lib/format";
import { useAuthStore } from "@/store/auth.store";
import type { AuthenticatedMember } from "@/types/auth";

interface ProfileHeaderCardProps {
  member: AuthenticatedMember;
}

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

export function ProfileHeaderCard({ member }: ProfileHeaderCardProps) {
  const setAvatarUrl = useAuthStore((state) => state.setAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

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

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Upload failed");

      setAvatarUrl(data.url);
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error("Couldn't upload photo", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <div className="relative shrink-0">
          {member.avatarUrl ? (
            <Image
              src={member.avatarUrl}
              alt={member.name}
              width={80}
              height={80}
              className="size-20 rounded-full object-cover"
            />
          ) : (
            <span className="flex size-20 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
              {getInitials(member.name)}
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
            disabled={uploading}
            className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-card text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground disabled:opacity-60"
            aria-label="Change profile photo"
          >
            {uploading ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
            ) : (
              <Camera className="size-3.5" aria-hidden="true" />
            )}
          </button>
        </div>

        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h2 className="text-lg font-semibold text-foreground">
              {member.name}
            </h2>
            <Badge variant="secondary">{getRoleLabel(member.role)}</Badge>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-sm text-muted-foreground sm:justify-start">
            <span className="flex items-center gap-1.5">
              <Mail className="size-3.5" aria-hidden="true" />
              {member.email}
            </span>
            <span className="flex items-center gap-1.5">
              <IdCard className="size-3.5" aria-hidden="true" />
              {member.id}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
