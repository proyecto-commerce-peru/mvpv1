import type { User, UserProfile } from "@prisma/client";

export type UserDto = {
  id: string;
  tenant_id: string;
  email: string;
  status: string;
  email_verified_at: Date | null;
  last_login_at: Date | null;
  created_at: Date;
  updated_at: Date;
  profile?: {
    full_name: string;
    phone: string | null;
    locale: string;
    timezone: string;
  };
};

export function toUserDto(user: User & { UserProfile?: UserProfile[] }): UserDto {
  const profile = user.UserProfile?.[0];

  return {
    id: user.id,
    tenant_id: user.tenant_id,
    email: user.email,
    status: user.status,
    email_verified_at: user.email_verified_at,
    last_login_at: user.last_login_at,
    created_at: user.created_at,
    updated_at: user.updated_at,
    profile: profile
      ? {
          full_name: profile.full_name,
          phone: profile.phone,
          locale: profile.locale,
          timezone: profile.timezone,
        }
      : undefined,
  };
}