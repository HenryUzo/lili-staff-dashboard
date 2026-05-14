import { AlertTriangle, Clock3, Copy, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function AppointmentPriorityBadges({
  urgent,
  duplicate,
  syncIssue,
  showRoutine = true,
  compact = false
}: {
  urgent: boolean;
  duplicate: boolean;
  syncIssue: boolean;
  showRoutine?: boolean;
  compact?: boolean;
}) {
  const sizeClass = compact ? "px-2 py-0.5 text-[11px]" : "";

  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact && "gap-1.5")}>
      {urgent ? (
        <Badge variant="danger" className={cn("gap-1.5", sizeClass)}>
          <Siren className="h-3.5 w-3.5" />
          Urgent
        </Badge>
      ) : null}
      {duplicate ? (
        <Badge variant="warning" className={cn("gap-1.5", sizeClass)}>
          <Copy className="h-3.5 w-3.5" />
          Possible duplicate
        </Badge>
      ) : null}
      {syncIssue ? (
        <Badge variant="danger" className={cn("gap-1.5 bg-destructive/10 text-destructive", sizeClass)}>
          <AlertTriangle className="h-3.5 w-3.5" />
          Sync issue
        </Badge>
      ) : null}
      {!urgent && !duplicate && !syncIssue && showRoutine ? (
        <Badge variant="default" className={cn("gap-1.5 bg-muted text-muted-foreground", sizeClass)}>
          <Clock3 className="h-3.5 w-3.5" />
          Routine
        </Badge>
      ) : null}
    </div>
  );
}
