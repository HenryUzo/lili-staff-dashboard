import { useEffect, useMemo, useState } from "react";
import type { ComponentType, ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarClock,
  Check,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Copy,
  ExternalLink,
  FileText,
  Globe2,
  Mail,
  PawPrint,
  Phone,
  Plus,
  RefreshCw,
  User,
  X
} from "lucide-react";
import { toast } from "sonner";
import {
  getAppointmentRequest,
  retryAppointmentCalendarSync,
  sendAppointmentRescheduleLink,
  updateAppointmentStatus
} from "@/api/appointments";
import { getErrorMessage } from "@/api/http";
import { ErrorState } from "@/components/dashboard/error-state";
import { FilePreviewList } from "@/components/dashboard/file-preview-list";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  hasAnyFuturePreferredSelection,
  hasPastConfirmedStart,
  hasStalePendingReviewRequest,
  isPastPreferredSelection
} from "@/lib/appointment-state";
import { APPOINTMENT_STATUS_OPTIONS } from "@/lib/constants";
import {
  formatCalendarSyncStatus,
  formatDateOnly,
  formatDateTime,
  formatSpecies,
  formatStatus,
  formatVisitType,
  toDateTimeLocalValue
} from "@/lib/format";
import { cn } from "@/lib/utils";
import type {
  AppointmentPreferredSelection,
  AppointmentRequestStatus,
  CalendarSyncStatus
} from "@/types/api";

const DEFAULT_APPOINTMENT_MINUTES = 60;

const reviewTabs = [
  { id: "overview", label: "Overview" },
  { id: "contact", label: "Contact" },
  { id: "pet", label: "Pet" },
  { id: "medical", label: "Medical" },
  { id: "files", label: "Files" },
  { id: "audit", label: "Audit" }
] as const;

type ReviewTab = (typeof reviewTabs)[number]["id"];

function parseDateTimeInputParts(value: string) {
  const match = value.match(
    /^(?<year>\d{4})-(?<month>\d{2})-(?<day>\d{2})T(?<hour>\d{2}):(?<minute>\d{2})$/
  );

  if (!match?.groups) {
    return null;
  }

  return {
    year: Number(match.groups.year),
    month: Number(match.groups.month),
    day: Number(match.groups.day),
    hour: Number(match.groups.hour),
    minute: Number(match.groups.minute)
  };
}

function formatUtcDateToLocalInput(date: Date) {
  const year = date.getUTCFullYear();
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const day = String(date.getUTCDate()).padStart(2, "0");
  const hour = String(date.getUTCHours()).padStart(2, "0");
  const minute = String(date.getUTCMinutes()).padStart(2, "0");

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

function addMinutesToInputValue(value: string, minutes = DEFAULT_APPOINTMENT_MINUTES) {
  const parts = parseDateTimeInputParts(value);

  if (!parts) {
    return "";
  }

  const date = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute + minutes)
  );
  return formatUtcDateToLocalInput(date);
}

function defaultResponseDeadlineInput() {
  return toDateTimeLocalValue(new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString());
}

function getTimeZoneOffsetMs(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hour12: false,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit"
  });
  const parts = Object.fromEntries(
    formatter
      .formatToParts(date)
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, part.value])
  );
  const asUtcTime = Date.UTC(
    Number(parts.year),
    Number(parts.month) - 1,
    Number(parts.day),
    Number(parts.hour),
    Number(parts.minute),
    Number(parts.second)
  );

  return asUtcTime - date.getTime();
}

function toUtcIsoFromTimeZone(value: string, timeZone: string) {
  const parts = parseDateTimeInputParts(value);

  if (!parts) {
    return null;
  }

  const utcGuess = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute, 0, 0)
  );
  let offset = getTimeZoneOffsetMs(utcGuess, timeZone);
  let zonedDate = new Date(utcGuess.getTime() - offset);
  const correctedOffset = getTimeZoneOffsetMs(zonedDate, timeZone);

  if (correctedOffset !== offset) {
    offset = correctedOffset;
    zonedDate = new Date(utcGuess.getTime() - offset);
  }

  return zonedDate.toISOString();
}

function toComparableInputTime(value: string) {
  const parts = parseDateTimeInputParts(value);

  if (!parts) {
    return null;
  }

  return Date.UTC(parts.year, parts.month - 1, parts.day, parts.hour, parts.minute);
}

function normalizeSelectionDateKey(value: string) {
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }

  const parsed = new Date(value);

  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  return parsed.toISOString().slice(0, 10);
}

function createQuickSelectionValue(date: string, timeSlot: string) {
  const normalizedTime = timeSlot.trim();
  const normalizedDate = normalizeSelectionDateKey(date);

  if (!normalizedDate || !/^\d{1,2}:\d{2}$/.test(normalizedTime)) {
    return null;
  }

  const [hours, minutes] = normalizedTime.split(":");
  return `${normalizedDate}T${hours.padStart(2, "0")}:${minutes}`;
}

function flattenPreferredSelections(preferredSelections: AppointmentPreferredSelection[]) {
  return preferredSelections.flatMap((selection) =>
    selection.timeSlots.map((timeSlot) => ({
      date: selection.date,
      timeSlot,
      startValue: createQuickSelectionValue(selection.date, timeSlot)
    }))
  );
}

function formatInputDate(value: string) {
  const parts = parseDateTimeInputParts(value);

  if (!parts) {
    return "Not selected";
  }

  return formatDateOnly(
    `${parts.year}-${String(parts.month).padStart(2, "0")}-${String(parts.day).padStart(2, "0")}`,
    value
  );
}

function formatInputTime(value: string) {
  const parts = parseDateTimeInputParts(value);

  if (!parts) {
    return "Not selected";
  }

  return `${String(parts.hour).padStart(2, "0")}:${String(parts.minute).padStart(2, "0")}`;
}

