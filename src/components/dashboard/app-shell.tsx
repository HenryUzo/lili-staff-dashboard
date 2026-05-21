import { Outlet } from "react-router-dom";
import { NotificationProvider } from "@/notifications/notification-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export function AppShell() {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-[#F5FBF7] p-3 text-[#102E24] sm:p-4">
        <div className="mx-auto flex min-h-[calc(100vh-24px)] max-w-[1680px] gap-4 lg:gap-5">
          <Sidebar />
          <main className="flex min-w-0 flex-1 flex-col gap-4 lg:gap-5">
            <Topbar />
            <div className="flex-1">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </NotificationProvider>
  );
}
