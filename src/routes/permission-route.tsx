import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/auth-context";
import { hasPermission, isSuperAdmin } from "@/lib/permissions";
import type { PermissionKey } from "@/types/api";

export function PermissionRoute({ permission, superAdminOnly = false }: { permission?: PermissionKey; superAdminOnly?: boolean }) {
  const { user } = useAuth();
  const location = useLocation();
  const allowed = superAdminOnly ? isSuperAdmin(user) : permission ? hasPermission(user, permission) : true;
  if (!allowed) return <Navigate to="/forbidden" replace state={{ from: location.pathname }} />;
  return <Outlet />;
}
