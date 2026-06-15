import { useEffect, useState } from "react";
import { BookOpenText, ChevronDown, ClipboardList, LayoutDashboard, PawPrint, ShieldCheck } from "lucide-react";
import { NavLink, useLocation } from "react-router-dom";
import careOperationsHeartline from "@/assets/illustrations/care-operations-heartline.png";
import dogCatSidebarIllustration from "@/assets/illustrations/dog-cat-sidebar-illustration.png";
import liliLogo from "@/assets/illustrations/lili-veterinary-hospital-logo.svg";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/appointments", label: "Appointment Requests", icon: ClipboardList },
  { to: "/new-patients", label: "New Patient Requests", icon: PawPrint }
];

const brandGuideItems = [
  { label: "Brand Overview" },
  { label: "Logo Guidelines" },
  { label: "Color & Typography" },
  { to: "/brand-guide/photoshoot-guidelines", label: "Photoshoot Guidelines" }
];

export function Sidebar() {
  const location = useLocation();
  const isBrandGuideRoute = location.pathname.startsWith("/brand-guide");
  const [isBrandGuideExpanded, setIsBrandGuideExpanded] = useState(isBrandGuideRoute);

  useEffect(() => {
    if (isBrandGuideRoute) {
      setIsBrandGuideExpanded(true);
    }
  }, [isBrandGuideRoute]);

  return (
    <aside className="dashboard-sidebar hidden h-[calc(100vh-32px)] w-[280px] shrink-0 rounded-[28px] border border-[rgba(221,235,226,0.9)] bg-[rgba(255,255,255,0.92)] p-6 backdrop-blur-[18px] lg:sticky lg:top-4 lg:flex lg:flex-col">
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

        <div className="space-y-2">
          <button
            type="button"
            onClick={() => {
              if (isBrandGuideRoute) {
                return;
              }

              setIsBrandGuideExpanded((current) => !current);
            }}
            aria-expanded={isBrandGuideExpanded}
            aria-disabled={isBrandGuideRoute}
            className={cn(
              "flex w-full items-center gap-3 rounded-[14px] px-4 py-3 text-left text-sm font-[650] transition",
              isBrandGuideRoute
                ? "cursor-default bg-[#EAF7F0] font-[750] text-[#087C48]"
                : "text-[#102E24] hover:bg-[#F5FBF7] hover:text-[#087C48]"
            )}
          >
            <BookOpenText className="h-4 w-4" />
            <span className="flex-1">Brand Guide</span>
            <ChevronDown className={cn("h-4 w-4 transition", isBrandGuideExpanded ? "rotate-180" : "")} />
          </button>

          {isBrandGuideExpanded ? (
            <div className="ml-[18px] space-y-1 border-l border-[#DDEBE2] pl-4">
              {brandGuideItems.map((item) =>
                item.to ? (
                  <NavLink
                    key={item.label}
                    to={item.to}
                    className={({ isActive }) =>
                      cn(
                        "flex items-center rounded-[12px] px-4 py-2.5 text-sm font-[650] transition",
                        isActive
                          ? "bg-[#EAF7F0] font-[750] text-[#087C48]"
                          : "text-[#4F6F62] hover:bg-[#F5FBF7] hover:text-[#087C48]"
                      )
                    }
                  >
                    {item.label}
                  </NavLink>
                ) : (
                  <div
                    key={item.label}
                    aria-disabled="true"
                    className="flex items-center justify-between rounded-[12px] px-4 py-2.5 text-sm font-[650] text-[#87A89A]"
                  >
                    <span>{item.label}</span>
                    <span className="rounded-full bg-[#F5FBF7] px-2 py-1 text-[10px] font-bold uppercase tracking-[0.14em] text-[#7A9589]">
                      Soon
                    </span>
                  </div>
                )
              )}
            </div>
          ) : null}
        </div>
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
