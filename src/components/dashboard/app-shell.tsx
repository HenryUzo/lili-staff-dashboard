import { Outlet } from "react-router-dom";
import { NotificationProvider } from "@/notifications/notification-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export function AppShell() {
  return (
    <NotificationProvider>
      <div className="min-h-screen p-3 sm:p-5">
        <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1640px] gap-5">
          <Sidebar />
          <main className="flex min-w-0 flex-1 flex-col gap-5">
            <Topbar />
            <div className="flex-1 rounded-[30px] border border-white/70 bg-white/55 p-4 shadow-shell backdrop-blur-xl sm:p-6 lg:p-8">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
