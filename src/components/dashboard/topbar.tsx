import { CalendarRange, ChevronDown, LogOut, Mail, ShieldCheck } from "lucide-react";
import { useLocation } from "react-router-dom";
import { useAuth } from "@/auth/auth-context";
import { NotificationCenter } from "@/components/dashboard/notification-center";
import { Button } from "@/components/ui/button";
import headerCorgiIllustration from "@/assets/illustrations/header-corgi-illustration.png";

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
    <header className="relative z-20 flex min-h-[76px] flex-col gap-4 overflow-visible rounded-[24px] border border-white/80 bg-white px-6 py-4 shadow-[0_20px_70px_rgba(16,46,36,0.07)] sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        <div>
          <p className="text-sm font-extrabold text-[#102E24]">{label}</p>
          <div className="mt-1 flex items-center gap-2 text-sm font-semibold text-[#5F756C]">
            <CalendarRange className="h-4 w-4 text-[#087C48]" />
            {new Intl.DateTimeFormat(undefined, {
              weekday: "long",
              month: "long",
              day: "numeric",
              year: "numeric"
            }).format(new Date())}
          </div>
        </div>
        <img
          src={headerCorgiIllustration}
          alt=""
          aria-hidden="true"
          className="hidden h-16 w-auto object-contain xl:block"
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <NotificationCenter />
        <div className="flex items-center gap-3 rounded-2xl border border-[#DDEBE2] bg-white px-4 py-3 shadow-[0_8px_24px_rgba(16,46,36,0.04)]">
          <Mail className="h-5 w-5 text-[#087C48]" />
          <div className="min-w-0">
            <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.18em] text-[#87A89A]">
              <ShieldCheck className="h-3.5 w-3.5" />
              {user?.role ?? "Staff"}
            </div>
            <p className="mt-0.5 max-w-[260px] truncate text-sm font-extrabold text-[#102E24]">{user?.email}</p>
          </div>
          <ChevronDown className="h-4 w-4 text-[#087C48]" />
        </div>
        <Button variant="outline" onClick={logout} className="h-12 rounded-2xl border-[#DDEBE2] px-5 text-[#102E24]">
          <LogOut className="h-4 w-4 text-[#087C48]" />
          Sign out
        </Button>
      </div>
    </header>
  );
}
