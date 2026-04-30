import { Copy, Siren } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export function DuplicateBadge({ duplicate, urgent = false }: { duplicate: boolean; urgent?: boolean }) {
  if (urgent) {
    return (
      <Badge variant="danger" className="gap-1">
        <Siren className="h-3.5 w-3.5" />
        Urgent
      </Badge>
    );
  }

  return duplicate ? (
    <Badge variant="warning" className="gap-1">
      <Copy className="h-3.5 w-3.5" />
      Possible duplicate
    </Badge>
  ) : (
    <Badge variant="success">Clear</Badge>
  );
}
