import { useEffect, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  FileText,
  Mail,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import {
  getAppointmentRequest,
  retryAppointmentCalendarSync,
  sendAppointmentRescheduleLink,
  updateAppointmentStatus
} from "@/api/appointments";
import { getErrorMessage } from "@/api/http";
import { AppointmentPriorityBadges } from "@/components/dashboard/appointment-priority-badges";
import { CalendarSyncBadge } from "@/components/dashboard/calendar-sync-badge";
import { ErrorState } from "@/components/dashboard/error-state";
import { FilePreviewList } from "@/components/dashboard/file-preview-list";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Alert } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { APPOINTMENT_STATUS_OPTIONS } from "@/lib/constants";
import {
  formatCalendarSyncStatus,
  formatDateOnly,
  formatDateTime,
  formatPreferredSelections,
  formatSpecies,
  formatStatus,
  formatVisitType,
  toDateTimeLocalValue
} from "@/lib/format";
import {
  hasAnyFuturePreferredSelection,
  hasPastConfirmedStart,
  hasStalePendingReviewRequest,
  isPastPreferredSelection
} from "@/lib/appointment-state";
import { cn } from "@/lib/utils";
import type {
  AppointmentPreferredSelection,
  AppointmentRequestStatus
} from "@/types/api";

const DEFAULT_APPOINTMENT_MINUTES = 60;
const detailSections = [
  { id: "owner-contact", label: "Contact" },
  { id: "pet-visit", label: "Pet" },
  { id: "medical-context", label: "Medical" },
  { id: "attached-files", label: "Files" },
  { id: "audit-meta", label: "Audit" }
] as const;

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

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/60">{label}</p>
      <p className="text-sm leading-6 text-foreground">{value || "Not provided"}</p>
    </div>
  );
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
  const detailsScrollRef = useRef<HTMLDivElement | null>(null);
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
      return;
    }

    const confirmedStartValue = toDateTimeLocalValue(request.confirmedStartAt);
    const requestedSlotValues = flattenPreferredSelections(request.preferredSelections).flatMap((selection) =>
      selection.startValue ? [selection.startValue] : []
    );

    setNextStatus("");
    setConfirmedStartInput(confirmedStartValue);
    setConfirmedEndInput(toDateTimeLocalValue(request.confirmedEndAt));
    setConfirmedTimezone(request.confirmedTimezone ?? request.timezone ?? "");
    setResponseDeadlineInput(
      request.rescheduleResponseDeadline
        ? toDateTimeLocalValue(request.rescheduleResponseDeadline)
        : defaultResponseDeadlineInput()
    );
    setManualOverrideEnabled(
      Boolean(confirmedStartValue) &&
        requestedSlotValues.length > 0 &&
        !requestedSlotValues.includes(confirmedStartValue)
    );
    setActionMessage(null);
    setActionError(null);
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
  const shouldUseRequestedSlotFlow =
    requiresConfirmedSlot && hasFutureRequestedSelections && !manualOverrideEnabled && !staleConfirmationBlocked;
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
  const primaryActionLabel =
    selectedStatus === "CONFIRMED"
      ? request?.status === "CONFIRMED"
        ? "Save confirmed appointment"
        : "Confirm appointment"
      : selectedStatus === "CANCELLED"
        ? "Cancel appointment"
        : `Save ${formatStatus(selectedStatus as AppointmentRequestStatus).toLowerCase()}`;

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

  function scrollToDetailsSection(sectionId: (typeof detailSections)[number]["id"]) {
    const container = detailsScrollRef.current;
    const section = document.getElementById(sectionId);

    if (!container || !section) {
      return;
    }

    const containerRect = container.getBoundingClientRect();
    const sectionRect = section.getBoundingClientRect();
    const nextTop = container.scrollTop + (sectionRect.top - containerRect.top) - 88;

    container.scrollTo({
      top: Math.max(nextTop, 0),
      behavior: "smooth"
    });
  }

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent>
        {detailQuery.isLoading ? (
          <div className="space-y-5 p-6">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-72 w-full" />
          </div>
        ) : detailQuery.isError ? (
          <div className="p-6">
            <ErrorState
              title="Could not load appointment detail"
              description={getErrorMessage(detailQuery.error)}
              onRetry={() => detailQuery.refetch()}
            />
          </div>
        ) : request ? (
          <div ref={detailsScrollRef} className="flex-1 overflow-y-auto">
            <DialogHeader className="space-y-4 bg-white">
              <div className="flex flex-col gap-4 border-b border-border/70 pb-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <DialogTitle className="font-serif text-3xl">{request.pet.name}</DialogTitle>
                    <DialogDescription className="flex flex-wrap items-center gap-3">
                      <span>{formatVisitType(request.visitType)}</span>
                      <span className="inline-flex items-center gap-1">
                        <CalendarClock className="h-4 w-4" />
                        Submitted {formatDateTime(request.createdAt)}
                      </span>
                    </DialogDescription>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={request.status} />
                    <CalendarSyncBadge status={request.calendarSyncStatus} />
                    <AppointmentPriorityBadges
                      urgent={Boolean(isUrgent)}
                      stale={isStalePendingReview}
                      duplicate={request.possibleDuplicate}
                      syncIssue={Boolean(hasSyncIssue)}
                      compact
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start">
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={!canNavigatePrevious}
                    onClick={onNavigatePrevious}
                  >
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={!canNavigateNext} onClick={onNavigateNext}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="rounded-3xl border border-border bg-secondary/35 p-5">
                <div className="space-y-5">
                  <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-1">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/60">
                        Review appointment
                      </p>
                      <h3 className="text-2xl font-semibold text-foreground">
                        Choose a status and save it.
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        If you confirm the appointment, add a time. Everything else is secondary.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      className="shrink-0 self-start rounded-full border-primary/20 bg-white text-primary hover:bg-primary/5"
                      onClick={() => scrollToDetailsSection("owner-contact")}
                    >
                      <FileText className="h-4 w-4" />
                      View full details
                    </Button>
                  </div>

                  <div className="rounded-[26px] border border-border bg-white p-5">
                    <div className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
                      <div className="space-y-4">
                        <div className="space-y-2">
                          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/60">
                            Status
                          </p>
                          <Select
                            value={selectedStatus}
                            onChange={(event) =>
                              setNextStatus(event.target.value as AppointmentRequestStatus)
                            }
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

                        <div className="rounded-2xl border border-border bg-secondary/25 p-4">
                          <p className="text-sm font-medium text-foreground">
                            {request.owner.firstName} {request.owner.lastName}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {request.owner.phoneNumber}
                          </p>
                          <p className="mt-3 text-sm text-muted-foreground">
                            {request.owner.preferredContactMethod || "Preferred contact not provided"}
                          </p>
                          <p className="mt-1 text-sm text-muted-foreground">
                            {request.timezone || "Timezone not provided"}
                          </p>
                        </div>

                        {request.status === "OVERDUE" ? (
                          <div className="space-y-4 rounded-2xl border border-destructive/15 bg-destructive/5 p-4">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-destructive/80">
                                Reschedule outreach
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Send the applicant a secure email link to choose new preferred dates.
                              </p>
                            </div>

                            <div className="space-y-2">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/60">
                                Response deadline
                              </p>
                              <Input
                                type="datetime-local"
                                value={responseDeadlineInput}
                                onChange={(event) => setResponseDeadlineInput(event.target.value)}
                              />
                            </div>

                            <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
                              <p>
                                State:{" "}
                                <span className="font-semibold text-foreground">
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
                                onClick={() =>
                                  onOpenReplacement(request.replacementAppointmentRequestId!)
                                }
                              >
                                <ExternalLink className="h-4 w-4" />
                                Open replacement request
                              </Button>
                            ) : null}

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
                              {sendRescheduleLinkMutation.isPending
                                ? "Sending..."
                                : "Send reschedule email"}
                            </Button>

                            {!responseDeadlineIsValid ? (
                              <Alert className="border-destructive/30 bg-destructive/10 text-destructive">
                                Choose a valid future deadline before sending the reschedule email.
                              </Alert>
                            ) : null}
                          </div>
                        ) : null}
                      </div>

                      <div className="space-y-4">
                        <div className="rounded-2xl border border-border bg-secondary/15 p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/60">
                                Requested availability
                              </p>
                              <p className="mt-1 text-sm text-muted-foreground">
                                Start from the client-requested times before confirming manually.
                              </p>
                            </div>
                            <div className="rounded-full bg-secondary px-3 py-1 text-xs font-medium text-muted-foreground">
                              {formatPreferredSelections(request.preferredSelections)}
                            </div>
                          </div>

                          <div className="mt-4 space-y-3">
                            {request.preferredSelections.length > 0 ? (
                              request.preferredSelections.map((selection) => (
                                <div
                                  key={selection.date}
                                  className="rounded-2xl border border-border bg-white p-4"
                                >
                                  <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                                    <CalendarClock className="h-4 w-4 text-primary" />
                                    {formatDateOnly(selection.date, selection.date)}
                                  </div>
                                  <div className="mt-3 flex flex-wrap gap-2">
                                    {selection.timeSlots.map((timeSlot) => {
                                      const quickStartValue = createQuickSelectionValue(
                                        selection.date,
                                        timeSlot
                                      );
                                      const isPastSlot = isPastPreferredSelection(
                                        selection.date,
                                        timeSlot,
                                        request.timezone || confirmedTimezone || "Africa/Lagos"
                                      );
                                      const isSelected =
                                        Boolean(quickStartValue) && quickStartValue === confirmedStartInput;

                                      return (
                                        <button
                                          key={timeSlot}
                                          type="button"
                                          onClick={() => applyQuickSelection(selection.date, timeSlot)}
                                          disabled={!quickStartValue || isPastSlot}
                                          className={cn(
                                            "rounded-full border px-3 py-1 text-xs font-semibold transition",
                                            isPastSlot
                                              ? "cursor-not-allowed border-border bg-secondary text-muted-foreground/70"
                                              : isSelected
                                              ? "border-primary bg-primary text-primary-foreground"
                                              : quickStartValue
                                                ? "border-border bg-accent text-accent-foreground hover:bg-accent/80"
                                                : "cursor-not-allowed border-border bg-secondary text-muted-foreground"
                                          )}
                                        >
                                          {timeSlot}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="rounded-2xl border border-border bg-white p-4 text-sm text-muted-foreground">
                                No preferred date selections were captured. Confirm manually if needed.
                              </div>
                            )}
                          </div>
                        </div>

                        {selectedStatus === "CONFIRMED" ? (
                          <div className="space-y-4 rounded-2xl border border-border bg-white p-4">
                            <div className="space-y-1">
                              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/60">
                                Confirmed slot
                              </p>
                              <p className="text-sm text-muted-foreground">
                                {staleConfirmationBlocked
                                  ? "All requested times have already passed. This request needs outreach instead of confirmation."
                                  : hasRequestedSelections
                                  ? "Select one of the applicant's preferred times first. Only use manual override when needed."
                                  : "No preferred slots were captured, so confirm manually."}
                              </p>
                            </div>

                            {hasFutureRequestedSelections ? (
                              <div className="space-y-3 rounded-2xl border border-border bg-secondary/10 p-4">
                                <p className="text-sm font-semibold text-foreground">
                                  Available requested times
                                </p>
                                <div className="space-y-3">
                                  {request.preferredSelections.map((selection) => {
                                    const availableTimeSlots = selection.timeSlots.filter((timeSlot) =>
                                      !isPastPreferredSelection(
                                        selection.date,
                                        timeSlot,
                                        request.timezone || confirmedTimezone || "Africa/Lagos"
                                      )
                                    );

                                    if (availableTimeSlots.length === 0) {
                                      return null;
                                    }

                                    return (
                                    <div key={`confirmed-${selection.date}`}>
                                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                                        <CalendarClock className="h-4 w-4 text-primary" />
                                        {formatDateOnly(selection.date, selection.date)}
                                      </div>
                                      <div className="mt-2 flex flex-wrap gap-2">
                                        {availableTimeSlots.map((timeSlot) => {
                                          const quickStartValue = createQuickSelectionValue(
                                            selection.date,
                                            timeSlot
                                          );
                                          const isSelected =
                                            Boolean(quickStartValue) &&
                                            quickStartValue === confirmedStartInput;

                                          return (
                                            <button
                                              key={`confirmed-${selection.date}-${timeSlot}`}
                                              type="button"
                                              onClick={() =>
                                                applyQuickSelection(selection.date, timeSlot)
                                              }
                                              disabled={!quickStartValue}
                                              className={cn(
                                                "rounded-full border px-3 py-1 text-xs font-semibold transition",
                                                isSelected
                                                  ? "border-primary bg-primary text-primary-foreground"
                                                  : quickStartValue
                                                    ? "border-border bg-white text-foreground hover:bg-accent"
                                                    : "cursor-not-allowed border-border bg-secondary text-muted-foreground"
                                              )}
                                            >
                                              {timeSlot}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}

                            {staleConfirmationBlocked ? (
                              <Alert className="border-destructive/30 bg-destructive/10 text-destructive">
                                This request can no longer be confirmed because all requested times have passed.
                              </Alert>
                            ) : shouldUseRequestedSlotFlow ? (
                              <>
                                {selectedQuickSelection ? (
                                  <div className="rounded-2xl border border-primary/15 bg-primary/5 p-4">
                                    <p className="text-sm font-semibold text-foreground">
                                      Confirming requested time
                                    </p>
                                    <p className="mt-2 text-sm text-muted-foreground">
                                      {formatDateOnly(selectedQuickSelection.date, selectedQuickSelection.date)} at{" "}
                                      {selectedQuickSelection.timeSlot}
                                    </p>
                                    <p className="mt-1 text-sm text-muted-foreground">
                                      Ends {confirmedEndInput ? confirmedEndInput.replace("T", " ") : "Not provided"} •{" "}
                                      {confirmedTimezone || request.timezone || "Timezone not provided"}
                                    </p>
                                  </div>
                                ) : (
                                  <Alert className="border-destructive/30 bg-destructive/10 text-destructive">
                                    Select one preferred time before confirming this appointment.
                                  </Alert>
                                )}

                                <Button
                                  type="button"
                                  variant="ghost"
                                  className="px-0 text-primary hover:bg-transparent hover:text-primary/80"
                                  onClick={() => setManualOverrideEnabled(true)}
                                >
                                  Use a different time
                                </Button>
                              </>
                            ) : (
                              <>
                                {hasFutureRequestedSelections ? (
                                  <Alert className="border-warning/30 bg-warning/10 text-warning">
                                    You are overriding the applicant's preferred times. Confirm manually only if no requested slot works.
                                  </Alert>
                                ) : null}

                                <div className="grid gap-4 md:grid-cols-2">
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/60">
                                      Confirmed start
                                    </p>
                                    <Input
                                      type="datetime-local"
                                      value={confirmedStartInput}
                                      onChange={(event) => {
                                        const nextValue = event.target.value;
                                        setConfirmedStartInput(nextValue);

                                        if (
                                          !confirmedEndInput ||
                                          new Date(confirmedEndInput) <= new Date(nextValue)
                                        ) {
                                          setConfirmedEndInput(addMinutesToInputValue(nextValue));
                                        }
                                      }}
                                    />
                                  </div>
                                  <div className="space-y-2">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/60">
                                      Confirmed end
                                    </p>
                                    <Input
                                      type="datetime-local"
                                      value={confirmedEndInput}
                                      onChange={(event) => setConfirmedEndInput(event.target.value)}
                                    />
                                  </div>
                                  <div className="space-y-2 md:col-span-2">
                                    <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/60">
                                      Timezone
                                    </p>
                                    <Input
                                      value={confirmedTimezone}
                                      onChange={(event) => setConfirmedTimezone(event.target.value)}
                                      placeholder="Africa/Lagos"
                                    />
                                  </div>
                                </div>

                                {hasRequestedSelections ? (
                                  <Button
                                    type="button"
                                    variant="ghost"
                                    className="px-0 text-primary hover:bg-transparent hover:text-primary/80"
                                    onClick={() => {
                                      setManualOverrideEnabled(false);

                                      if (selectedQuickSelection) {
                                        applyQuickSelection(
                                          selectedQuickSelection.date,
                                          selectedQuickSelection.timeSlot
                                        );
                                        return;
                                      }

                                      setConfirmedStartInput("");
                                      setConfirmedEndInput("");
                                      setConfirmedTimezone(request.timezone ?? "");
                                    }}
                                  >
                                    Back to requested times
                                  </Button>
                                ) : null}

                                {!confirmedSlotIsValid ? (
                                  <Alert className="border-destructive/30 bg-destructive/10 text-destructive">
                                    {confirmedStartInPast
                                      ? "Confirmed appointment time must be in the future."
                                      : "Add a valid start time, end time, and timezone before confirming."}
                                  </Alert>
                                ) : null}
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="rounded-2xl border border-border bg-secondary/25 p-4 text-sm text-muted-foreground">
                            No scheduling details are needed for this status.
                          </div>
                        )}
                      </div>
                    </div>

                    {isStalePendingReview ? (
                      <Alert className="mt-4 border-warning/30 bg-warning/10 text-warning">
                        All applicant-requested times are now in the past. This request still needs review, but it is
                        not a confirmed overdue appointment.
                      </Alert>
                    ) : null}

                    {request.duplicateOfId ? (
                      <Alert className="mt-4 border-warning/30 bg-warning/10 text-warning">
                        Possible duplicate of request {request.duplicateOfId}
                      </Alert>
                    ) : null}

                    {selectedStatus === "CANCELLED" && request.calendarEventId ? (
                      <Alert className="mt-4 border-warning/30 bg-warning/10 text-warning">
                        Cancelling this appointment will also attempt to remove the calendar event.
                      </Alert>
                    ) : null}

                    {actionMessage ? (
                      <Alert className="mt-4 border-success/30 bg-success/10 text-success">
                        {actionMessage}
                      </Alert>
                    ) : null}
                    {actionError ? (
                      <Alert className="mt-4 border-destructive/30 bg-destructive/10 text-destructive">
                        {actionError}
                      </Alert>
                    ) : null}

                    <div className="mt-5 flex flex-wrap items-center gap-3 border-t border-border pt-5">
                      <Button
                        className="min-w-[220px]"
                        disabled={!canSave}
                        onClick={() =>
                          updateStatusMutation.mutate({
                            id: request.id,
                            status: selectedStatus as AppointmentRequestStatus,
                            confirmedStartAt:
                              selectedStatus === "CONFIRMED" && confirmedStartIso
                                ? confirmedStartIso
                                : undefined,
                            confirmedEndAt:
                              selectedStatus === "CONFIRMED" && confirmedEndIso
                                ? confirmedEndIso
                                : undefined,
                            confirmedTimezone:
                              selectedStatus === "CONFIRMED" ? confirmedTimezone.trim() : undefined
                          })
                        }
                      >
                        {updateStatusMutation.isPending ? "Saving..." : primaryActionLabel}
                      </Button>
                      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                        <span>Save only becomes available when this step is complete.</span>
                        <div className="flex flex-wrap items-center gap-2">
                          <CalendarSyncBadge status={request.calendarSyncStatus} />
                          <span>
                            {syncReadyAfterConfirm
                              ? "Will sync after confirmation"
                              : formatCalendarSyncStatus(request.calendarSyncStatus)}
                          </span>
                        </div>
                        {request.calendarEventUrl ? (
                          <Button asChild variant="outline" size="sm">
                            <a href={request.calendarEventUrl} target="_blank" rel="noreferrer">
                              <ExternalLink className="h-4 w-4" />
                              Open event
                            </a>
                          </Button>
                        ) : null}
                        {request.calendarSyncStatus === "FAILED" ? (
                          <Button
                            variant="secondary"
                            size="sm"
                            disabled={retryCalendarSyncMutation.isPending}
                            onClick={() => retryCalendarSyncMutation.mutate(request.id)}
                          >
                            <RefreshCw className="h-4 w-4" />
                            {retryCalendarSyncMutation.isPending ? "Retrying..." : "Retry sync"}
                          </Button>
                        ) : null}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </DialogHeader>

            <div className="space-y-5 bg-background/55 p-6">
              <div className="sticky top-0 z-10 -mt-2 border-b border-border/70 bg-background/95 pb-4 pt-2 backdrop-blur">
                <div className="flex flex-wrap gap-2">
                  {detailSections.map((section) => (
                    <button
                      key={section.id}
                      type="button"
                      onClick={() => scrollToDetailsSection(section.id)}
                      className="rounded-full border border-border bg-white px-3 py-1.5 text-sm font-medium text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                    >
                      {section.label}
                    </button>
                  ))}
                </div>
              </div>

              <Card id="owner-contact" className="scroll-mt-24">
                <CardHeader>
                  <CardTitle>Owner contact</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <DetailField label="Owner" value={`${request.owner.firstName} ${request.owner.lastName}`} />
                  <DetailField label="Preferred contact" value={request.owner.preferredContactMethod} />
                  <DetailField label="Phone number" value={request.owner.phoneNumber} />
                  <DetailField label="Email" value={request.owner.email} />
                </CardContent>
              </Card>

              <Card id="pet-visit" className="scroll-mt-24">
                <CardHeader>
                  <CardTitle>Pet and visit</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <DetailField label="Pet" value={request.pet.name} />
                  <DetailField label="Species" value={formatSpecies(request.pet.species)} />
                  <DetailField label="Breed" value={request.pet.breed} />
                  <DetailField label="Age" value={request.pet.age ?? request.pet.approximateAgeYears?.toString()} />
                  <DetailField label="Sex" value={request.pet.sex} />
                  <DetailField
                    label="Weight"
                    value={request.pet.weightLbs ? `${request.pet.weightLbs} lbs` : null}
                  />
                  <DetailField label="Visit type" value={formatVisitType(request.visitType)} />
                  <DetailField label="Timezone" value={request.timezone} />
                </CardContent>
              </Card>

              <Card id="medical-context" className="scroll-mt-24">
                <CardHeader>
                  <CardTitle>Medical context</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <DetailField label="Symptoms" value={request.symptomsOrConcerns} />
                  <DetailField label="Current medications" value={request.currentMedications} />
                  <DetailField label="Previous veterinarian" value={request.previousVeterinarian} />
                  <DetailField label="Duration" value={request.symptomDuration} />
                  <DetailField label="Existing conditions" value={request.pet.existingConditions} />
                  <DetailField label="Pet medications" value={request.pet.currentMedications} />
                </CardContent>
              </Card>

              <Card id="attached-files" className="scroll-mt-24">
                <CardHeader>
                  <CardTitle>Attached files</CardTitle>
                </CardHeader>
                <CardContent>
                  <FilePreviewList files={request.files} />
                </CardContent>
              </Card>

              <Card id="audit-meta" className="scroll-mt-24">
                <CardHeader>
                  <CardTitle>Audit and meta</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <DetailField label="Created" value={formatDateTime(request.createdAt)} />
                  <DetailField label="Updated" value={formatDateTime(request.updatedAt)} />
                  <DetailField label="Confirmed by staff" value={request.confirmedByStaffUserId} />
                  <DetailField label="Calendar event id" value={request.calendarEventId} />
                  <DetailField label="Draft id" value={request.draft?.id} />
                  <DetailField label="Draft submitted at" value={formatDateTime(request.draft?.submittedAt)} />
                </CardContent>
              </Card>
            </div>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
