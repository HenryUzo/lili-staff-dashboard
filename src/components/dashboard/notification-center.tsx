import { useEffect, useRef, useState } from "react";
import { Bell, CalendarPlus2, CheckCheck, PawPrint } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNotifications, formatNotificationMeta } from "@/notifications/notification-context";
import { cn } from "@/lib/utils";

export function NotificationCenter() {
  const { notifications, unreadCount, markAllRead, openNotification } = useNotifications();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    return () => document.removeEventListener("mousedown", handlePointerDown);
  }, []);

  return (
    <div ref={containerRef} className="relative z-30">
      <Button
        variant="outline"
        size="icon"
        className="relative rounded-2xl"
        onClick={() => setOpen((value) => !value)}
        aria-label="Open notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 ? (
          <span className="absolute -right-1 -top-1 inline-flex min-w-5 items-center justify-center rounded-full bg-primary px-1.5 py-0.5 text-[11px] font-semibold text-primary-foreground">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        ) : null}
      </Button>

      {open ? (
        <div className="absolute right-0 top-full z-[70] mt-3 w-[min(420px,calc(100vw-32px))] rounded-[28px] border border-white/70 bg-white/95 p-4 shadow-shell backdrop-blur-xl">
          <div className="flex items-start justify-between gap-4 border-b border-border/70 px-2 pb-4">
            <div>
              <p className="text-sm font-semibold text-foreground">Staff notifications</p>
              <p className="mt-1 text-sm text-muted-foreground">
                New appointment and intake requests appear here automatically.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="shrink-0"
              onClick={markAllRead}
              disabled={unreadCount === 0}
            >
              <CheckCheck className="h-4 w-4" />
              Mark all read
            </Button>
          </div>

          <div className="mt-4 max-h-[420px] space-y-3 overflow-y-auto pr-1">
            {notifications.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-secondary/25 px-4 py-6 text-center">
                <p className="text-sm font-medium text-foreground">No notifications yet</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  New appointment requests and patient intakes will show up here.
                </p>
              </div>
            ) : (
              notifications.map((notification) => (
                <button
                  key={notification.id}
                  type="button"
                  onClick={() => {
                    openNotification(notification);
                    setOpen(false);
                  }}
                  className={cn(
                    "w-full rounded-2xl border px-4 py-3 text-left transition hover:bg-secondary/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    notification.read
                      ? "border-border bg-white"
                      : "border-primary/20 bg-primary/5"
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 gap-3">
                      <div className="mt-0.5 rounded-full bg-secondary p-2 text-primary">
                        {notification.kind === "appointment" ? (
                          <CalendarPlus2 className="h-4 w-4" />
                        ) : (
                          <PawPrint className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-foreground">{notification.title}</p>
                        <p className="mt-1 text-sm text-muted-foreground">{notification.description}</p>
                        <p className="mt-2 text-xs font-medium text-primary/70">
                          {formatNotificationMeta(notification)}
                        </p>
                      </div>
                    </div>
                    {!notification.read ? <Badge variant="success">New</Badge> : null}
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
