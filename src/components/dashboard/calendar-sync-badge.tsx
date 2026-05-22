import { AlertTriangle, CheckCircle2, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CalendarSyncStatus } from "@/types/api";

export function CalendarSyncBadge({ status }: { status: CalendarSyncStatus }) {
  if (status === "SYNCED") {
    return (
      <Badge variant="success" className="gap-1.5">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Synced
      </Badge>
    );
  }

  if (status === "FAILED") {
    return (
      <Badge variant="danger" className="gap-1.5">
        <AlertTriangle className="h-3.5 w-3.5" />
        Sync failed
      </Badge>
    );
  }

  return (
    <Badge variant="default" className="gap-1.5 bg-muted text-muted-foreground">
      <RefreshCw className="h-3.5 w-3.5" />
      Not synced
    </Badge>
  );
}
