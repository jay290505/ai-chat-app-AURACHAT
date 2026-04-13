"use client";

import type { Profile } from "@/types/database";

interface ProfileAvatarProps {
  profile: Profile;
  isOwnProfile?: boolean;
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
}

export function ProfileAvatar({
  profile,
  size = "md",
  onClick,
}: ProfileAvatarProps) {
  const sizeClasses =
    size === "sm"
      ? "h-8 w-8"
      : size === "lg"
        ? "h-16 w-16"
        : "h-12 w-12";

  const initials =
    profile.full_name?.charAt(0).toUpperCase() ??
    profile.username?.charAt(0).toUpperCase() ??
    "?";

  const content = (
    <div
      className={`relative flex items-center justify-center rounded-[18px] bg-gradient-to-br from-slate-800 to-navy-deep text-sm font-bold text-white shadow-xl ring-1 ring-white/10 transition-all duration-500 overflow-hidden ${sizeClasses} ${onClick ? 'cursor-pointer hover:scale-110 active:scale-95 group-hover:ring-blue-500/30' : ''}`}
    >
      {profile.avatar_url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={profile.avatar_url}
          alt={profile.full_name ?? profile.username ?? "Profile"}
          className="h-full w-full object-cover"
        />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className="outline-none">
        {content}
      </button>
    );
  }

  return content;
}

