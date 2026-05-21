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
    <aside className="hidden h-[calc(100vh-32px)] w-[280px] shrink-0 rounded-[28px] border border-[rgba(221,235,226,0.9)] bg-[rgba(255,255,255,0.92)] p-6 backdrop-blur-[18px] lg:sticky lg:top-4 lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-3">
        <img src={liliLogo} alt="Lili Vet Hospital" className="h-16 w-auto" />
      </div>

      <div className="relative mb-8 min-h-[190px] overflow-hidden rounded-[24px] bg-[linear-gradient(145deg,#087C48_0%,#06452F_100%)] p-6 text-white">
        <img
          src={careOperationsHeartline}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-3 right-0 w-28 opacity-20"
        />
        <p className="relative text-[11px] font-black uppercase tracking-[0.18em] text-white/75">Care operations</p>
        <h3 className="relative mt-4 text-[21px] font-extrabold leading-snug">Calm control over every request.</h3>
        <p className="relative mt-3 text-sm font-semibold leading-[1.6] text-white/86">
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
          className="mx-auto w-[205px]"
        />
        <div className="rounded-[22px] border border-[#DDEBE2] bg-white/95 p-6 text-sm leading-6 text-[#5F756C]">
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