function DetailField({
  label,
  value,
  mono = false
}: {
  label: string;
  value?: string | number | null;
  mono?: boolean;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#87A89A]">{label}</p>
      <p className={cn("text-sm leading-6 text-[#102E24]", mono && "font-mono text-xs")}>
        {value || "Not provided"}
      </p>
    </div>
  );
}

function DrawerChip({
  children,
  icon: Icon,
  tone = "neutral"
}: {
  children: ReactNode;
  icon?: ComponentType<{ className?: string }>;
  tone?: "green" | "neutral" | "warning" | "danger";
}) {
  const tones = {
    green: "bg-[#DFF1E7] text-[#087C48]",
    neutral: "bg-[#EEF3F0] text-[#587267]",
    warning: "bg-[#FFF2D8] text-[#A46600]",
    danger: "bg-[#FDE4E0] text-[#C75146]"
  };

  return (
    <span
      className={cn(
        "inline-flex h-7 items-center gap-1.5 rounded-full px-3 text-[13px] font-semibold",
        tones[tone]
      )}
    >
      {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
      {children}
    </span>
  );
}

function StatusChip({ status }: { status: AppointmentRequestStatus }) {
  if (status === "CONFIRMED" || status === "COMPLETED") {
    return (
      <DrawerChip icon={CheckCircle2} tone="green">
        {formatStatus(status)}
      </DrawerChip>
    );
  }

  if (status === "OVERDUE" || status === "CANCELLED" || status === "NO_SHOW") {
    return (
      <DrawerChip icon={AlertTriangle} tone="danger">
        {formatStatus(status)}
      </DrawerChip>
    );
  }

  return (
    <DrawerChip icon={Clock3} tone="warning">
      {formatStatus(status)}
    </DrawerChip>
  );
}

function SyncChip({ status }: { status: CalendarSyncStatus }) {
  if (status === "SYNCED") {
    return (
      <DrawerChip icon={CheckCircle2} tone="green">
        Synced
      </DrawerChip>
    );
  }

  if (status === "FAILED") {
    return (
      <DrawerChip icon={AlertTriangle} tone="danger">
        Sync failed
      </DrawerChip>
    );
  }

  return (
    <DrawerChip icon={RefreshCw} tone="neutral">
      Not synced
    </DrawerChip>
  );
}

function SummaryItem({
  icon: Icon,
  label,
  value
}: {
  icon: ComponentType<{ className?: string }>;
  label: string;
  value?: string | null;
}) {
  return (
    <div className="flex min-w-0 items-center gap-3 px-0 lg:border-r lg:border-[#DDEBE2] lg:px-4 last:lg:border-r-0">
      <Icon className="h-5 w-5 shrink-0 text-[#2D6B52]" />
      <div className="min-w-0">
        <p className="text-xs font-medium text-[#587267]">{label}</p>
        <p className="truncate text-sm font-bold text-[#102E24]">{value || "Not provided"}</p>
      </div>
    </div>
  );
}

function TabButton({
  active,
  children,
  onClick
}: {
  active: boolean;
  children: ReactNode;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "min-w-max border-b-2 px-3 pb-4 pt-1 text-sm font-bold transition",
        active
          ? "border-[#087C48] text-[#087C48]"
          : "border-transparent text-[#587267] hover:border-[#DDEBE2] hover:text-[#102E24]"
      )}
    >
      {children}
    </button>
  );
}

function CopyableId({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#87A89A]">{label}</p>
      {value ? (
        <div className="flex items-center gap-2 rounded-xl border border-[#DDEBE2] bg-[#FAFCFA] px-3 py-2">
          <code className="min-w-0 flex-1 truncate text-xs text-[#587267]">{value}</code>
          <button
            type="button"
            className="rounded-lg p-1.5 text-[#2D6B52] transition hover:bg-[#DFF1E7]"
            aria-label={`Copy ${label}`}
            onClick={() => {
              void navigator.clipboard
                .writeText(value)
                .then(() => toast.success("Copied"))
                .catch(() => toast.error("Unable to copy"));
            }}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        </div>
      ) : (
        <p className="text-sm text-[#587267]">Not provided</p>
      )}
    </div>
  );
}

