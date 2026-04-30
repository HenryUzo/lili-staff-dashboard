import { Badge } from "@/components/ui/badge";
import { formatStatus } from "@/lib/format";
import type { AppointmentRequestStatus } from "@/types/api";

export function StatusBadge({ status }: { status: AppointmentRequestStatus }) {
  const variant =
    status === "CONFIRMED"
      ? "success"
      : status === "PENDING_REVIEW"
        ? "warning"
        : status === "COMPLETED"
          ? "accent"
          : "danger";

  return <Badge variant={variant}>{formatStatus(status)}</Badge>;
}
