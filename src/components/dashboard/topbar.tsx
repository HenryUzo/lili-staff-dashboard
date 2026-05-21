import { CalendarRange, LogOut, ShieldCheck } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/auth/auth-context";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { Button } from "@/components/ui/button";

const labels: Record<string, string> = {
  "/": "Operations overview",
  "/appointments": "Appointment request queue",
  "/new-patients": "New patient intake queue"
};

export function Topbar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const basePath = `/${location.pathname.split("/")[1]}`.replace("//", "/");
  const label = labels[basePath] ?? "Staff dashboard";

  return (
    <header className="surface-glass relative z-20 flex flex-col gap-4 rounded-[28px] px-5 py-4 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <p className="text-sm font-medium text-muted-foreground">{label}</p>
        <div className="mt-1 flex items-center gap-2 text-sm text-primary">
          <CalendarRange className="h-4 w-4" />
          {new Intl.DateTimeFormat(undefined, {
            weekday: "long",
            month: "long",
            day: "numeric",
            year: "numeric"
          }).format(new Date())}
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <NotificationCenter />
        <div className="rounded-2xl border border-border bg-white px-4 py-3 text-right">
          <div className="flex items-center justify-end gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary/70">
            <ShieldCheck className="h-3.5 w-3.5" />
            {user?.role ?? "Staff"}
          </div>
          <p className="mt-1 text-sm font-semibold text-foreground">{user?.email}</p>
        </div>
        <Button variant="outline" onClick={logout}>
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
