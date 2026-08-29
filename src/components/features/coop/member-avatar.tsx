import { getInitials } from "@/lib/format";

interface MemberAvatarProps {
  avatarUrl?: string | null;
  name: string;
  className?: string;
}

/** A member's profile photo, or their initials if they haven't uploaded one — used anywhere a
 * super admin or co-op admin lists members (Members Directory, a co-op's own member roster) so
 * they can see who's who at a glance, same as the dashboard topbar's own avatar. */
export function MemberAvatar({
  avatarUrl,
  name,
  className = "size-8",
}: MemberAvatarProps) {
  if (avatarUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- arbitrary Cloudinary URL
      <img
        src={avatarUrl}
        alt={name}
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      className={`flex ${className} shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground`}
    >
      {getInitials(name)}
    </span>
  );
}
