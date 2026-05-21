import { Outlet } from "react-router-dom";
import { NotificationProvider } from "@/notifications/notification-context";
import { Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export function AppShell() {
  return (
    <NotificationProvider>
      <div className="min-h-screen bg-transparent px-4 py-4 pb-6 text-[#102E24] sm:px-6 sm:pb-6">
        <div className="mx-auto flex min-h-[calc(100vh-32px)] max-w-[1440px] gap-6">
          <Sidebar />
          <main className="flex min-w-0 flex-1 flex-col gap-6">
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
