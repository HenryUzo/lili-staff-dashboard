import { useQuery } from "@tanstack/react-query";
import { CalendarClock, ChevronLeft, ChevronRight } from "lucide-react";
import { getErrorMessage } from "@/api/http";
import { getNewPatientRequest } from "@/api/new-patients";
import { ErrorState } from "@/components/dashboard/error-state";
import { FilePreviewList } from "@/components/dashboard/file-preview-list";
import { QueuePriorityBadges } from "@/components/dashboard/queue-priority-badges";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { formatDateTime, formatSpecies } from "@/lib/format";

function DetailField({ label, value }: { label: string; value?: string | number | null | boolean }) {
  return (
    <div className="space-y-1">
      <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary/60">{label}</p>
      <p className="text-sm leading-6 text-foreground">
        {typeof value === "boolean" ? (value ? "Yes" : "No") : value || "Not provided"}
      </p>
    </div>
  );
}

export function NewPatientDetailDrawer({
  requestId,
  open,
  onClose,
  onNavigatePrevious,
  onNavigateNext,
  canNavigatePrevious,
  canNavigateNext
}: {
  requestId: string | null;
  open: boolean;
  onClose: () => void;
  onNavigatePrevious?: () => void;
  onNavigateNext?: () => void;
  canNavigatePrevious?: boolean;
  canNavigateNext?: boolean;
}) {
  const detailQuery = useQuery({
    queryKey: ["new-patient-request", requestId],
    queryFn: () => getNewPatientRequest(requestId!),
    enabled: Boolean(requestId)
  });

  const request = detailQuery.data;

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
              title="Could not load new patient detail"
              description={getErrorMessage(detailQuery.error)}
              onRetry={() => detailQuery.refetch()}
            />
          </div>
        ) : request ? (
          <>
            <DialogHeader className="space-y-4">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <DialogTitle className="font-serif text-3xl">{request.petName}</DialogTitle>
                  <DialogDescription className="flex flex-wrap items-center gap-3">
                    <span>{formatSpecies(request.species)}</span>
                    <span className="inline-flex items-center gap-1">
                      <CalendarClock className="h-4 w-4" />
                      Submitted {formatDateTime(request.createdAt)}
                    </span>
                  </DialogDescription>
                </div>
                <QueuePriorityBadges urgent={request.isUrgent} duplicate={request.possibleDuplicate} />
              </div>
              {request.duplicateOfId ? (
                <div className="rounded-2xl bg-warning/10 px-4 py-3 text-sm text-warning">
                  Possible duplicate of request {request.duplicateOfId}
                </div>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-sm text-muted-foreground">Review requests in queue order without leaving the drawer.</p>
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
            </DialogHeader>

            <div className="flex-1 space-y-5 overflow-y-auto bg-background/55 p-6">
              <Card>
                <CardHeader>
                  <CardTitle>Owner information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <DetailField label="Owner name" value={request.ownerFullName} />
                  <DetailField label="Phone number" value={request.ownerPhoneNumber} />
                  <DetailField label="Email" value={request.ownerEmail} />
                  <DetailField label="Electronic comms consent" value={request.consentToElectronicComms} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Pet information</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <DetailField label="Pet name" value={request.petName} />
                  <DetailField label="Species" value={formatSpecies(request.species)} />
                  <DetailField label="Breed" value={request.breed} />
                  <DetailField label="Age" value={request.age} />
                  <DetailField label="Sex" value={request.sex} />
                  <DetailField label="Weight" value={request.weightLbs ? `${request.weightLbs} lbs` : null} />
                  <DetailField label="Spayed or neutered" value={request.spayedNeutered} />
                  <DetailField label="Current medications" value={request.currentMedications} />
                  <DetailField label="Existing conditions" value={request.existingConditions} />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Visit request</CardTitle>
                </CardHeader>
                <CardContent className="grid gap-5 md:grid-cols-2">
                  <DetailField label="Reason for visit" value={request.reasonForVisit} />
                  <DetailField label="Urgent" value={request.isUrgent} />
                  <DetailField label="Preferred date and time" value={formatDateTime(request.preferredDateTime)} />
                  <DetailField label="Timezone" value={request.timezone} />
                  <DetailField label="Previous vet clinic" value={request.previousVetClinic} />
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
