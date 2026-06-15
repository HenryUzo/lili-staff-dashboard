import { useState } from "react";
import { Outlet } from "react-router-dom";
import { NotificationProvider } from "@/notifications/notification-context";
import { MobileSidebar, Sidebar } from "@/components/dashboard/sidebar";
import { Topbar } from "@/components/dashboard/topbar";

export function AppShell() {
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);

  return (
    <NotificationProvider>
      <div className="dashboard-shell min-h-screen bg-transparent px-4 py-4 pb-8 text-[#102E24] sm:px-6 lg:px-6">
        <div className="mx-auto flex min-h-[calc(100vh-32px)] w-full max-w-[1484px] items-start gap-6">
          <Sidebar />
          <main className="dashboard-main flex min-w-0 flex-1 flex-col gap-6 lg:max-w-[1180px]">
            <Topbar onOpenNavigation={() => setIsMobileSidebarOpen(true)} />
            <div className="flex-1">
              <Outlet />
            </div>
          </main>
        </div>
        <MobileSidebar open={isMobileSidebarOpen} onOpenChange={setIsMobileSidebarOpen} />
      </div>
    </NotificationProvider>
  );
}
