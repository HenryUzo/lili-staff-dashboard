import { ClipboardList, LayoutDashboard, PawPrint } from "lucide-react";
import { NavLink } from "react-router-dom";
import { cn } from "@/lib/utils";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard, end: true },
  { to: "/appointments", label: "Appointment Requests", icon: ClipboardList },
  { to: "/new-patients", label: "New Patient Requests", icon: PawPrint }
];

export function Sidebar() {
  return (
    <aside className="surface-glass hidden w-80 shrink-0 rounded-[30px] p-6 lg:flex lg:flex-col">
      <div className="mb-8 flex items-center gap-4">
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-xl font-bold text-primary-foreground">
          LV
        </div>
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.24em] text-primary/70">Internal staff</p>
          <h2 className="font-serif text-2xl font-semibold text-foreground">Lilivet</h2>
        </div>
      </div>

      <div className="mb-8 rounded-3xl bg-gradient-to-br from-primary to-[#204c3a] p-5 text-primary-foreground">
        <p className="text-xs uppercase tracking-[0.24em] text-primary-foreground/70">Care operations</p>
        <h3 className="mt-3 text-xl font-semibold">Calm control over every request.</h3>
        <p className="mt-2 text-sm leading-6 text-primary-foreground/80">
          Review urgent cases, triage new patients, and keep staff workflows clear.
        </p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.end}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-medium transition",
                isActive ? "bg-primary text-primary-foreground shadow-soft" : "text-muted-foreground hover:bg-white"
              )
            }
          >
            <item.icon className="h-4 w-4" />
            {item.label}
          </NavLink>
        ))}
      </nav>

      <div className="mt-auto rounded-3xl border border-border/70 bg-white/80 p-5 text-sm text-muted-foreground">
        Protected staff access only. Actions taken here should reflect live clinic decisions.
      </div>
    </aside>
  );
}
