import { Navigate } from "react-router-dom";
import { useAuth } from "@/auth/auth-context";
import { hasPermission, isSuperAdmin } from "@/lib/permissions";

export function DashboardHomePage() {
  const { user } = useAuth();
  if (isSuperAdmin(user)) return <Navigate to="/overview" replace />;
  if (hasPermission(user, "APPOINTMENTS_VIEW")) return <Navigate to="/appointments" replace />;
  if (hasPermission(user, "NEW_PATIENTS_VIEW")) return <Navigate to="/new-patients" replace />;
  if (hasPermission(user, "CLIENTS_VIEW")) return <Navigate to="/clients" replace />;
  if (hasPermission(user, "PET_CARE_VIEW")) return <Navigate to="/pet-care" replace />;
  return <Navigate to="/forbidden" replace />;
}
