import { ClipboardList, LayoutDashboard, PawPrint, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import careOperationsHeartline from "@/assets/illustrations/care-operations-heartline.png";
import dogCatSidebarIllustration from "@/assets/illustrations/dog-cat-sidebar-illustration.png";
import liliLogo from "@/assets/illustrations/lili-logo.svg";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/appointments", label: "Appointment Requests", icon: ClipboardList },
  { to: "/new-patients", label: "New Patient Requests", icon: PawPrint }
];

export function Sidebar() {
  return (
    <aside className="hidden h-[calc(100vh-32px)] w-[280px] shrink-0 rounded-[28px] border border-white/80 bg-white p-6 shadow-[0_24px_80px_rgba(16,46,36,0.08)] lg:sticky lg:top-4 lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3">
        <img src={liliLogo} alt="Lili Vet Hospital" className="h-14 w-auto" />
      </div>

      <div className="relative mb-8 overflow-hidden rounded-[22px] bg-gradient-to-br from-[#087C48] to-[#063F2A] p-5 text-white shadow-[0_18px_40px_rgba(8,124,72,0.18)]">
        <img
          src={careOperationsHeartline}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 right-0 w-24 opacity-25"
        />
        <p className="relative text-xs font-bold uppercase tracking-[0.24em] text-white/75">Care operations</p>
        <h3 className="relative mt-3 text-xl font-extrabold leading-snug">Calm control over every request.</h3>
        <p className="relative mt-3 text-sm font-medium leading-6 text-white/86">
          Review urgent cases, triage new patients, and keep staff workflows clear.
        </p>
      </div>

      <nav className="space-y-3">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-bold transition",
                isActive
                  ? "bg-[#EAF7F0] text-[#087C48]"
                  : "text-[#102E24] hover:bg-[#F5FBF7] hover:text-[#087C48]"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto space-y-6">
        <img
          src={dogCatSidebarIllustration}
          alt=""
          aria-hidden="true"
          className="mx-auto w-[210px]"
        />
        <div className="rounded-[20px] border border-[#DDEBE2] bg-white p-5 text-sm leading-6 text-[#5F756C] shadow-[0_16px_45px_rgba(16,46,36,0.06)]">
          <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-xl bg-[#EAF7F0] text-[#087C48]">
            <ShieldCheck className="h-4 w-4" />
          </div>
          <p className="font-bold text-[#102E24]">Protected staff access only.</p>
          <p className="mt-1">Actions taken here should reflect live clinic decisions.</p>
        </div>
      </div>
    </aside>
  );
}
