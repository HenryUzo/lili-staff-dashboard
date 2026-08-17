import type { PermissionKey, StaffUser } from "@/types/api";

export function isSuperAdmin(user: StaffUser | null | undefined) {
  return user?.role === "SUPER_ADMIN";
}

export function hasPermission(user: StaffUser | null | undefined, permission: PermissionKey) {
  return isSuperAdmin(user) || Boolean(user && Array.isArray(user.permissions) && user.permissions.includes(permission));
}
