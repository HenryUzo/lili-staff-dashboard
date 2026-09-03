import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "@/auth/auth-context";

export function ProtectedRoute() {
  const { isAuthenticated, isRestoring } = useAuth();
  const location = useLocation();

  if (isRestoring) {
    return <main className="grid min-h-screen place-items-center bg-[#F4FAF5] text-sm font-semibold text-[#60736B]">Checking secure session...</main>;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}
