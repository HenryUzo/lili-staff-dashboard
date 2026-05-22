import { ClipboardList, LayoutDashboard, PawPrint, ShieldCheck } from "lucide-react";
import { NavLink } from "react-router-dom";
import careOperationsHeartline from "@/assets/illustrations/care-operations-heartline.png";
import dogCatSidebarIllustration from "@/assets/illustrations/dog-cat-sidebar-illustration.png";
import liliLogo from "@/assets/illustrations/lili-veterinary-hospital-logo.svg";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/appointments", label: "Appointment Requests", icon: ClipboardList },
  { to: "/new-patients", label: "New Patient Requests", icon: PawPrint }
];

export function Sidebar() {
  return (
    <aside className="hidden h-[calc(100vh-32px)] w-[280px] shrink-0 rounded-[28px] border border-[rgba(221,235,226,0.9)] bg-[rgba(255,255,255,0.92)] p-6 backdrop-blur-[18px] lg:sticky lg:top-4 lg:flex lg:flex-col">
      <div className="mb-8 flex items-center">
        <img src={liliLogo} alt="Lili Veterinary Hospital" className="h-auto w-[205px] rounded-sm object-contain" />
      </div>

      <div className="relative mb-6 min-h-[132px] overflow-hidden rounded-[22px] bg-[linear-gradient(145deg,#087C48_0%,#06452F_100%)] p-5 text-white">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_84%_70%,rgba(126,211,166,0.22),transparent_38%)]" />
        <img
          src={careOperationsHeartline}
          alt=""
          aria-hidden="true"
          className="pointer-events-none absolute bottom-[-8px] right-[-30px] w-40 opacity-[0.14] mix-blend-screen"
        />
        <p className="relative text-[10px] font-bold uppercase tracking-[0.18em] text-white/72">Care operations</p>
        <h3 className="relative mt-3 max-w-[165px] text-[17px] font-extrabold leading-[1.2] tracking-[-0.02em]">
          Calm control for intake.
        </h3>
        <p className="relative mt-2 max-w-[160px] text-[12px] font-medium leading-[1.45] text-white/80">
          Triage urgent cases fast.
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
                "flex items-center gap-3 rounded-[14px] px-4 py-3 text-sm font-[650] transition",
                isActive
                  ? "bg-[#EAF7F0] font-[750] text-[#087C48]"
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
          <p className="font-bold tracking-[-0.01em] text-[#102E24]">Protected staff access only.</p>
          <p className="mt-1 font-medium">Actions taken here should reflect live clinic decisions.</p>
        </div>
      </div>
    </aside>
  );
}
