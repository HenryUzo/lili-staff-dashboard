import { useEffect, useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import {
  getAppointmentRequest,
  retryAppointmentCalendarSync,
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
  formatSpecies,
  formatStatus,
  formatVisitType,
  toDateTimeLocalValue
} from "@/lib/format";
import type { AppointmentRequestStatus } from "@/types/api";

function DetailField({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/60">{label}</p>
      <p className="text-sm leading-6 text-foreground">{value || "Not provided"}</p>
    </div>
  );
}

export function AppointmentDetailDrawer({
  appointmentId,
  open,
  onClose,
  onNavigatePrevious,
  onNavigateNext,
  canNavigatePrevious,
  canNavigateNext
}: {
  appointmentId: string | null;
  open: boolean;
  onClose: () => void;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  canNavigatePrevious?: boolean;
  canNavigateNext?: boolean;
}) {
  const queryClient = useQueryClient();
  const [nextStatus, setNextStatus] = useState<AppointmentRequestStatus | "">("");
  const [confirmedStartInput, setConfirmedStartInput] = useState("");
  const [confirmedEndInput, setConfirmedEndInput] = useState("");
  const [confirmedTimezone, setConfirmedTimezone] = useState("");
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
            ? "Appointment saved and synced to calendar."
            : "Appointment saved, but calendar sync still needs attention."
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

  useEffect(() => {
    if (!request) {
      setNextStatus("");
      setConfirmedStartInput("");
      setConfirmedEndInput("");
      setConfirmedTimezone("");
      setActionMessage(null);
      setActionError(null);
      return;
    }

    setNextStatus("");
    setConfirmedStartInput(toDateTimeLocalValue(request.confirmedStartAt));
    setConfirmedEndInput(toDateTimeLocalValue(request.confirmedEndAt));
    setConfirmedTimezone(request.confirmedTimezone ?? request.timezone ?? "");
    setActionMessage(null);
    setActionError(null);
  }, [request]);

  const selectedStatus = useMemo(
    () => nextStatus || request?.status || "",
    [nextStatus, request?.status]
  );
  const requiresConfirmedSlot = selectedStatus === "CONFIRMED";
  const confirmedStartDate = confirmedStartInput ? new Date(confirmedStartInput) : null;
  const confirmedEndDate = confirmedEndInput ? new Date(confirmedEndInput) : null;
  const confirmedSlotIsValid =
    !requiresConfirmedSlot ||
    (confirmedStartDate &&
      confirmedEndDate &&
      !Number.isNaN(confirmedStartDate.getTime()) &&
      !Number.isNaN(confirmedEndDate.getTime()) &&
      confirmedEndDate > confirmedStartDate &&
      Boolean(confirmedTimezone.trim()));
  const statusChanged = Boolean(nextStatus && request && nextStatus !== request.status);
  const confirmedSlotChanged =
    Boolean(request) &&
    selectedStatus === "CONFIRMED" &&
    (
      confirmedStartInput !== toDateTimeLocalValue(request?.confirmedStartAt) ||
      confirmedEndInput !== toDateTimeLocalValue(request?.confirmedEndAt) ||
      confirmedTimezone.trim() !== (request?.confirmedTimezone ?? request?.timezone ?? "")
    );
  const canSave =
    Boolean(request) &&
    confirmedSlotIsValid &&
    (statusChanged || confirmedSlotChanged) &&
    !updateStatusMutation.isPending;
  const isUrgent = request?.visitType === "URGENT_CARE";
  const hasSyncIssue = request?.calendarSyncStatus === "FAILED";

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
          <>
            <DialogHeader className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <DialogTitle className="font-serif text-3xl">{request.pet.name}</DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-3">
                    <span>{formatVisitType(request.visitType)}</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-4 w-4" />
                      Submitted {formatDateTime(request.createdAt)}
                    </span>
                  </DialogDescription>
                </div>
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <StatusBadge status={request.status} />
                    <CalendarSyncBadge status={request.calendarSyncStatus} />
                  </div>
                  <AppointmentPriorityBadges
                    urgent={Boolean(isUrgent)}
                    duplicate={request.possibleDuplicate}
                    syncIssue={Boolean(hasSyncIssue)}
                    compact
                  />
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">
                  Move through the active queue without closing the review surface.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm" disabled={!canNavigatePrevious} onClick={onNavigatePrevious}>
                    <ChevronLeft className="h-4 w-4" />
                    Previous
                  </Button>
                  <Button variant="outline" size="sm" disabled={!canNavigateNext} onClick={onNavigateNext}>
                    Next
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              <div className="grid gap-4 xl:grid-cols-3">
                <Card>
                  <CardHeader>
                    <CardTitle>Status</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <Select value={selectedStatus} onChange={(event) => setNextStatus(event.target.value as AppointmentRequestStatus)}>
                      {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                        <option key={status} value={status}>
                          {formatStatus(status)}
                        </option>
                      ))}
                    </Select>
                    {request.duplicateOfId ? (
                      <Alert className="border-warning/30 bg-warning/10 text-warning">
                        Possible duplicate of request {request.duplicateOfId}
                      </Alert>
                    ) : null}
                    {selectedStatus === "CANCELLED" && request.calendarEventId ? (
                      <Alert className="border-warning/30 bg-warning/10 text-warning">
                        Cancelling this appointment will attempt to remove the existing calendar event.
                      </Alert>
                    ) : null}
                    <Button
                      className="w-full"
                      disabled={!canSave}
                      onClick={() =>
                        updateStatusMutation.mutate({
                          id: request.id,
                          status: selectedStatus as AppointmentRequestStatus,
                          confirmedStartAt:
                            selectedStatus === "CONFIRMED" && confirmedStartDate
                              ? confirmedStartDate.toISOString()
                              : undefined,
                          confirmedEndAt:
                            selectedStatus === "CONFIRMED" && confirmedEndDate
                              ? confirmedEndDate.toISOString()
                              : undefined,
                          confirmedTimezone:
                            selectedStatus === "CONFIRMED" ? confirmedTimezone.trim() : undefined
                        })
                      }
                    >
                      {updateStatusMutation.isPending ? "Saving..." : "Save appointment update"}
                    </Button>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Confirmed slot</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/60">Confirmed start</p>
                      <Input
                        type="datetime-local"
                        value={confirmedStartInput}
                        onChange={(event) => setConfirmedStartInput(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/60">Confirmed end</p>
                      <Input
                        type="datetime-local"
                        value={confirmedEndInput}
                        onChange={(event) => setConfirmedEndInput(event.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/60">Timezone</p>
                      <Input
                        value={confirmedTimezone}
                        onChange={(event) => setConfirmedTimezone(event.target.value)}
                        placeholder="Africa/Lagos"
                      />
                    </div>
                    {!confirmedSlotIsValid ? (
                      <Alert>
                        Confirmed appointments require a valid start time, end time, and timezone.
                      </Alert>
                    ) : null}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Calendar sync</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <CalendarSyncBadge status={request.calendarSyncStatus} />
                      <span className="text-sm text-muted-foreground">
                        {formatCalendarSyncStatus(request.calendarSyncStatus)}
                      </span>
                    </div>
                    <DetailField label="Confirmed start" value={formatDateTime(request.confirmedStartAt)} />
                    <DetailField label="Last synced" value={formatDateTime(request.calendarSyncedAt)} />
                    {request.calendarSyncError ? (
                      <Alert className="border-warning/30 bg-warning/10 text-warning">
                        {request.calendarSyncError}
                      </Alert>
                    ) : null}
                    <div className="flex flex-wrap items-center gap-3">
                      {request.calendarEventUrl ? (
                        <Button asChild variant="outline">
                          <a href={request.calendarEventUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                            Open calendar event
                          </a>
                        </Button>
                      ) : null}
                      {request.calendarSyncStatus === "FAILED" ? (
                        <Button
                          variant="secondary"
                          disabled={retryCalendarSyncMutation.isPending}
                          onClick={() => retryCalendarSyncMutation.mutate(request.id)}
                        >
                          <RefreshCw className="h-4 w-4" />
                          {retryCalendarSyncMutation.isPending ? "Retrying..." : "Retry sync"}
                        </Button>
                      ) : null}
                    </div>
                  </CardContent>
                </Card>
              </div>

              {actionMessage ? <Alert className="border-success/30 bg-success/10 text-success">{actionMessage}</Alert> : null}
              {actionError ? <Alert className="border-destructive/30 bg-destructive/10 text-destructive">{actionError}</Alert> : null}
            </DialogHeader>

            <div className="flex-1 space-y-5 overflow-y-auto bg-background/55 p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Availability preferences</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {request.preferredSelections.length > 0 ? (
                    request.preferredSelections.map((selection) => (
                      <div key={selection.date} className="rounded-2xl border border-border bg-white p-4">
                        <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                          <CalendarClock className="h-4 w-4 text-primary" />
                          {formatDateOnly(selection.date, selection.date)}
                        </div>
                        <div className="mt-3 flex flex-wrap gap-2">
                          {selection.timeSlots.map((timeSlot) => (
                            <div key={timeSlot} className="rounded-full bg-accent px-3 py-1 text-xs font-semibold text-accent-foreground">
                              {timeSlot}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-sm text-muted-foreground">No preferred date selections were captured.</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Owner and contact</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <DetailField label="Owner" value={`${request.owner.firstName} ${request.owner.lastName}`} />
                  <DetailField label="Preferred contact" value={request.owner.preferredContactMethod} />
                  <DetailField label="Phone number" value={request.owner.phoneNumber} />
                  <DetailField label="Email" value={request.owner.email} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pet and visit details</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <DetailField label="Pet" value={request.pet.name} />
                  <DetailField label="Species" value={formatSpecies(request.pet.species)} />
                  <DetailField label="Breed" value={request.pet.breed} />
                  <DetailField label="Age" value={request.pet.age ?? request.pet.approximateAgeYears?.toString()} />
                  <DetailField label="Sex" value={request.pet.sex} />
                  <DetailField label="Weight" value={request.pet.weightLbs ? `${request.pet.weightLbs} lbs` : null} />
                  <DetailField label="Visit type" value={formatVisitType(request.visitType)} />
                  <DetailField label="Timezone" value={request.timezone} />
                </CardContent>
              </Card>

              <Card>
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

              <Card>
                <CardHeader>
                  <CardTitle>Attached files</CardTitle>
                </CardHeader>
                <CardContent>
                  <FilePreviewList files={request.files} />
                </CardContent>
              </Card>

              <Card>
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
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