export function AppointmentDetailDrawer({
  appointmentId,
  open,
  onClose,
  onNavigatePrevious,
  onNavigateNext,
  onOpenReplacement,
  canNavigatePrevious,
  canNavigateNext
}: {
  appointmentId: string | null;
  open: boolean;
  onClose: () => void;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  onOpenReplacement?: (appointmentId: string) => void;
  canNavigatePrevious?: boolean;
  canNavigateNext?: boolean;
}) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ReviewTab>("overview");
  const [nextStatus, setNextStatus] = useState<AppointmentRequestStatus | "">("");
  const [confirmedStartInput, setConfirmedStartInput] = useState("");
  const [confirmedEndInput, setConfirmedEndInput] = useState("");
  const [confirmedTimezone, setConfirmedTimezone] = useState("");
  const [responseDeadlineInput, setResponseDeadlineInput] = useState("");
  const [manualOverrideEnabled, setManualOverrideEnabled] = useState(false);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  const detailQuery = useQuery({
    queryKey: ["appointment-request", appointmentId],
    queryFn: () => getAppointmentRequest(appointmentId!),
    enabled: Boolean(appointmentId)
  });

  const request = detailQuery.data;

  const updateStatusMutation = useMutation({
    mutationFn: ({
      id,
      status,
      confirmedStartAt,
      confirmedEndAt,
      confirmedTimezone: timezone
    }: {
      id: string;
      status: AppointmentRequestStatus;
      confirmedStartAt?: string;
      confirmedEndAt?: string;
      confirmedTimezone?: string;
    }) =>
      updateAppointmentStatus(id, {
        status,
        confirmedStartAt,
        confirmedEndAt,
        confirmedTimezone: timezone
      }),
    onSuccess: async (updated) => {
      setActionError(null);
      setNextStatus("");
      setConfirmedStartInput(toDateTimeLocalValue(updated.confirmedStartAt));
      setConfirmedEndInput(toDateTimeLocalValue(updated.confirmedEndAt));
      setConfirmedTimezone(updated.confirmedTimezone ?? updated.timezone ?? "");
      setManualOverrideEnabled(false);
      setActionMessage(
        updated.status === "CONFIRMED"
          ? updated.calendarSyncStatus === "SYNCED"
            ? "Appointment confirmed and synced to calendar."
            : "Appointment confirmed. Calendar sync still needs attention."
          : "Appointment updated successfully."
      );
      queryClient.setQueryData(["appointment-request", appointmentId], updated);
      toast.success("Appointment status updated");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointment-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["appointment-request", appointmentId] }),
        queryClient.invalidateQueries({ queryKey: ["overview"] })
      ]);
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Unable to update appointment status");
      setActionMessage(null);
      setActionError(message);
      toast.error(message);
    }
  });

  const retryCalendarSyncMutation = useMutation({
    mutationFn: (id: string) => retryAppointmentCalendarSync(id),
    onSuccess: async (updated) => {
      setActionError(null);
      setActionMessage(
        updated.calendarSyncStatus === "SYNCED"
          ? "Calendar sync completed successfully."
          : "Calendar sync retried, but further attention is still needed."
      );
      queryClient.setQueryData(["appointment-request", appointmentId], updated);
      toast.success("Calendar sync retried");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointment-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["appointment-request", appointmentId] }),
        queryClient.invalidateQueries({ queryKey: ["overview"] })
      ]);
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Unable to retry calendar sync");
      setActionMessage(null);
      setActionError(message);
      toast.error(message);
    }
  });

  const sendRescheduleLinkMutation = useMutation({
    mutationFn: ({
      id,
      responseDeadline
    }: {
      id: string;
      responseDeadline: string;
    }) => sendAppointmentRescheduleLink(id, responseDeadline),
    onSuccess: async (updated) => {
      setActionError(null);
      setActionMessage("Reschedule email sent to the applicant.");
      queryClient.setQueryData(["appointment-request", appointmentId], updated);
      toast.success("Reschedule email sent");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointment-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["appointment-request", appointmentId] }),
        queryClient.invalidateQueries({ queryKey: ["overview"] })
      ]);
    },
    onError: (error) => {
      const message = getErrorMessage(error, "Unable to send reschedule email");
      setActionMessage(null);
      setActionError(message);
      toast.error(message);
    }
  });

  useEffect(() => {
    if (!request) {
      setNextStatus("");
      setConfirmedStartInput("");
      setConfirmedEndInput("");
      setConfirmedTimezone("");
      setResponseDeadlineInput(defaultResponseDeadlineInput());
      setManualOverrideEnabled(false);
      setActionMessage(null);
      setActionError(null);
      setActiveTab("overview");
      return;
    }

    setNextStatus("");
    setConfirmedStartInput(toDateTimeLocalValue(request.confirmedStartAt));
    setConfirmedEndInput(toDateTimeLocalValue(request.confirmedEndAt));
    setConfirmedTimezone(request.confirmedTimezone ?? request.timezone ?? "");
    setResponseDeadlineInput(
      request.rescheduleResponseDeadline
        ? toDateTimeLocalValue(request.rescheduleResponseDeadline)
        : defaultResponseDeadlineInput()
    );
    setManualOverrideEnabled(false);
    setActionMessage(null);
    setActionError(null);
    setActiveTab("overview");
  }, [request]);

  const selectedStatus = useMemo(
    () => nextStatus || request?.status || "",
    [nextStatus, request?.status]
  );
  const statusOptions = useMemo(
    () =>
      request?.status === "OVERDUE"
        ? (["OVERDUE", ...APPOINTMENT_STATUS_OPTIONS] as AppointmentRequestStatus[])
        : APPOINTMENT_STATUS_OPTIONS,
    [request?.status]
  );
  const requiresConfirmedSlot = selectedStatus === "CONFIRMED";
  const confirmedStartComparable = confirmedStartInput ? toComparableInputTime(confirmedStartInput) : null;
  const confirmedEndComparable = confirmedEndInput ? toComparableInputTime(confirmedEndInput) : null;
  const confirmedStartIso =
    confirmedStartInput && confirmedTimezone.trim()
      ? toUtcIsoFromTimeZone(confirmedStartInput, confirmedTimezone.trim())
      : null;
  const confirmedEndIso =
    confirmedEndInput && confirmedTimezone.trim()
      ? toUtcIsoFromTimeZone(confirmedEndInput, confirmedTimezone.trim())
      : null;
  const confirmedStartInPast = hasPastConfirmedStart(confirmedStartIso);
  const confirmedSlotIsValid =
    !requiresConfirmedSlot ||
    (confirmedStartComparable !== null &&
      confirmedEndComparable !== null &&
      confirmedEndComparable > confirmedStartComparable &&
      Boolean(confirmedStartIso) &&
      Boolean(confirmedEndIso) &&
      Boolean(confirmedTimezone.trim()) &&
      !confirmedStartInPast);
  const quickSelections = useMemo(
    () => flattenPreferredSelections(request?.preferredSelections ?? []),
    [request?.preferredSelections]
  );
  const availableQuickSelections = useMemo(
    () =>
      quickSelections.filter((selection) =>
        !isPastPreferredSelection(
          selection.date,
          selection.timeSlot,
          request?.timezone || confirmedTimezone || "Africa/Lagos"
        )
      ),
    [confirmedTimezone, quickSelections, request?.timezone]
  );
  const selectedQuickSelection = useMemo(
    () => availableQuickSelections.find((selection) => selection.startValue === confirmedStartInput) ?? null,
    [availableQuickSelections, confirmedStartInput]
  );
  const hasRequestedSelections = quickSelections.length > 0;
  const hasFutureRequestedSelections = request
    ? hasAnyFuturePreferredSelection({
        preferredSelections: request.preferredSelections,
        timezone: request.timezone
      })
    : false;
  const staleConfirmationBlocked =
    request?.status === "PENDING_REVIEW" &&
    selectedStatus === "CONFIRMED" &&
    hasRequestedSelections &&
    !hasFutureRequestedSelections;
  const statusChanged = Boolean(nextStatus && request && nextStatus !== request.status);
  const confirmedSlotChanged =
    Boolean(request) &&
    selectedStatus === "CONFIRMED" &&
    (confirmedStartInput !== toDateTimeLocalValue(request?.confirmedStartAt) ||
      confirmedEndInput !== toDateTimeLocalValue(request?.confirmedEndAt) ||
      confirmedTimezone.trim() !== (request?.confirmedTimezone ?? request?.timezone ?? ""));
  const canSave =
    Boolean(request) &&
    confirmedSlotIsValid &&
    !staleConfirmationBlocked &&
    (statusChanged || confirmedSlotChanged) &&
    !updateStatusMutation.isPending;
  const responseDeadlineIsValid =
    Boolean(responseDeadlineInput) && !Number.isNaN(new Date(responseDeadlineInput).getTime());
  const responseDeadlineIso = responseDeadlineIsValid
    ? new Date(responseDeadlineInput).toISOString()
    : "";
  const rescheduleState = request?.replacementAppointmentRequestId
    ? "completed"
    : request?.rescheduleEmailSentAt
      ? request.rescheduleResponseDeadline && new Date(request.rescheduleResponseDeadline) <= new Date()
        ? "expired"
        : "sent"
      : "not-sent";
  const canSendReschedule =
    request?.status === "OVERDUE" &&
    !request.replacementAppointmentRequestId &&
    responseDeadlineIsValid &&
    new Date(responseDeadlineInput).getTime() > Date.now() &&
    !sendRescheduleLinkMutation.isPending;
  const isUrgent = request?.visitType === "URGENT_CARE";
  const isStalePendingReview = request ? hasStalePendingReviewRequest(request) : false;
  const hasSyncIssue = request?.calendarSyncStatus === "FAILED";
  const syncReadyAfterConfirm =
    selectedStatus === "CONFIRMED" &&
    confirmedSlotIsValid &&
    !staleConfirmationBlocked &&
    request?.calendarSyncStatus !== "SYNCED";
  const isRetryPrimary = Boolean(request && hasSyncIssue && !canSave);
  const primaryActionDisabled = isRetryPrimary
    ? retryCalendarSyncMutation.isPending
    : !canSave;
  const primaryActionLabel = updateStatusMutation.isPending
    ? "Saving..."
    : retryCalendarSyncMutation.isPending
      ? "Retrying..."
      : isRetryPrimary
        ? "Retry sync"
        : request?.status === "CONFIRMED" && !statusChanged && !confirmedSlotChanged
          ? "Saved"
          : statusChanged || confirmedSlotChanged
            ? "Save changes"
            : "Confirm appointment";
  const ownerName = request ? `${request.owner.firstName} ${request.owner.lastName}` : "";
  const confirmedSlotSummary = confirmedStartInput
    ? `${formatInputDate(confirmedStartInput)} at ${formatInputTime(confirmedStartInput)}`
    : "No confirmed slot selected";

  function applyQuickSelection(date: string, timeSlot: string) {
    if (isPastPreferredSelection(date, timeSlot, request?.timezone || confirmedTimezone || "Africa/Lagos")) {
      return;
    }

    const startValue = createQuickSelectionValue(date, timeSlot);

    if (!startValue) {
      return;
    }

    setConfirmedStartInput(startValue);
    setConfirmedEndInput(addMinutesToInputValue(startValue));
    setConfirmedTimezone((currentValue) => currentValue || request?.timezone || "Africa/Lagos");
    setManualOverrideEnabled(false);
    setNextStatus("CONFIRMED");
  }

  function saveAppointmentStatus() {
    if (!request || !canSave) {
      return;
    }

    updateStatusMutation.mutate({
      id: request.id,
      status: selectedStatus as AppointmentRequestStatus,
      confirmedStartAt:
        selectedStatus === "CONFIRMED" && confirmedStartIso ? confirmedStartIso : undefined,
      confirmedEndAt: selectedStatus === "CONFIRMED" && confirmedEndIso ? confirmedEndIso : undefined,
      confirmedTimezone: selectedStatus === "CONFIRMED" ? confirmedTimezone.trim() : undefined
    });
  }

  function handlePrimaryAction() {
    if (!request) {
      return;
    }

    if (isRetryPrimary) {
      retryCalendarSyncMutation.mutate(request.id);
      return;
    }

    saveAppointmentStatus();
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="inset-y-4 right-4 w-[min(960px,calc(100vw-48px))] rounded-[24px] border border-white/80 shadow-[0_28px_90px_rgba(16,46,36,0.22)] max-[900px]:inset-0 max-[900px]:h-screen max-[900px]:w-screen max-[900px]:rounded-none"
      >
        {detailQuery.isLoading ? (
          <>
            <div className="sr-only">
              <DialogTitle>Loading appointment request</DialogTitle>
              <DialogDescription>Loading the selected appointment request details.</DialogDescription>
            </div>
            <div className="space-y-5 p-8">
              <Skeleton className="h-14 w-2/3" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-96 w-full" />
            </div>
          </>
        ) : detailQuery.isError ? (
          <>
            <div className="sr-only">
              <DialogTitle>Appointment request unavailable</DialogTitle>
              <DialogDescription>The selected appointment request could not be loaded.</DialogDescription>
            </div>
            <div className="p-8">
              <ErrorState
                title="Could not load appointment detail"
                description={getErrorMessage(detailQuery.error)}
                onRetry={() => detailQuery.refetch()}
              />
            </div>
          </>
        ) : request ? (
          <div className="flex min-h-0 flex-1 flex-col bg-white">
            <div className="sticky top-0 z-30 border-b border-[#E6EEE8] bg-white px-8 pb-5 pt-7 max-sm:px-5">
              <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
                <div className="flex min-w-0 gap-4">
                  <div className="mt-1 flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#E7F4EC] text-[#087C48]">
                    <CalendarCheck2 className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 space-y-3">
                    <div className="space-y-1">
                      <DialogTitle className="truncate text-[30px] font-bold leading-tight text-[#102E24]">
                        {request.pet.name}
                      </DialogTitle>
                      <DialogDescription className="flex flex-wrap items-center gap-2 text-sm font-medium text-[#587267]">
                        <span>{formatVisitType(request.visitType)}</span>
                        <span className="h-1.5 w-1.5 rounded-full bg-[#87A89A]" aria-hidden="true" />
                        <span className="inline-flex items-center gap-1.5">
                          <CalendarClock className="h-4 w-4" />
                          Submitted {formatDateTime(request.createdAt)}
                        </span>
                      </DialogDescription>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <StatusChip status={request.status} />
                      <SyncChip status={request.calendarSyncStatus} />
                      {isUrgent ? (
                        <DrawerChip icon={AlertTriangle} tone="danger">
                          Urgent
                        </DrawerChip>
                      ) : isStalePendingReview ? (
                        <DrawerChip icon={Clock3} tone="warning">
                          Stale request
                        </DrawerChip>
                      ) : (
                        <DrawerChip icon={Clock3} tone="neutral">
                          Routine
                        </DrawerChip>
                      )}
                      {request.possibleDuplicate ? (
                        <DrawerChip icon={AlertTriangle} tone="warning">
                          Possible duplicate
                        </DrawerChip>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="flex shrink-0 items-center gap-2">
                  <Button variant="outline" size="sm" disabled={!canNavigatePrevious} onClick={onNavigatePrevious}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={!canNavigateNext} onClick={onNavigateNext}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <button
                    type="button"
                    aria-label="Close appointment review"
                    onClick={onClose}
                    className="rounded-full p-2 text-[#587267] transition hover:bg-[#EEF3F0] hover:text-[#102E24]"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-8 py-6 max-sm:px-5">
              <div className="rounded-[18px] border border-[#E1EDE6] bg-[#FAFCFA] p-5">
                <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-5 lg:gap-0">
                  <SummaryItem icon={User} label="Owner" value={ownerName} />
                  <SummaryItem icon={Phone} label="Phone" value={request.owner.phoneNumber} />
                  <SummaryItem icon={Phone} label="Preferred" value={request.owner.preferredContactMethod} />
                  <SummaryItem icon={Globe2} label="Timezone" value={request.timezone} />
                  <SummaryItem icon={PawPrint} label="Pet" value={request.pet.name} />
                </div>
              </div>

              <div role="tablist" aria-label="Appointment detail sections" className="mt-7 overflow-x-auto border-b border-[#E6EEE8]">
                <div className="flex min-w-max gap-3">
                  {reviewTabs.map((tab) => (
                    <TabButton
                      key={tab.id}
                      active={activeTab === tab.id}
                      onClick={() => setActiveTab(tab.id)}
                    >
                      {tab.label}
                    </TabButton>
                  ))}
                </div>
              </div>

              <div className="py-5">
                {activeTab === "overview" ? (
                  <div className="rounded-[20px] border border-[#DDEBE2] bg-white p-6">
                    <div className="grid gap-7 lg:grid-cols-2 lg:divide-x lg:divide-[#E6EEE8]">
                      <div className="space-y-6 lg:pr-7">
                        <div>
                          <h3 className="text-xl font-bold text-[#102E24]">Review & confirm</h3>
                          <p className="mt-1 max-w-sm text-sm leading-6 text-[#587267]">
                            Review the details below and confirm the appointment.
                          </p>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#87A89A]">
                            Status
                          </p>
                          <Select
                            value={selectedStatus}
                            onChange={(event) => setNextStatus(event.target.value as AppointmentRequestStatus)}
                            className="h-12 rounded-xl border-[#DDEBE2] focus:border-[#2F7D5A] focus:ring-[#2F7D5A]"
                          >
                            {statusOptions.map((status) => (
                              <option
                                key={status}
                                value={status}
                                disabled={
                                  status === "CONFIRMED" &&
                                  request.status === "PENDING_REVIEW" &&
                                  isStalePendingReview
                                }
                              >
                                {formatStatus(status)}
                              </option>
                            ))}
                          </Select>
                        </div>

                        <div className="space-y-2">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#87A89A]">
                            Confirmed slot
                          </p>
                          <div className="rounded-2xl border border-[#DDEBE2] bg-white p-5">
                            <div className="flex items-start gap-4">
                              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF4EE] text-[#087C48]">
                                <CalendarCheck2 className="h-5 w-5" />
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="font-bold text-[#102E24]">{formatInputDate(confirmedStartInput)}</p>
                                <p className="mt-1 text-lg font-bold text-[#087C48]">
                                  {formatInputTime(confirmedStartInput)}
                                </p>
                                <p className="mt-1 text-sm text-[#587267]">
                                  {confirmedTimezone || request.timezone || "Timezone not provided"}
                                </p>
                                {confirmedStartInput ? (
                                  <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-[#DFF1E7] px-3 py-1 text-xs font-bold text-[#087C48]">
                                    Selected
                                    <Check className="h-3.5 w-3.5" />
                                  </span>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-3 border-t border-[#E6EEE8] pt-5">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#87A89A]">
                            Owner summary
                          </p>
                          <div className="space-y-2 text-sm text-[#587267]">
                            <p className="flex items-center gap-2">
                              <User className="h-4 w-4 text-[#2D6B52]" />
                              {ownerName}
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-[#2D6B52]" />
                              {request.owner.phoneNumber || "Not provided"}
                            </p>
                            <p className="flex items-center gap-2">
                              <Mail className="h-4 w-4 text-[#2D6B52]" />
                              {request.owner.email || "Not provided"}
                            </p>
                            <p className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-[#2D6B52]" />
                              Preferred: {request.owner.preferredContactMethod || "Not provided"}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="space-y-6 lg:pl-7">
                        <div>
                          <h3 className="text-xl font-bold text-[#102E24]">Requested availability</h3>
                          <p className="mt-1 max-w-sm text-sm leading-6 text-[#587267]">
                            Select one of the requested times below or use manual override.
                          </p>
                        </div>

                        <div className="space-y-4">
                          {availableQuickSelections.length > 0 ? (
                            availableQuickSelections.map((selection) => {
                              const isSelected = selection.startValue === confirmedStartInput;

                              return (
                                <button
                                  key={`${selection.date}-${selection.timeSlot}`}
                                  type="button"
                                  onClick={() => applyQuickSelection(selection.date, selection.timeSlot)}
                                  className={cn(
                                    "flex min-h-[92px] w-full items-center gap-4 rounded-2xl border bg-white p-5 text-left transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#087C48] focus-visible:ring-offset-2",
                                    isSelected
                                      ? "border-[#087C48] bg-[#F4FBF7]"
                                      : "border-[#DDEBE2] hover:border-[#87A89A] hover:bg-[#FAFCFA]"
                                  )}
                                >
                                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-[#EAF4EE] text-[#087C48]">
                                    <CalendarCheck2 className="h-5 w-5" />
                                  </span>
                                  <span className="min-w-0 flex-1">
                                    <span className="block font-bold text-[#102E24]">
                                      {formatDateOnly(selection.date, selection.date)}
                                    </span>
                                    <span className="mt-1 block text-lg font-bold text-[#102E24]">
                                      {selection.timeSlot}
                                    </span>
                                  </span>
                                  <span
                                    className={cn(
                                      "inline-flex shrink-0 items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold",
                                      isSelected
                                        ? "bg-[#087C48] text-white"
                                        : "bg-[#EEF3F0] text-[#587267]"
                                    )}
                                  >
                                    {isSelected ? "Selected" : "Requested"}
                                  </span>
                                  {isSelected ? (
                                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#087C48] text-white">
                                      <Check className="h-5 w-5" />
                                    </span>
                                  ) : null}
                                </button>
                              );
                            })
                          ) : (
                            <div className="rounded-2xl border border-dashed border-[#DDEBE2] bg-[#FAFCFA] p-5 text-sm leading-6 text-[#587267]">
                              {hasRequestedSelections
                                ? "All requested times have passed. This request needs outreach instead of confirmation."
                                : "No preferred date selections were captured. Use manual override if the appointment should be confirmed."}
                            </div>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setManualOverrideEnabled((current) => !current)}
                          className="flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-[#BFD6C8] bg-white px-4 py-3 text-sm font-bold text-[#087C48] transition hover:bg-[#F4FBF7]"
                        >
                          <Plus className="h-4 w-4" />
                          Need another time? Use manual override
                        </button>

                        {manualOverrideEnabled ? (
                          <div className="space-y-4">
                            {hasFutureRequestedSelections ? (
                              <Alert className="border-[#F4C16E] bg-[#FFF7E8] text-[#A46600]">
                                You are overriding the applicant's preferred times. Confirm manually only if no requested slot works.
                              </Alert>
                            ) : null}

                            <div className="grid gap-4 md:grid-cols-2">
                              <div className="space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#87A89A]">
                                  Confirmed start
                                </p>
                                <Input
                                  type="datetime-local"
                                  value={confirmedStartInput}
                                  onChange={(event) => {
                                    const nextValue = event.target.value;
                                    setConfirmedStartInput(nextValue);

                                    if (!confirmedEndInput || new Date(confirmedEndInput) <= new Date(nextValue)) {
                                      setConfirmedEndInput(addMinutesToInputValue(nextValue));
                                    }
                                  }}
                                />
                              </div>
                              <div className="space-y-2">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#87A89A]">
                                  Confirmed end
                                </p>
                                <Input
                                  type="datetime-local"
                                  value={confirmedEndInput}
                                  onChange={(event) => setConfirmedEndInput(event.target.value)}
                                />
                              </div>
                              <div className="space-y-2 md:col-span-2">
                                <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#87A89A]">
                                  Timezone
                                </p>
                                <Input
                                  value={confirmedTimezone}
                                  onChange={(event) => setConfirmedTimezone(event.target.value)}
                                  placeholder="Africa/Lagos"
                                />
                              </div>
                            </div>
                          </div>
                        ) : null}

                        {selectedStatus === "CONFIRMED" && !selectedQuickSelection && !manualOverrideEnabled && hasFutureRequestedSelections ? (
                          <Alert className="border-[#F4C16E] bg-[#FFF7E8] text-[#A46600]">
                            Select one requested time before confirming, or open manual override.
                          </Alert>
                        ) : null}

                        {staleConfirmationBlocked ? (
                          <Alert className="border-destructive/30 bg-destructive/10 text-destructive">
                            This request can no longer be confirmed because all requested times have passed.
                          </Alert>
                        ) : null}

                        {selectedStatus === "CONFIRMED" && !confirmedSlotIsValid ? (
                          <Alert className="border-destructive/30 bg-destructive/10 text-destructive">
                            {confirmedStartInPast
                              ? "Confirmed appointment time must be in the future."
                              : "Add a valid start time, end time, and timezone before confirming."}
                          </Alert>
                        ) : null}
                      </div>
                    </div>

                    {request.status === "OVERDUE" ? (
                      <div className="mt-7 space-y-4 border-t border-[#E6EEE8] pt-6">
                        <div className="space-y-1">
                          <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-destructive/80">
                            Reschedule outreach
                          </p>
                          <p className="text-sm text-[#587267]">
                            Send the applicant a secure email link to choose new preferred dates.
                          </p>
                        </div>

                        <div className="grid gap-4 md:grid-cols-[1fr_auto] md:items-end">
                          <div className="space-y-2">
                            <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#87A89A]">
                              Response deadline
                            </p>
                            <Input
                              type="datetime-local"
                              value={responseDeadlineInput}
                              onChange={(event) => setResponseDeadlineInput(event.target.value)}
                            />
                          </div>
                          <Button
                            type="button"
                            variant="outline"
                            disabled={!canSendReschedule}
                            onClick={() =>
                              sendRescheduleLinkMutation.mutate({
                                id: request.id,
                                responseDeadline: responseDeadlineIso
                              })
                            }
                          >
                            <Mail className="h-4 w-4" />
                            {sendRescheduleLinkMutation.isPending ? "Sending..." : "Send reschedule email"}
                          </Button>
                        </div>

                        <div className="rounded-2xl border border-[#DDEBE2] bg-[#FAFCFA] p-4 text-sm text-[#587267]">
                          <p>
                            State:{" "}
                            <span className="font-bold text-[#102E24]">
                              {rescheduleState === "completed"
                                ? "Completed"
                                : rescheduleState === "expired"
                                  ? "Token expired"
                                  : rescheduleState === "sent"
                                    ? "Email sent"
                                    : "Not sent"}
                            </span>
                          </p>
                          <p className="mt-2">
                            {request.rescheduleEmailSentAt
                              ? `Last email sent ${formatDateTime(request.rescheduleEmailSentAt)}`
                              : "No reschedule email has been sent yet."}
                          </p>
                          <p className="mt-2">
                            {request.rescheduleResponseDeadline
                              ? `Response deadline ${formatDateTime(request.rescheduleResponseDeadline)}`
                              : "Choose a deadline before sending the email."}
                          </p>
                        </div>

                        {request.replacementAppointmentRequestId && onOpenReplacement ? (
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => onOpenReplacement(request.replacementAppointmentRequestId!)}
                          >
                            <ExternalLink className="h-4 w-4" />
                            Open replacement request
                          </Button>
                        ) : null}

                        {!responseDeadlineIsValid ? (
                          <Alert className="border-destructive/30 bg-destructive/10 text-destructive">
                            Choose a valid future deadline before sending the reschedule email.
                          </Alert>
                        ) : null}
                      </div>
                    ) : null}

                    {isStalePendingReview ? (
                      <Alert className="mt-5 border-[#F4C16E] bg-[#FFF7E8] text-[#A46600]">
                        All applicant-requested times are now in the past. This request still needs review, but it is
                        not a confirmed overdue appointment.
                      </Alert>
                    ) : null}

                    {request.duplicateOfId ? (
                      <Alert className="mt-5 border-[#F4C16E] bg-[#FFF7E8] text-[#A46600]">
                        Possible duplicate of request {request.duplicateOfId}
                      </Alert>
                    ) : null}

                    {selectedStatus === "CANCELLED" && request.calendarEventId ? (
                      <Alert className="mt-5 border-[#F4C16E] bg-[#FFF7E8] text-[#A46600]">
                        Cancelling this appointment will also attempt to remove the calendar event.
                      </Alert>
                    ) : null}

                    {request.calendarSyncStatus === "FAILED" ? (
                      <Alert className="mt-5 border-destructive/30 bg-destructive/10 text-destructive">
                        {request.calendarSyncError?.trim() ||
                          "Calendar sync failed. Check the Google Calendar integration and try again."}
                      </Alert>
                    ) : null}

                    {actionMessage ? (
                      <Alert className="mt-5 border-success/30 bg-success/10 text-success">
                        {actionMessage}
                      </Alert>
                    ) : null}
                    {actionError ? (
                      <Alert className="mt-5 border-destructive/30 bg-destructive/10 text-destructive">
                        {actionError}
                      </Alert>
                    ) : null}
                  </div>
                ) : null}

                {activeTab === "contact" ? (
                  <div className="rounded-[20px] border border-[#DDEBE2] bg-white p-6">
                    <h3 className="text-xl font-bold text-[#102E24]">Owner contact</h3>
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <DetailField label="Owner" value={ownerName} />
                      <DetailField label="Preferred contact" value={request.owner.preferredContactMethod} />
                      <DetailField label="Phone number" value={request.owner.phoneNumber} />
                      <DetailField label="Email" value={request.owner.email} />
                    </div>
                  </div>
                ) : null}

                {activeTab === "pet" ? (
                  <div className="rounded-[20px] border border-[#DDEBE2] bg-white p-6">
                    <h3 className="text-xl font-bold text-[#102E24]">Pet and visit</h3>
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <DetailField label="Pet" value={request.pet.name} />
                      <DetailField label="Species" value={formatSpecies(request.pet.species)} />
                      <DetailField label="Breed" value={request.pet.breed} />
                      <DetailField label="Age" value={request.pet.age ?? request.pet.approximateAgeYears?.toString()} />
                      <DetailField label="Sex" value={request.pet.sex} />
                      <DetailField label="Weight" value={request.pet.weightLbs ? `${request.pet.weightLbs} lbs` : null} />
                      <DetailField label="Visit type" value={formatVisitType(request.visitType)} />
                      <DetailField label="Timezone" value={request.timezone} />
                    </div>
                  </div>
                ) : null}

                {activeTab === "medical" ? (
                  <div className="rounded-[20px] border border-[#DDEBE2] bg-white p-6">
                    <h3 className="text-xl font-bold text-[#102E24]">Medical context</h3>
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <DetailField label="Symptoms" value={request.symptomsOrConcerns} />
                      <DetailField label="Current medications" value={request.currentMedications} />
                      <DetailField label="Previous veterinarian" value={request.previousVeterinarian} />
                      <DetailField label="Duration" value={request.symptomDuration} />
                      <DetailField label="Existing conditions" value={request.pet.existingConditions} />
                      <DetailField label="Pet medications" value={request.pet.currentMedications} />
                    </div>
                  </div>
                ) : null}

                {activeTab === "files" ? (
                  <div className="rounded-[20px] border border-[#DDEBE2] bg-white p-6">
                    <h3 className="text-xl font-bold text-[#102E24]">Attached files</h3>
                    <div className="mt-5">
                      {request.files.length > 0 ? (
                        <FilePreviewList files={request.files} />
                      ) : (
                        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-[#DDEBE2] bg-[#FAFCFA] px-6 py-10 text-center">
                          <FileText className="h-8 w-8 text-[#87A89A]" />
                          <p className="mt-3 font-bold text-[#102E24]">No files attached</p>
                          <p className="mt-1 text-sm text-[#587267]">
                            Uploaded medical records will appear here.
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : null}

                {activeTab === "audit" ? (
                  <div className="rounded-[20px] border border-[#DDEBE2] bg-white p-6">
                    <h3 className="text-xl font-bold text-[#102E24]">Audit and meta</h3>
                    <div className="mt-5 grid gap-5 md:grid-cols-2">
                      <DetailField label="Created" value={formatDateTime(request.createdAt)} />
                      <DetailField label="Updated" value={formatDateTime(request.updatedAt)} />
                      <CopyableId label="Appointment request id" value={request.id} />
                      <CopyableId label="Confirmed by staff" value={request.confirmedByStaffUserId} />
                      <CopyableId label="Calendar event id" value={request.calendarEventId} />
                      <CopyableId label="Draft id" value={request.draft?.id} />
                      <DetailField label="Draft submitted at" value={formatDateTime(request.draft?.submittedAt)} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

            <div className="sticky bottom-0 z-30 border-t border-[#E6EEE8] bg-white px-8 py-5 shadow-[0_-12px_30px_rgba(16,46,36,0.06)] max-sm:px-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div className="flex items-start gap-3">
                  <span
                    className={cn(
                      "mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-full",
                      request.calendarSyncStatus === "SYNCED"
                        ? "bg-[#DFF1E7] text-[#087C48]"
                        : request.calendarSyncStatus === "FAILED"
                          ? "bg-[#FDE4E0] text-[#C75146]"
                          : "bg-[#EEF3F0] text-[#587267]"
                    )}
                  >
                    {request.calendarSyncStatus === "SYNCED" ? (
                      <CheckCircle2 className="h-4 w-4" />
                    ) : request.calendarSyncStatus === "FAILED" ? (
                      <AlertTriangle className="h-4 w-4" />
                    ) : (
                      <RefreshCw className="h-4 w-4" />
                    )}
                  </span>
                  <div>
                    <p className="font-bold text-[#102E24]">
                      {syncReadyAfterConfirm
                        ? "Will sync after confirmation"
                        : formatCalendarSyncStatus(request.calendarSyncStatus)}
                    </p>
                    <p className="text-sm text-[#587267]">
                      {request.calendarSyncStatus === "SYNCED"
                        ? "All changes are up to date."
                        : request.calendarSyncStatus === "FAILED"
                          ? "Calendar sync needs attention."
                          : "Calendar event has not been synced yet."}
                    </p>
                  </div>
                </div>

                <div className="flex flex-col items-stretch gap-2 sm:items-end">
                  <div className="flex flex-col gap-3 sm:flex-row">
                    {request.calendarEventUrl ? (
                      <Button asChild variant="outline" className="h-12 px-6">
                        <a href={request.calendarEventUrl} target="_blank" rel="noreferrer">
                          <CalendarCheck2 className="h-4 w-4" />
                          Open event
                        </a>
                      </Button>
                    ) : null}
                    <Button
                      className="h-12 min-w-[260px] bg-[#087C48] px-7 text-base font-bold text-white hover:bg-[#07663C]"
                      disabled={primaryActionDisabled}
                      onClick={handlePrimaryAction}
                    >
                      {isRetryPrimary ? <RefreshCw className="h-4 w-4" /> : <Check className="h-4 w-4" />}
                      {primaryActionLabel}
                    </Button>
                  </div>
                  {primaryActionDisabled && !isRetryPrimary ? (
                    <p className="text-sm text-[#587267]">
                      {confirmedSlotSummary === "No confirmed slot selected"
                        ? "Select a requested time or use manual override to continue."
                        : "Save only becomes available when this step is complete."}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
