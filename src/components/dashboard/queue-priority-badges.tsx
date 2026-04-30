import { Clock3, Copy, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function QueuePriorityBadges({
  urgent,
  duplicate,
  showRoutine = true,
  compact = false
}: {
  urgent: boolean;
  duplicate: boolean;
  showRoutine?: boolean;
  compact?: boolean;
}) {
  if (!urgent && !duplicate && !showRoutine) {
    return null;
  }

  return (
    <div className={cn("flex flex-wrap items-center gap-2", compact && "gap-1.5")}>
      {urgent ? (
        <Badge variant="danger" className={cn("gap-1.5", compact && "px-2 py-0.5 text-[11px]")}>
          <Siren className="h-3.5 w-3.5" />
          Urgent
        </Badge>
      ) : null}
      {duplicate ? (
        <Badge variant="warning" className={cn("gap-1.5", compact && "px-2 py-0.5 text-[11px]")}>
          <Copy className="h-3.5 w-3.5" />
          Possible duplicate
        </Badge>
      ) : null}
      {!urgent && !duplicate && showRoutine ? (
        <Badge
          variant="default"
          className={cn("gap-1.5 bg-muted text-muted-foreground", compact && "px-2 py-0.5 text-[11px]")}
        >
          <Clock3 className="h-3.5 w-3.5" />
          Routine
        </Badge>
      ) : null}
    </div>
  );
}
