import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarClock } from "lucide-react";
import { toast } from "sonner";
import { getAppointmentRequest, updateAppointmentStatus } from "@/api/appointments";
import { getErrorMessage } from "@/api/http";
import { DuplicateBadge } from "@/components/dashboard/duplicate-badge";
import { ErrorState } from "@/components/dashboard/error-state";
import { FilePreviewList } from "@/components/dashboard/file-preview-list";
import { StatusBadge } from "@/components/dashboard/status-badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Select } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { APPOINTMENT_STATUS_OPTIONS } from "@/lib/constants";
import { formatDateOnly, formatDateTime, formatSpecies, formatStatus, formatVisitType } from "@/lib/format";
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
  onClose
}: {
  appointmentId: string | null;
  open: boolean;
  onClose: () => void;
}) {
  const queryClient = useQueryClient();
  const [nextStatus, setNextStatus] = useState<AppointmentRequestStatus | "">("");
  const detailQuery = useQuery({
    queryKey: ["appointment-request", appointmentId],
    queryFn: () => getAppointmentRequest(appointmentId!),
    enabled: Boolean(appointmentId)
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }: { id: string; status: AppointmentRequestStatus }) =>
      updateAppointmentStatus(id, status),
    onSuccess: async () => {
      toast.success("Appointment status updated");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["appointment-requests"] }),
        queryClient.invalidateQueries({ queryKey: ["appointment-request", appointmentId] }),
        queryClient.invalidateQueries({ queryKey: ["overview"] })
      ]);
    },
    onError: (error) => {
      toast.error(getErrorMessage(error, "Unable to update appointment status"));
    }
  });

  const request = detailQuery.data;
  const selectedStatus = useMemo(
    () => nextStatus || request?.status || "",
    [nextStatus, request?.status]
  );

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
                <div className="flex flex-wrap items-center gap-2">
                  <StatusBadge status={request.status} />
                  <DuplicateBadge duplicate={request.possibleDuplicate} urgent={request.visitType === "URGENT_CARE"} />
                </div>
              </div>

              <div className="grid gap-3 lg:grid-cols-[1fr_220px_auto]">
                <Select value={selectedStatus} onChange={(event) => setNextStatus(event.target.value as AppointmentRequestStatus)}>
                  {APPOINTMENT_STATUS_OPTIONS.map((status) => (
                    <option key={status} value={status}>
                      {formatStatus(status)}
                    </option>
                  ))}
                </Select>
                <Button
                  disabled={!nextStatus || nextStatus === request.status || updateStatusMutation.isPending}
                  onClick={() => updateStatusMutation.mutate({ id: request.id, status: nextStatus as AppointmentRequestStatus })}
                >
                  {updateStatusMutation.isPending ? "Saving..." : "Update status"}
                </Button>
                {request.duplicateOfId ? (
                  <div className="rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning">
                    Possible duplicate of request {request.duplicateOfId}
                  </div>
                ) : null}
              </div>
            </DialogHeader>

            <div className="flex-1 space-y-5 overflow-y-auto bg-background/55 p-6">
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
            </div>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
