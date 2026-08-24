"use client";

import { useState } from "react";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useBankList } from "@/hooks/use-bank-list";
import type { CoopMember } from "@/lib/coop-data";
import { coopMemberFullName } from "@/lib/coop-data";
import { findBankByCode } from "@/lib/bank-data";
import { getInitials } from "@/lib/format";

interface CoopMemberHeaderCardProps {
  member: CoopMember;
}

export function CoopMemberHeaderCard({ member }: CoopMemberHeaderCardProps) {
  const fullName = coopMemberFullName(member);
  const [profileOpen, setProfileOpen] = useState(false);

  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 text-center sm:flex-row sm:text-left">
        <Avatar name={fullName} avatarUrl={member.avatarUrl} />

        <div className="min-w-0 flex-1 space-y-3">
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-start">
            <h2 className="text-lg font-semibold text-foreground">
              {fullName}
            </h2>
            <Badge variant="secondary">{member.role}</Badge>
          </div>

          <div className="grid grid-cols-1 gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Membership ID" value={member.id} />
            <Field label="Email" value={member.email} />
            <Field label="Guarantor" value={member.guarantor} />
            <Field label="Country" value={member.country} />
            <Field label="State" value={member.state} />
            <div className="space-y-0.5">
              <p className="text-xs text-muted-foreground">Full Details</p>
              <button
                type="button"
                onClick={() => setProfileOpen(true)}
                className="text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                View Full Profile
              </button>
            </div>
          </div>
        </div>
      </CardContent>

      <FullProfileDialog
        member={member}
        open={profileOpen}
        onOpenChange={setProfileOpen}
      />
    </Card>
  );
}

function Avatar({ name, avatarUrl }: { name: string; avatarUrl?: string }) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={64}
        height={64}
        className="size-16 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span className="flex size-16 shrink-0 items-center justify-center rounded-full bg-primary text-lg font-semibold text-primary-foreground">
      {getInitials(name)}
    </span>
  );
}

function FullProfileDialog({
  member,
  open,
  onOpenChange,
}: {
  member: CoopMember;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { banks } = useBankList();
  const fullName = coopMemberFullName(member);
  const bankName = member.bankCode
    ? (findBankByCode(banks, member.bankCode)?.name ?? member.bankCode)
    : undefined;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <Avatar name={fullName} avatarUrl={member.avatarUrl} />
            <div>
              <DialogTitle>{fullName}</DialogTitle>
              <Badge variant="secondary" className="mt-1">
                {member.role}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="max-h-[60vh] space-y-5 overflow-y-auto pr-1">
          <ProfileSection title="Personal Information">
            <Field label="Membership ID" value={member.id} />
            <Field label="Status" value={member.status} />
            <Field label="First Name" value={member.firstName} />
            <Field label="Last Name" value={member.lastName} />
            <Field label="Other Name" value={member.otherName} />
            <Field label="Gender" value={member.gender} />
            <Field label="Phone" value={member.phone} />
            <Field label="Email" value={member.email} />
            <Field label="NIN" value={member.nin} />
          </ProfileSection>

          <ProfileSection title="Address">
            <Field label="Home Address" value={member.homeAddress} />
            <Field label="Country" value={member.country} />
            <Field label="State" value={member.state} />
            <Field label="City / LGA" value={member.city} />
          </ProfileSection>

          <ProfileSection title="Social Links">
            <Field label="Facebook" value={member.facebook} />
            <Field label="Twitter" value={member.twitter} />
          </ProfileSection>

          <ProfileSection title="Membership">
            <Field label="Guarantor" value={member.guarantor} />
          </ProfileSection>

          <ProfileSection title="Bank Account">
            <Field label="Bank" value={bankName} />
            <Field label="Account Number" value={member.accountNumber} />
            <Field label="Account Name" value={member.accountName} />
          </ProfileSection>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ProfileSection({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2 border-t border-border pt-4 first:border-0 first:pt-0">
      <p className="text-xs font-semibold text-muted-foreground uppercase">
        {title}
      </p>
      <div className="grid grid-cols-1 gap-x-6 gap-y-2.5 sm:grid-cols-2">
        {children}
      </div>
    </div>
  );
}

function Field({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">
        {value && value.trim() ? value : "—"}
      </p>
    </div>
  );
}
